import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch, Home, Play, BarChart2, Users, Brain, Book,
    ChevronLeft, Star, GitCommit, Globe, TrendingUp, Bot
} from 'lucide-react';
import { useRepo } from '../context/RepoContext.jsx';
import GitBackground from '../components/GitBackground.jsx';
import TimelineView from '../components/visualizations/TimelineView.jsx';
import HeatmapView from '../components/visualizations/HeatmapView.jsx';
import ContributorGraph from '../components/visualizations/ContributorGraph.jsx';
import ProjectProgress from '../components/visualizations/ProjectProgress.jsx';
import IntelligenceMode from './IntelligenceMode.jsx';
import AgentMode from './AgentMode.jsx';
import StoryMode from './StoryMode.jsx';

const MODES = [
    { id: 'visualization', label: 'Visualization', icon: Play },
    { id: 'intelligence', label: 'Intelligence', icon: Brain },
    { id: 'agent', label: 'Agent Mode', icon: Bot },
    { id: 'story', label: 'Story Mode', icon: Book },
];

const VIEWS = [
    { id: 'timeline', label: 'Timeline', icon: GitCommit },
    { id: 'heatmap', label: 'Heatmap', icon: BarChart2 },
    { id: 'contributor', label: 'Contributors', icon: Users },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
];

function StatChip({ label, value, color = '#00ff88' }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 14px', textAlign: 'center'
        }}>
            <div style={{ color, fontWeight: 700, fontSize: '1.05rem', fontFamily: 'JetBrains Mono' }}>{value}</div>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 2 }}>{label}</div>
        </div>
    );
}

export default function Dashboard() {
    const { state, dispatch } = useRepo();
    const navigate = useNavigate();
    const { repoInfo, commits, contributors, owner, repo, activeMode, activeView, aiInsights, totalCommits } = state;

    // Redirect if no data loaded
    useEffect(() => {
        if (!commits || commits.length === 0) {
            navigate('/');
        }
    }, [commits, navigate]);

    if (!repoInfo) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="loader-ring" />
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <GitBackground intensity={0.3} />

            {/* HEADER */}
            <header style={{
                position: 'relative', zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 24px',
                background: 'rgba(10, 14, 20, 0.9)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)', flexShrink: 0
            }}>
                <button className="btn-ghost" onClick={() => navigate('/')} style={{ gap: 6 }}>
                    <ChevronLeft size={16} /> Home
                </button>

                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GitBranch size={16} color="#00ff88" />
                    <span style={{ fontFamily: 'JetBrains Mono', color: '#e2e8f0', fontWeight: 600 }}>
                        {owner}/{repo}
                    </span>
                    {repoInfo.language && (
                        <span className="badge badge-purple">{repoInfo.language}</span>
                    )}
                    {repoInfo.stars > 0 && (
                        <span className="badge badge-blue">
                            <Star size={10} /> {(repoInfo.stars / 1000).toFixed(1)}k
                        </span>
                    )}
                </div>

                <div style={{ flex: 1 }} />

                {/* Mode switcher */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
                    {MODES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => dispatch({ type: 'SET_MODE', payload: m.id })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px',
                                borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                transition: 'all 0.2s',
                                background: activeMode === m.id ? '#00ff88' : 'transparent',
                                color: activeMode === m.id ? '#000' : '#94a3b8',
                            }}
                        >
                            <m.icon size={14} /> {m.label}
                        </button>
                    ))}
                </div>

                {repoInfo.license && (
                    <span className="badge badge-green">{repoInfo.license}</span>
                )}
            </header>

            {/* BODY */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                {/* SIDEBAR */}
                <aside className="sidebar" style={{ width: 240 }}>
                    {/* Repo description */}
                    <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 16 }}>
                            {repoInfo.description || 'No description'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <StatChip label="Commits" value={totalCommits.toLocaleString()} color="#00ff88" />
                            <StatChip label="Authors" value={contributors.length} color="#a855f7" />
                            <StatChip label="Stars" value={repoInfo.stars ? `${(repoInfo.stars / 1000).toFixed(1)}k` : '0'} color="#38bdf8" />
                            <StatChip label="Issues" value={repoInfo.openIssues || 0} color="#fb923c" />
                        </div>
                    </div>

                    {/* View switcher (only in viz mode) */}
                    {activeMode === 'visualization' && (
                        <div style={{ padding: '16px' }}>
                            <p style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                                Visualization
                            </p>
                            {VIEWS.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => dispatch({ type: 'SET_VIEW', payload: v.id })}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 4,
                                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                                        fontWeight: activeView === v.id ? 600 : 400,
                                        background: activeView === v.id ? 'rgba(0,255,136,0.1)' : 'transparent',
                                        color: activeView === v.id ? '#00ff88' : '#94a3b8',
                                        transition: 'all 0.2s',
                                        borderLeft: activeView === v.id ? '2px solid #00ff88' : '2px solid transparent',
                                    }}
                                >
                                    <v.icon size={16} /> {v.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* AI Insights summary */}
                    {aiInsights && (
                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                            <p style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                                Repo Health
                            </p>
                            <div style={{
                                padding: '12px', borderRadius: 8, marginBottom: 12,
                                background: aiInsights.summary.overallHealth === 'healthy'
                                    ? 'rgba(0,255,136,0.08)' : aiInsights.summary.overallHealth === 'moderate'
                                        ? 'rgba(251,146,60,0.08)' : 'rgba(248,113,113,0.08)',
                                border: `1px solid ${aiInsights.summary.overallHealth === 'healthy' ? 'rgba(0,255,136,0.2)' : aiInsights.summary.overallHealth === 'moderate' ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.2)'}`,
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 4, textTransform: 'capitalize' }}>
                                    {aiInsights.summary.overallHealth === 'healthy' ? '🟢' : aiInsights.summary.overallHealth === 'moderate' ? '🟡' : '🔴'} {aiInsights.summary.overallHealth}
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                    {aiInsights.summary.recommendation}
                                </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#fb923c', fontSize: '0.78rem' }}>🔥 {aiInsights.summary.hotspotCount} hotspots</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>👻 {aiInsights.summary.ghostCount} ghost files</span>
                            </div>
                        </div>
                    )}

                    {/* Repo link */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <a
                            href={`https://github.com/${owner}/${repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost"
                            style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem' }}
                        >
                            <Globe size={14} /> View on GitHub
                        </a>
                    </div>
                </aside>

                {/* MAIN */}
                <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <AnimatePresence mode="wait">
                        {activeMode === 'visualization' && (
                            <motion.div
                                key={`viz-${activeView}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                            >
                                {activeView === 'timeline' && <TimelineView />}
                                {activeView === 'heatmap' && <HeatmapView />}
                                {activeView === 'contributor' && <ContributorGraph />}
                                {activeView === 'progress' && <ProjectProgress />}
                            </motion.div>
                        )}
                        {activeMode === 'intelligence' && (
                            <motion.div key="intelligence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'auto' }}>
                                <IntelligenceMode />
                            </motion.div>
                        )}
                        {activeMode === 'agent' && (
                            <motion.div key="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                                <AgentMode />
                            </motion.div>
                        )}
                        {activeMode === 'story' && (
                            <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'auto' }}>
                                <StoryMode />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
