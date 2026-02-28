��# �# Git History Time Traveller
![Git History Time Traveller](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
**Git History Time Traveller** is an intelligent dashboard and interactive tool designed to transform raw Git history into rich visual narratives, AI-powered insights, and interactive explorations. 
Understanding a complex, mature codebase is notoriously difficult. Developers traditionally rely on static READMEs and fragmented, text-heavy commit logs to piece together the architecture and evolution of a project. 
This project introduces a complete paradigm shift. By leveraging cutting-edge web technologies, real-time data visualization, and Large Language Models (LLMs), it transforms raw, static Git data into a dynamic, interactive, and AI-narrated experience. Whether you are a new developer onboarding, an engineering manager tracking technical debt, or a QA engineer verifying changes, Git History Time Traveller makes understanding a project's history, architecture, and team dynamics effortless and highly engaging.
---
## (' Comprehensive Features
### =��� Interactive Visualizations (The Dashboard)
The core of the application lies in its ability to visually map complex data structures without overwhelming the user.
*   **Timeline View:** A chronologically accurate, interactive map of repository commits and milestones, allowing users to scroll through history to see exactly when major architectural shifts occurred.
*   **Heatmap View:** Activity matrices that reveal developer working patterns, identifying periods of intense development or lulls in the release cycle.
*   **Contributor Graph:** Force-directed network graphs plotting contributors against the files they interact with most, instantly illustrating team dynamics and knowledge silos.
*   **Project Progress:** Dynamic charts tracking overall codebase expansion, health metrics, and team velocity over time.
### <ج� Story Mode (Cinematic Evolution)
Moving beyond static charts, Story Mode automatically generates human-readable narratives of a software project's lifecycle.
*   **Auto-Playing Narrative:** A cinematic playback sequence of the repository's entire evolution.
*   **AI-Generated Chapters:** LLMs analyze the commit history to automatically group the timeline into logical, distinct phases (e.g., *Initial Build, The Great Refactoring, Stabilization*).
*   **Live Video Theater:** A custom-built, fullscreen HTML5 Canvas visualization where individual commits dynamically "explode" onto the screen chronologically.
### >��� Intelligence Mode (AI-Powered Analytics)
This module acts as a proactive technical debt auditor and code analyzer.
*   **Natural Language Search:** Query the repository using plain English verbs instead of complex `git grep` commands (e.g., *"Show me all the risky files that deal with authentication"*).
*   **Hotspot & Risk Analysis:** Actively flags highly volatile files, calculating risk levels based on churn frequency and predicting potential "dev-hours lost."
*   **Ghost File Detection:** Scans for "Ghost Files" corners of the codebase untouched for months or years, representing potentially bloated dead code or critical, undocumented dependencies.
*   **Commit Truthfulness Analyzer:** A highly advanced, automated code review pipeline that compares the Git commit message text against the actual code diff to label the commit as *Honest*, *Bug Fix*, *Potentially Misleading*, or *Dangerous*.
### >�� Agent Mode (Your Autonomous Co-Pilot)
*   **God-Mode AI Access:** A LangGraph-powered chat interface providing a true agentic experience rather than a standard chatbot.
*   **Autonomous Actions:** The agent autonomously decides which tools to use to answer user queries. It can independently read specific files, execute code searches across the repository, or pull up granular commit details.
*   **Native MCP Integration:** Powered by the Model Context Protocol (MCP), bringing real-time, authenticated GitHub data directly into the AI conversation to eliminate hallucinated code structures.
---
## <���� Project Methodology & Technical Approach
Developing a responsive, data-heavy, AI-integrated dashboard requires a robust and scalable architecture. Support for repositories containing highly dense, decades-old commit histories fundamentally shaped our methodology.
### Phase 1: Data Ingestion and Intelligent Caching
*Objective: Securely and efficiently extract historical data from GitHub while circumventing harsh API rate limits.*
1.  **Authentication:** The backend Node.js (`Express`) API utilizes the `@octokit/rest` library, leveraging Personal Access Tokens (PATs) for elevated API limits.
2.  **Pagination and Chunking:** Repositories can house tens of thousands of commits. The backend fetches commits sequentially using strict pagination parameters.
3.  **Database Persistence:** To ensure the frontend remains performant and to halt redundant external API calls, fetched timeline chunks are serialized and cached in a MongoDB database (`Mongoose`) via a `CommitChunk` schema equipped with compound indexes for instantaneous subsequent retrievals.
### Phase 2: AI-Driven Contextual Data Processing
*Objective: Transform raw Git data strings into semantic, human-readable insights.*
1.  **Batch Prompting:** Raw commit messages and contributor data are streamed to large context LLMs. We dynamically toggle between OpenAI's GPT-4o (for rigorous reasoning density) and Groq's Llama 3 (for extremely low-latency structured output generation).
2.  **Narrative Construction:** The LLMs evaluate these "chunks," identifying thematic shifts in development, outputting structured JSON to feed the "Chapters" UI in Story Mode.
3.  **Risk Modeling Algorithms:** Combined with LLM evaluation, algorithmic passes flag high-churn "hotspot" files to execute automated technical debt auditing and commit truthfulness scoring.
### Phase 3: Real-Time Agentic Querying (Agent Mode)
*Objective: Provide an autonomous AI assistant capable of navigating the repository like a senior engineer.*
1.  **LangGraph Orchestration:** We rejected standard linear chatbot models in favor of cyclical, stateful agent loops via `LangGraph`.
2.  **MCP Integration:** Using `@langchain/mcp-adapters`, the LLM is explicitly bound to a functional toolkit (`get_file_content`, `search_files`, `get_commit_details`).
3.  **Autonomous Tool Execution:** The LLM evaluates a query, emits a `tool_call`, the backend securely executes the GitHub API request on behalf of the user, and hands the data back to the LLM. This loop continues until a high-confidence answer is formulated and streamed via Server-Sent Events (SSE) to the frontend.
### Phase 4: Frontend Rendering and Cinematic Visualization
*Objective: Display vast quantities of processed data in an engaging, 60fps user interface.*
1.  **State Management:** The React frontend handles highly complex state using the robust Context API combined with `useReducer()`.
2.  **Data Visualization:** D3.js drives the complex force-directed simulation mapping authors to files to visually depict team silos and collaboration intersections.
3.  **Cinematic Animation:** `Framer Motion` manages complex layout transitions. The true power lies in the Story Mode Video Theater a custom HTML5 Canvas implementation running a secondary, physics-based D3 simulation to process and animate thousands of nodes simultaneously without taxing the core React render cycle.
---
## =���� Technology Stack
### Frontend
- **Framework:** React + Vite
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Data Visualization:** D3.js, Recharts, Custom HTML5 Canvas
### Backend
- **Environment:** Node.js (Express)
- **Database / Caching:** MongoDB (Mongoose) 
- **API Interactions:** `@octokit/rest`
### AI & Agents
- **Orchestration:** Langchain & LangGraph
- **LLMs:** OpenAI GPT-4o / Groq Llama-3-70b
- **Tooling:** Model Context Protocol (MCP) via `@langchain/mcp-adapters`
---
## <���
 B&� Getting Started
### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or remote via MongoDB Atlas)
- GitHub Personal Access Token (for extended API rate limits)
- `OPENAI_API_KEY` and/or `GROQ_API_KEY`
### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
```
Start the backend server (dev mode runs on port 3001):
```bash
npm run dev
```
### 2. Frontend Setup
In a new terminal, navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```
Your application should now be running locally, typically on `http://localhost:5173`.
---
## <د� Primary Use Cases & Benefits
- **Individual Developers:** Slash onboarding times from weeks to hours by visually exploring the codebase history and utilizing the Agent Co-Pilot to answer context-specific questions.
- **Engineering Management:** Pinpoint technical debt, prevent burnout by analyzing developer activity maps, and ensure team continuity via the Contributor Graph.
- **Quality Assurance & Security:** Automate critical oversight checks using the Commit Truthfulness Analyzer to locate hidden code changes.
---
