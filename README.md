# ⏳ Git History Time Traveller

![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

**Git History Time Traveller** is an advanced, AI-native platform designed to **decode, visualize, and narrate the complete evolutionary history of a Git repository**.

Modern software projects live for years — sometimes decades. Over time, they accumulate thousands of commits, hundreds of contributors, architectural rewrites, and undocumented decisions. Traditional tools (`git log`, `git blame`, static READMEs) fail to explain *why* the system looks the way it does today.

This project introduces a **fundamental shift**:  
Git history is no longer a text log — it becomes a **living, explorable system** powered by data visualization, autonomous AI agents, and cinematic storytelling.

---

## 🧠 Philosophy & Problem Statement

### The Problem
- Commit logs describe *what* changed — not *why*
- Architectural decisions are lost when engineers leave
- Onboarding requires weeks of tribal knowledge
- Technical debt hides silently in high-churn areas
- Commit messages are often misleading or incomplete

### The Solution
Git History Time Traveller treats Git history as **first-class data**:
- Visualize it
- Analyze it
- Narrate it
- Question it using AI

The result is **radical clarity** over a repository’s past, present, and future risk.

---

## 🌟 What Makes This Different?

| Traditional Tools | Git History Time Traveller |
|------------------|---------------------------|
| Static logs | Dynamic timelines |
| Text-based | Visual & cinematic |
| Manual exploration | Autonomous AI agents |
| Fragmented context | Holistic understanding |
| Guessing intent | Commit truth analysis |

---

## 📊 Dashboard: Visualizing Complexity Without Overload

The Dashboard is the analytical backbone of the platform. It converts raw Git metadata into **intuitive, explorable visual structures**.

### Timeline View
A chronologically accurate, scrollable representation of the repository’s entire lifespan.  
Major architectural shifts, refactors, and milestones emerge visually instead of being buried in logs.

### Activity Heatmaps
Matrix-style heatmaps display development intensity across time:
- Detect crunch periods
- Identify stagnation zones
- Reveal release cycles and team workload patterns

### Contributor–File Network Graph
A force-directed D3.js graph mapping:
- Contributors ↔ files
- Ownership concentration
- Knowledge silos
- Bus-factor risks

This view instantly answers questions like:
> “Who truly understands this part of the codebase?”

### Project Health & Velocity Metrics
Time-series visualizations tracking:
- Codebase growth
- Commit velocity
- Refactor density
- Long-term stability trends

---

## 🎬 Story Mode: Git History as a Narrative

Story Mode reframes repository history as a **structured story**, not a log.

### AI-Generated Chapters
Large Language Models analyze commit semantics and group them into meaningful development phases such as:
- Initial Foundation
- Feature Expansion
- Major Refactor
- Stabilization

Each chapter provides **human-readable context** explaining how and why the project evolved.

### Cinematic Playback Engine
A custom HTML5 Canvas visualization renders commits as animated entities:
- Commits appear chronologically
- Physics-based simulations create a “time-travel” effect
- Thousands of commits animate smoothly at 60 FPS

This creates a visceral understanding of project momentum over time.

---

## 🧠 Intelligence Mode: Automated Technical Insight

Intelligence Mode functions as a **continuous technical auditor**.

### Natural Language Repository Querying
Users can query the codebase in plain English:
> “Show me risky files related to authentication logic”

The system translates intent into autonomous repository analysis.

### Hotspot & Risk Modeling
Files are scored using:
- Change frequency
- Contributor count
- Historical volatility

High-risk zones are surfaced proactively, enabling preventative maintenance.

### Ghost File Detection
Identifies files that:
- Haven’t changed in months or years
- May represent dead code
- Or hide critical, undocumented dependencies

### Commit Truthfulness Analyzer
One of the most advanced features in the system.

Each commit message is compared against the actual code diff using LLM reasoning and heuristic scoring. Commits are labeled as:
- Honest
- Bug Fix
- Potentially Misleading
- Dangerous

This enables **post-hoc trust analysis** across the entire history of a repository.

---

## 🤖 Agent Mode: Autonomous Repository Exploration

Agent Mode is not a chatbot — it is an **autonomous software engineer**.

### True Agentic Architecture
Instead of linear Q&A, Agent Mode uses **LangGraph-powered stateful loops**:
- The agent reasons
- Selects tools
- Executes actions
- Evaluates results
- Repeats until confident

### Tool-Bound Reasoning via MCP
Using the **Model Context Protocol**, the agent is explicitly bound to real tools:
- `get_file_content`
- `search_files`
- `get_commit_details`

This guarantees:
- Live GitHub data
- Authenticated access
- Zero hallucinated context

### Streaming Intelligence
Results are streamed to the frontend using Server-Sent Events (SSE), providing a responsive, real-time experience even for complex multi-step analyses.

---

## 🏗️ System Architecture & Design

### Phase 1: Git Data Ingestion & Caching
- Secure GitHub access via Personal Access Tokens
- Strict pagination for massive commit histories
- MongoDB caching using indexed chunk schemas
- Prevents redundant API calls and rate-limit exhaustion

### Phase 2: Semantic AI Processing
- Batched commit analysis
- Dynamic LLM routing:
  - GPT-4o → Deep reasoning
  - Llama-3-70B → Low-latency structured output
- Structured JSON outputs power UI components

### Phase 3: Agentic Orchestration
- LangGraph manages cyclical reasoning
- MCP enforces tool-grounded execution
- Backend executes actions securely
- Frontend receives streamed updates

### Phase 4: High-Performance Frontend Rendering
- React + Vite for rapid rendering
- Context API + reducers for complex state
- D3.js for graph simulations
- Framer Motion for transitions
- HTML5 Canvas for large-scale animations

---

## 🛠️ Technology Stack

### Frontend
- React + Vite
- Tailwind CSS
- Framer Motion
- D3.js, Recharts
- Custom HTML5 Canvas

### Backend
- Node.js (Express)
- MongoDB (Mongoose)
- GitHub API (`@octokit/rest`)

### AI & Agents
- LangChain & LangGraph
- OpenAI GPT-4o
- Groq Llama-3-70B
- Model Context Protocol (MCP)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- GitHub Personal Access Token
- OpenAI and/or Groq API keys

### Backend
```bash
cd backend
npm install
npm run dev
