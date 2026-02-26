import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Ghost, Shield, AlertTriangle, CheckCircle, XCircle, Info, Send, Loader2 } from 'lucide-react';
import { useRepo } from '../context/RepoContext.jsx';
import ReactMarkdown from 'react-markdown';

function ConfidenceRing({ score }) {
    const color = score >= 75 ? '#00ff88' : score >= 50 ? '#fb923c' : '#f87171';
    return (
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <circle
                    cx="40" cy="40" r="32"
                    fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.3s' }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ color, fontWeight: 800, fontSize: '1rem', fontFamily: 'JetBrains Mono' }}>{score}%</span>
            </div>
        </div>
    );
}

function CommitTruthBadge({ label }) {
    const configs = {
        honest: { color: '#00ff88', icon: CheckCircle, bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)', label: 'Honest' },
        bugfix: { color: '#38bdf8', icon: Info, bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', label: 'Bug Fix' },
        'high-impact': { color: '#fb923c', icon: AlertTriangle, bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', label: 'High Impact' },
        'potentially-misleading': { color: '#fbbf24', icon: AlertTriangle, bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'Misleading' },
        dangerous: { color: '#f87171', icon: XCircle, bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Dangerous' },
    };
    const cfg = configs[label] || configs.honest;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 9999,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            color: cfg.color, fontSize: '0.72rem', fontWeight: 700
        }}>
            <cfg.icon size={10} /> {cfg.label}
        </span>
    );
}

export default function IntelligenceMode() {
    const { state, dispatch } = useRepo();
    const { aiInsights, repoUrl, owner, repo } = state;
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState(null);
    const [answerLoading, setAnswerLoading] = useState(false);
    const inputRef = useRef(null);

    const clusters = aiInsights?.clusters || [];

    async function handleSearch(q = query) {
        if (!q.trim() || answerLoading) return;
        setAnswerLoading(true);
        setAnswer({ answer: 'Thinking...', thoughts: [] });

        try {
            const response = await fetch('http://localhost:3001/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoUrl: repoUrl || `https://github.com/${owner}/${repo}`,
                    message: `[Intelligence Mode Search] ${q}. Keep it concise but highly accurate.`,
                    history: []
                }),
            });

            if (!response.ok) throw new Error('Connection failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let currentAnswer = '';
            let currentThoughts = [];

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
                                currentThoughts = [...currentThoughts, data.content];
                                setAnswer({ answer: currentAnswer || 'Thinking...', thoughts: currentThoughts });
                            } else if (data.type === 'message') {
                                currentAnswer = data.content;
                                setAnswer({ answer: currentAnswer, thoughts: currentThoughts });
                            } else if (data.type === 'error') {
                                setAnswer(prev => ({ ...prev, answer: `Error: ${data.content}` }));
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) {
            setAnswer({ answer: 'Agent search failed. Make sure the backend is running.', thoughts: [] });
        }
        setAnswerLoading(false);
    }

    const QUICK = [
        'What is this repo for?',
        'Show me risky files',
        'What changed in the last 6 months?',
        'Who are the top contributors?',
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
            {/* NL Search */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={20} color="#00ff88" /> Repository Intelligence Search
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>Ask anything about this repository in natural language</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                        ref={inputRef}
                        className="input-dark"
                        placeholder="e.g. What is this repo for? Show me risky files..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn-primary" style={{ padding: '14px 20px', flexShrink: 0 }} onClick={() => handleSearch()} disabled={answerLoading}>
                        {answerLoading ? <span className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Send size={16} />}
                    </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {QUICK.map(q => (
                        <button key={q} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                            onClick={() => { setQuery(q); handleSearch(q); }}>
                            {q}
                        </button>
                    ))}
                </div>

                <AnimatePresence>
                    {answer && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: 20, padding: '16px 20px',
                                background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)',
                                borderRadius: 10,
                            }}
                        >
                            {answer.thoughts?.length > 0 && answerLoading && (
                                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                    {answer.thoughts.map((t, i) => (
                                        <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                                            <Loader2 size={10} className="spinning" style={{ display: 'inline', marginRight: 4 }} />
                                            {t.replace('Using tool: ', '')}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Zap size={16} color="#00ff88" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div className="markdown" style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: '0.9rem', width: '100%' }}>
                                    <ReactMarkdown>{answer.answer}</ReactMarkdown>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Change Clusters */}
                {clusters.length > 0 && (
                    <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>📅</span> Change Clusters
                        </h3>
                        {clusters.map(c => (
                            <motion.div
                                key={c.label}
                                whileHover={{ x: 4 }}
                                onClick={() => { dispatch({ type: 'SET_COMMIT_INDEX', payload: Math.max(0, c.startIndex) }); dispatch({ type: 'SET_MODE', payload: 'visualization' }); }}
                                style={{
                                    padding: '12px 14px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderLeft: '3px solid #00ff88'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{c.emoji} {c.label}</span>
                                    <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>{c.commits} commits</span>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{c.description}</p>
                                <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                                    {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Hotspots / Confidence */}
                {aiInsights?.hotspots?.length > 0 && (
                    <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Shield size={16} color="#00ff88" /> Change Confidence Scores
                        </h3>
                        {aiInsights.hotspots.slice(0, 4).map(h => (
                            <div key={h.path} style={{
                                padding: '12px', marginBottom: 10, borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <ConfidenceRing score={h.confidenceScore} />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#00ff88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {h.path}
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                            <span className={`badge badge-${h.riskLevel === 'critical' ? 'red' : h.riskLevel === 'high' ? 'orange' : 'purple'}`} style={{ fontSize: '0.65rem' }}>
                                                {h.riskLevel} risk
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>{h.warning}</p>
                                <div style={{ color: '#fb923c', fontSize: '0.75rem', marginTop: 6 }}>
                                    ⏰ ~{h.estimatedHoursLost} dev-hours lost
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ghost Files */}
                {aiInsights?.ghostFiles?.length > 0 && (
                    <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Ghost size={16} color="#a855f7" /> Ghost Files
                            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{aiInsights.ghostFiles.length}</span>
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 12 }}>
                            Files rarely touched — may be dead code or silently critical dependencies.
                        </p>
                        {aiInsights.ghostFiles.map(g => (
                            <div key={g.path} style={{
                                padding: '10px 12px', marginBottom: 6, borderRadius: 6,
                                background: 'rgba(168,85,247,0.05)',
                                border: '1px solid rgba(168,85,247,0.15)',
                            }}>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#a855f7', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    👻 {g.path}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{g.warning}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Commit Truthfulness Table */}
            {aiInsights?.commitTruth?.length > 0 && (
                <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} color="#fb923c" /> Commit Message Truthfulness Analyzer
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {['SHA', 'Author', 'Message', 'Label', 'Reason'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {aiInsights.commitTruth.slice(0, 20).map(c => (
                                    <tr key={c.sha} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', color: '#00ff88', fontSize: '0.75rem' }}>{c.shortSha}</td>
                                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{c.author}</td>
                                        <td style={{ padding: '8px 12px', color: '#e2e8f0', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</td>
                                        <td style={{ padding: '8px 12px' }}><CommitTruthBadge label={c.label} /></td>
                                        <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.78rem', maxWidth: 200 }}>{c.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
