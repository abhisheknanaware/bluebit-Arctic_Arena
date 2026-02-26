import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Code, Search, FileText, Loader2, Sparkles } from 'lucide-react';
import { useRepo } from '../context/RepoContext.jsx';
import ReactMarkdown from 'react-markdown';

export default function AgentMode() {
    const { state } = useRepo();
    const { repoUrl, owner, repo } = state;

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'ai',
            content: `Hello! I'm an autonomous LangGraph agent connected to \`${owner}/${repo}\`.\n\nI can read files, search the codebase, and analyze commits. What would you like to know?`,
            thoughts: []
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() };

        // Prepare history for API (excluding the local 'id' and 'thoughts' fields)
        const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Add a placeholder AI message that we will stream into
        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', thoughts: [] }]);

        try {
            const response = await fetch('http://localhost:3001/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoUrl: `https://github.com/${owner}/${repo}`,
                    message: userMsg.content,
                    history: chatHistory
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Connection failed');
            }

            // Standard SSE stream reading
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.type === 'thought') {
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMsgId ? { ...m, thoughts: [...(m.thoughts || []), data.content] } : m
                                ));
                            } else if (data.type === 'message') {
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMsgId ? { ...m, content: data.content } : m
                                ));
                            } else if (data.type === 'error') {
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMsgId ? { ...m, content: `**Error:** ${data.content}` } : m
                                ));
                            } else if (data.type === 'done') {
                                // Request is completely finished
                                setIsLoading(false);
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data:", e, dataStr);
                        }
                    }
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: `**Error starting stream:** ${error.message}` } : m
            ));
            setIsLoading(false);
        }
    };

    const getThoughtIcon = (text) => {
        if (text.includes('search_files')) return <Search size={12} color="#fb923c" />;
        if (text.includes('get_file_content')) return <FileText size={12} color="#a855f7" />;
        if (text.includes('get_commit_details')) return <Code size={12} color="#38bdf8" />;
        return <Loader2 size={12} className="spinning" color="#94a3b8" />;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(10, 14, 20, 0.4)' }}>

            {/* Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 12
            }}>
                <div style={{ padding: 8, background: 'rgba(0, 255, 136, 0.1)', borderRadius: 8 }}>
                    <Bot size={20} color="#00ff88" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>LangGraph Agent</h2>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                        Autonomous codebase exploration • GPT-4o
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                gap: 16,
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}
                        >
                            {msg.role === 'ai' && (
                                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bot size={16} color="#00ff88" />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* Render Thoughts (Tool Calls) */}
                                {msg.role === 'ai' && msg.thoughts && msg.thoughts.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {msg.thoughts.map((thought, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '6px 12px', background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6,
                                                fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono'
                                            }}>
                                                {getThoughtIcon(thought)}
                                                {thought}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Render Message Content */}
                                <div style={{
                                    padding: '12px 16px',
                                    background: msg.role === 'user' ? '#00ff88' : 'rgba(30, 41, 59, 0.7)',
                                    color: msg.role === 'user' ? '#064e3b' : '#e2e8f0',
                                    borderRadius: 12,
                                    borderTopRightRadius: msg.role === 'user' ? 2 : 12,
                                    borderTopLeftRadius: msg.role === 'ai' ? 2 : 12,
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6,
                                    border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(0,255,136,0.2)' : 'none',
                                }}>
                                    {msg.content ? (
                                        <div className="markdown" style={{ color: 'inherit' }}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
                                            <Sparkles size={14} className="spinning" /> Thinking...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, padding: '4px'
                    }}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "Agent is typing..." : "Ask the agent to look up a file or explain a commit..."}
                        disabled={isLoading}
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            color: '#fff', fontSize: '0.95rem', padding: '12px 16px',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        style={{
                            background: input.trim() && !isLoading ? '#00ff88' : 'rgba(255,255,255,0.1)',
                            color: input.trim() && !isLoading ? '#064e3b' : '#94a3b8',
                            border: 'none', borderRadius: 8,
                            padding: '10px', height: 40, width: 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s', marginRight: 4
                        }}
                    >
                        {isLoading ? <Loader2 size={16} className="spinning" /> : <Send size={16} />}
                    </button>
                </form>
            </div>

            <style jsx="true">{`
                .spinning { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .markdown p { margin: 0 0 10px 0; }
                .markdown p:last-child { margin: 0; }
                .markdown pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
                .markdown code { font-family: 'JetBrains Mono', monospace; font-size: 0.8em; background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 4px; }
            `}</style>
        </div>
    );
}
