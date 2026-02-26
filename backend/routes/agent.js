import express from 'express';
import { HumanMessage } from '@langchain/core/messages';
import { createGitHubAgent } from '../agent/githubAgent.js';

const router = express.Router();

// Helper to parse repo url inside backend if needed
const parseGitHubUrl = (url) => {
    const match = url.replace(/\/$/, '').match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return { owner: match[1], repo: match[2] };
};

// POST /api/agent/chat
// Body: { repoUrl, message, history, token? }
router.post('/chat', async (req, res) => {
    const { repoUrl, message, history = [], token } = req.body;

    if (!repoUrl || !message) {
        return res.status(400).json({ error: 'repoUrl and message are required' });
    }

    // We must have an API key for this agent
    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'Neither OPENAI_API_KEY nor GROQ_API_KEY is configured in the backend.' });
    }

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const agent = await createGitHubAgent(owner, repo, token || process.env.GITHUB_TOKEN);

        // Convert plain history to LangChain messages format
        // (In a real app, you'd map these to HumanMessage/AIMessage properly)
        const chatHistory = history.map(msg =>
            msg.role === 'user' ? new HumanMessage(msg.content) : { role: 'ai', content: msg.content }
        );

        const inputs = {
            messages: [...chatHistory, new HumanMessage(message)]
        };

        // Stream the response back using Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Execute agent and stream events
        const stream = await agent.stream(inputs, { streamMode: "values" });

        for await (const event of stream) {
            const recentMsg = event.messages[event.messages.length - 1];

            // If the model is calling a tool, emit a thought event
            if (recentMsg.tool_calls && recentMsg.tool_calls.length > 0) {
                const toolName = recentMsg.tool_calls[0].name;
                const toolArgs = JSON.stringify(recentMsg.tool_calls[0].args);
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Using tool: ${toolName} with ${toolArgs}` })}\n\n`);
            }
            // If it's the final AI text response
            else if (recentMsg._getType() === 'ai' && recentMsg.content) {
                // LangGraph streams the *entire* state array on each step, 
                // so we just emit the final updated content.
                // In production, we'd use 'messages' streamMode for token-by-token.
                res.write(`data: ${JSON.stringify({ type: 'message', content: recentMsg.content })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

    } catch (err) {
        console.error('Agent chat error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
            res.end();
        }
    }
});

export default router;
