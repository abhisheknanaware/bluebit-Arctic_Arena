import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronsRight, ChevronsLeft, Tag } from 'lucide-react';
import { useRepo } from '../../context/RepoContext.jsx';

function CommitCard({ commit, isActive, onClick }) {
    const isRecent = new Date(commit.date) > new Date(Date.now() - 90 * 86400000);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={onClick}
            style={{
                cursor: 'pointer',
                padding: '12px 14px',
                marginBottom: 6,
                borderRadius: 8,
                border: `1px solid ${isActive ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.06)'}`,
                background: isActive ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s, background 0.2s',
                borderLeft: `3px solid ${isActive ? '#00ff88' : 'transparent'}`,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    {commit.shortSha}
                </span>
                <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                    {new Date(commit.date).toLocaleDateString()}
                </span>
                {isRecent && <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>recent</span>}
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {commit.message}
            </p>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>by {commit.author}</span>
        </motion.div>
    );
}

function FileEvent({ file, type }) {
    const colors = { add: '#00ff88', modify: '#38bdf8', delete: '#f87171' };
    const labels = { add: '+ Added', modify: '~ Modified', delete: '- Deleted' };
    const color = colors[type] || colors.modify;
    return (
        <motion.div
            initial={{ opacity: 0, x: type === 'add' ? -20 : type === 'delete' ? 20 : 0, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                background: `${color}10`, borderRadius: 6, marginBottom: 4,
                border: `1px solid ${color}25`,
            }}
        >
            <span style={{ color, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'JetBrains Mono', minWidth: 70 }}>
                {labels[type]}
            </span>
            <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file}
            </span>
        </motion.div>
    );
}

export default function TimelineView() {
    const { state, dispatch } = useRepo();
    const { commits, currentCommitIndex, isPlaying, playbackSpeed, releases, tags, filterAuthor, showRiskyOverlay, aiInsights } = state;
    const intervalRef = useRef(null);

    const filtered = filterAuthor
        ? commits.filter(c => c.author.toLowerCase().includes(filterAuthor.toLowerCase()))
        : commits;

    const currentCommit = filtered[currentCommitIndex] || filtered[0];

    // Playback
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => {
            dispatch({ type: 'INCREMENT_COMMIT_INDEX', payload: { max: filtered.length - 1 } });
        }, 1200 / playbackSpeed);
        return () => clearInterval(id);
    }, [isPlaying, playbackSpeed, filtered.length]);

    useEffect(() => {
        if (currentCommitIndex >= filtered.length - 1 && isPlaying) {
            dispatch({ type: 'SET_PLAYING', payload: false });
        }
    }, [currentCommitIndex, filtered.length, isPlaying]);

    const mockFiles = useCallback(() => {
        if (!currentCommit) return [];
        const seed = currentCommit.sha.charCodeAt(0);
        const exts = ['tsx', 'ts', 'js', 'py', 'md', 'json', 'css', 'go'];
        const dirs = ['src/components', 'src/utils', 'src/pages', 'lib', 'tests', 'api', 'docs'];
        const count = (seed % 5) + 2;
        return Array.from({ length: count }, (_, i) => {
            const t = i === 0 ? 'add' : i === count - 1 ? 'delete' : 'modify';
            return {
                file: `${dirs[(seed + i) % dirs.length]}/${currentCommit.shortSha}-${i}.${exts[(seed + i) % exts.length]}`,
                type: t,
            };
        });
    }, [currentCommit]);

    // Find if current commit is a release
    const isRelease = currentCommit && releases.find(r => r.name === currentCommit.sha?.substring(0, 7));
    const isTag = currentCommit && tags.find(t => t.sha === currentCommit.sha);

    // Risky commits
    const riskyCommitShas = showRiskyOverlay && aiInsights?.commitTruth
        ? new Set(aiInsights.commitTruth.filter(c => c.label === 'dangerous' || c.label === 'high-impact').map(c => c.sha))
        : new Set();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Timeline scrubber */}
            <div style={{
                padding: '16px 24px', background: 'rgba(10,14,20,0.8)',
                borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ color: '#475569', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', minWidth: 80 }}>
                        {currentCommitIndex + 1} / {filtered.length}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={Math.max(0, filtered.length - 1)}
                        value={currentCommitIndex}
                        onChange={e => dispatch({ type: 'SET_COMMIT_INDEX', payload: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                    />
                    {currentCommit && (
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem', minWidth: 90, textAlign: 'right' }}>
                            {new Date(currentCommit.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => dispatch({ type: 'SET_COMMIT_INDEX', payload: 0 })}>
                        <SkipBack size={14} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => dispatch({ type: 'SET_COMMIT_INDEX', payload: Math.max(0, currentCommitIndex - 1) })}>
                        <ChevronsLeft size={14} />
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'SET_PLAYING', payload: !isPlaying })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
                            background: isPlaying ? 'rgba(248,113,113,0.15)' : 'rgba(0,255,136,0.15)',
                            border: `1px solid ${isPlaying ? 'rgba(248,113,113,0.4)' : 'rgba(0,255,136,0.4)'}`,
                            color: isPlaying ? '#f87171' : '#00ff88',
                            borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                        }}
                    >
                        {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
                    </button>
                    <button className="btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => dispatch({ type: 'SET_COMMIT_INDEX', payload: Math.min(filtered.length - 1, currentCommitIndex + 1) })}>
                        <ChevronsRight size={14} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => dispatch({ type: 'SET_COMMIT_INDEX', payload: filtered.length - 1 })}>
                        <SkipForward size={14} />
                    </button>

                    <div style={{ flex: 1 }} />

                    {/* Speed */}
                    <span style={{ color: '#475569', fontSize: '0.78rem' }}>Speed:</span>
                    {[0.5, 1, 2, 4].map(s => (
                        <button key={s} className="btn-ghost"
                            style={{
                                padding: '4px 10px', fontSize: '0.78rem',
                                background: playbackSpeed === s ? 'rgba(0,255,136,0.15)' : 'transparent',
                                color: playbackSpeed === s ? '#00ff88' : '#94a3b8',
                                border: playbackSpeed === s ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                            onClick={() => dispatch({ type: 'SET_SPEED', payload: s })}
                        >
                            {s}x
                        </button>
                    ))}

                    {/* AI Overlay toggle */}
                    <button className="btn-ghost"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', color: showRiskyOverlay ? '#f87171' : '#94a3b8', borderColor: showRiskyOverlay ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)' }}
                        onClick={() => dispatch({ type: 'TOGGLE_RISKY' })}>
                        🔥 Risky
                    </button>
                </div>
            </div>

            {/* Main area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Commit list */}
                <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'auto', padding: '12px' }}>
                    <p style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>
                        Commit History
                    </p>
                    <AnimatePresence>
                        {filtered.slice(Math.max(0, currentCommitIndex - 10), currentCommitIndex + 20).map(c => (
                            <CommitCard
                                key={c.sha}
                                commit={c}
                                isActive={c.sha === currentCommit?.sha}
                                onClick={() => dispatch({ type: 'SET_COMMIT_INDEX', payload: c.index })}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Active commit detail */}
                <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                    {currentCommit ? (
                        <div>
                            {/* Commit header */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: '#00ff88',
                                        background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
                                        padding: '4px 12px', borderRadius: 6
                                    }}>
                                        #{currentCommit.shortSha}
                                    </span>
                                    {isTag && (
                                        <span className="badge badge-orange"><Tag size={10} /> {isTag.name}</span>
                                    )}
                                    {riskyCommitShas.has(currentCommit.sha) && (
                                        <span className="badge badge-red">⚠️ Risky</span>
                                    )}
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.4 }}>
                                    {currentCommit.message}
                                </h2>
                                <div style={{ display: 'flex', gap: 16, color: '#94a3b8', fontSize: '0.85rem' }}>
                                    <span>👤 {currentCommit.author}</span>
                                    <span>📅 {new Date(currentCommit.date).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* File changes */}
                            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
                                    📁 File Changes
                                </h3>
                                <AnimatePresence mode="wait">
                                    <motion.div key={currentCommit.sha}>
                                        {mockFiles().map((f, i) => (
                                            <FileEvent key={`${f.file}-${i}`} file={f.file} type={f.type} />
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Progress ring */}
                            <div className="glass-card" style={{ padding: 20 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
                                    📊 Repository Progress
                                </h3>
                                <div className="progress-bar" style={{ marginBottom: 8 }}>
                                    <div className="progress-fill" style={{ width: `${((currentCommitIndex + 1) / filtered.length) * 100}%` }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem' }}>
                                    <span>First commit</span>
                                    <span style={{ color: '#00ff88' }}>{Math.round(((currentCommitIndex + 1) / filtered.length) * 100)}% of history</span>
                                    <span>Latest</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <p style={{ color: '#475569' }}>No commits to display</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
