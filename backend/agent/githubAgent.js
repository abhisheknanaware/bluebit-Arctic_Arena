import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

// Helper to get GitHub API instance
const getGitHub = (token) => axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
});

// Configure LangGraph Tools
const createTools = async (owner, repo, token) => {
    const gh = getGitHub(token);

    const getFileContent = tool(async ({ path }) => {
        try {
            const res = await gh.get(`/repos/${owner}/${repo}/contents/${path}`);
            if (res.data.content && res.data.encoding === 'base64') {
                return Buffer.from(res.data.content, 'base64').toString('utf-8');
            }
            return 'File content could not be read (might be a directory or binary).';
        } catch (e) {
            return `Error reading file ${path}: ${e.message}`;
        }
    }, {
        name: 'get_file_content',
        description: 'Read the contents of a specific file in the repository.',
        schema: z.object({ path: z.string().describe('The file path (e.g., src/App.jsx)') })
    });

    const searchFiles = tool(async ({ query }) => {
        try {
            const res = await gh.get(`/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`);
            return res.data.items.slice(0, 5).map(i => i.path).join(', ');
        } catch (e) {
            return `Error searching files: ${e.message}`;
        }
    }, {
        name: 'search_files',
        description: 'Search the repository files for a specific keyword or query. Returns up to 5 matching file paths.',
        schema: z.object({ query: z.string().describe('The search query keyword') })
    });

    const getCommitDetails = tool(async ({ sha }) => {
        try {
            const res = await gh.get(`/repos/${owner}/${repo}/commits/${sha}`);
            const data = res.data;
            const filesChanged = data.files.map(f => `${f.status}: ${f.filename}`).join(', ');
            return `Author: ${data.commit.author.name}\nMessage: ${data.commit.message}\nFiles Changed: ${filesChanged}`;
        } catch (e) {
            return `Error fetching commit ${sha}: ${e.message}`;
        }
    }, {
        name: 'get_commit_details',
        description: 'Get detailed information about a specific commit, including the commit message and affected files.',
        schema: z.object({ sha: z.string().describe('The full or short commit SHA hash') })
    });

    const getContributors = tool(async () => {
        try {
            const res = await gh.get(`/repos/${owner}/${repo}/contributors?per_page=100`);
            const contributors = res.data;
            const summary = contributors.map(c => `${c.login} (${c.contributions} commits)`).join(', ');
            return `There are ${contributors.length} top contributors. Here they are with their commit counts: ${summary}`;
        } catch (e) {
            return `Error fetching contributors: ${e.message}`;
        }
    }, {
        name: 'get_contributors',
        description: 'Get the list of contributors for the repository, including their usernames and total number of commits.',
        schema: z.object({}) // No arguments needed, it uses the repo context
    });

    // Dynamically load ALL GitHub tools from the standard MCP Server
    let mcpTools = [];
    try {
        const mcpClient = new MultiServerMCPClient({
            github: {
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-github"],
                env: {
                    ...process.env,
                    GITHUB_PERSONAL_ACCESS_TOKEN: token || process.env.GITHUB_TOKEN
                }
            }
        });
        mcpTools = await mcpClient.getTools();
        console.log(`🔌 Loaded ${mcpTools.length} tools from GitHub MCP server.`);
    } catch (err) {
        console.error("⚠️ Failed to load MCP tools:", err.message);
    }

    // Combine custom context-aware tools with the massive generic MCP toolkit
    return [...mcpTools, getFileContent, searchFiles, getCommitDetails, getContributors];
};

// Define and compile the LangGraph agent
export const createGitHubAgent = async (owner, repo, token) => {
    // Enable LangSmith tracing if API key is present
    if (process.env.LANGCHAIN_API_KEY) {
        process.env.LANGCHAIN_TRACING_V2 = "true";
        process.env.LANGCHAIN_PROJECT = "Git-History-Traveller";
    }

    const tools = await createTools(owner, repo, token);

    // Dynamically select LLM provider: OpenAI GPT-4o is preferred for maximum reasoning power.
    // Fallback to Groq for speed if OpenAI is unavailable.
    let llm;
    if (process.env.OPENAI_API_KEY) {
        llm = new ChatOpenAI({
            modelName: 'gpt-4o',
            temperature: 0,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        console.log("🤖 Agent initialized with OpenAI (gpt-4o) for maximum power");
    } else if (process.env.GROQ_API_KEY) {
        llm = new ChatOpenAI({
            modelName: 'llama3-70b-8192', // Groq's fast Llama 3 model
            temperature: 0,
            streaming: true,
            openAIApiKey: process.env.GROQ_API_KEY,
            configuration: {
                baseURL: "https://api.groq.com/openai/v1"
            }
        });
        console.log("🤖 Agent initialized with Groq (llama3-70b-8192) for speed");
    } else {
        throw new Error("No API key available. Set OPENAI_API_KEY or GROQ_API_KEY.");
    }

    // Bind tools to the model
    const llmWithTools = llm.bindTools(tools);

    // Router logic: define when to call tools vs finish
    const shouldContinue = (state) => {
        const { messages } = state;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools";
        }
        return "__end__";
    };

    // Core node: calls the model
    const callModel = async (state) => {
        const { messages } = state;

        const systemPrompt = new SystemMessage(
            `You are an expert AI software engineering assistant integrated into a Git Repository Visualization dashboard. You have autonomous, god-mode access to the ${owner}/${repo} repository via GitHub MCP tools.
            
            RULES & BEHAVIORS:
            1. You are a senior engineer. Do not use overly enthusiastic or generic customer-support greetings/sign-offs. Get straight to the technical point.
            2. ALWAYS format your responses using rich GitHub-flavored Markdown. Use bolding, bullet points, headers, and code blocks to make your response extremely readable.
            3. If asked about contributors, files, or commits, USE YOUR TOOLS to fetch the real data before answering. Do not hallucinate or guess.
            4. Do not repeat facts you have already stated in the conversation history.`
        );

        const messagesWithSystem = messages.length > 0 && messages[0]?._getType() === 'system'
            ? messages
            : [systemPrompt, ...messages];

        const response = await llmWithTools.invoke(messagesWithSystem);
        return { messages: [response] };
    };

    // Tools node: executes the bound tools
    const callTools = async (state) => {
        const { messages } = state;
        const lastMessage = messages[messages.length - 1];
        const toolCalls = lastMessage.tool_calls;

        const results = await Promise.all(toolCalls.map(async (tc) => {
            const tool = tools.find(t => t.name === tc.name);
            const resultMsg = await tool.invoke(tc);
            return resultMsg;
        }));

        return { messages: results };
    };

    const workflow = new StateGraph(MessagesAnnotation)
        .addNode("agent", callModel)
        .addNode("tools", callTools)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shouldContinue, { tools: "tools", __end__: "__end__" })
        .addEdge("tools", "agent");

    return workflow.compile();
};
