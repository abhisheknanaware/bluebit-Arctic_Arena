import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Rewind, BookOpen, ChevronRight, X, MonitorPlay, Download } from 'lucide-react';
import { useRepo } from '../context/RepoContext.jsx';
import * as d3 from 'd3';

const CHAPTER_CONFIGS = [
    {
        label: 'Initial Build',
        emoji: '🌱',
        color: '#00ff88',
        icon: '🏗️',
        phaseDesc: 'The project comes to life. Foundational files, initial structure, and core ideas take shape.',
        bg: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,255,136,0.02) 100%)',
    },
    {
        label: 'Rapid Growth',
        emoji: '🚀',
        color: '#38bdf8',
        icon: '⚡',
        phaseDesc: 'Features are added at speed. Contributors collaborate. The codebase expands rapidly.',
        bg: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.02) 100%)',
    },
    {
        label: 'Refactoring',
        emoji: '🔧',
        color: '#a855f7',
        icon: '🔄',
        phaseDesc: 'Technical debt is addressed. Architecture evolves. Old patterns give way to new abstractions.',
        bg: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.02) 100%)',
    },
    {
        label: 'Stabilization',
        emoji: '🛡️',
        color: '#fbbf24',
        icon: '🐛',
        phaseDesc: 'Bugs are squashed. Performance tuned. The repository reaches a mature, stable state.',
        bg: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)',
    },
];

function ChapterCard({ chapter, config, isActive, isPlaying, onClick }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onClick}
            style={{
                cursor: 'pointer',
                padding: '20px 24px',
                borderRadius: 12,
                background: isActive ? config.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? config.color + '40' : 'rgba(255,255,255,0.07)'}`,
                borderLeft: `4px solid ${isActive ? config.color : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {isActive && isPlaying && (
                <motion.div
                    style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse at 30% 50%, ${config.color}08 0%, transparent 70%)`,
                    }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${config.color}15`, border: `1px solid ${config.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                }}>
                    {config.emoji}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontWeight: 800, color: isActive ? config.color : '#e2e8f0', fontSize: '1rem' }}>
                            {config.label}
                        </h3>
                        {isActive && isPlaying && (
                            <motion.span
                                className="badge"
                                style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30`, fontSize: '0.65rem' }}
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            >
                                ● LIVE
                            </motion.span>
                        )}
                        {chapter && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{chapter.commits} commits</span>}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>{config.phaseDesc}</p>
                    {chapter && (
                        <p style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', marginTop: 6 }}>
                            {new Date(chapter.startDate).toLocaleDateString()} → {new Date(chapter.endDate).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <ChevronRight size={16} color={isActive ? config.color : '#475569'} style={{ alignSelf: 'center', flexShrink: 0 }} />
            </div>
        </motion.div>
    );
}

// Fullscreen Video Theater Mode Component
function LiveGraph({ currentCommit, config }) {
    const canvasRef = useRef(null);
    const dataRef = useRef({
        nodes: [{ id: 'root', type: 'root', label: 'Repository', r: 35, color: '#fff', x: window.innerWidth / 2, y: window.innerHeight * 0.25 }],
        links: [],
        authors: new Set(),
        scale: 1
    });
    const simRef = useRef(null);

    // Initialize simulation once
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const W = window.innerWidth;
        const H = window.innerHeight;

        // Handle High DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;

        dataRef.current.nodes[0].x = W / 2;
        dataRef.current.nodes[0].y = H * 0.35;

        simRef.current = d3.forceSimulation(dataRef.current.nodes)
            .force('charge', d3.forceManyBody().strength(-30))
            .force('link', d3.forceLink(dataRef.current.links).id(d => d.id).distance(d => d.source.id === 'root' ? 100 : 30))
            .force('center', d3.forceCenter(W / 2, H * 0.25).strength(0.06))
            .force('y', d3.forceY(H * 0.25).strength(0.05))
            .force('collision', d3.forceCollide(d => d.r + 8))
            .alphaDecay(0.04)
            .on('tick', () => {
                ctx.clearRect(0, 0, W, H);

                let minX = W, maxX = 0, minY = H, maxY = 0;
                dataRef.current.nodes.forEach(n => {
                    if (n.x < minX) minX = n.x;
                    if (n.x > maxX) maxX = n.x;
                    if (n.y < minY) minY = n.y;
                    if (n.y > maxY) maxY = n.y;
                });

                const gw = Math.max(100, maxX - minX + 160);
                const gh = Math.max(100, maxY - minY + 160);
                const targetScale = Math.min(1.2, (W * 0.9) / gw, (H * 0.45) / gh);

                dataRef.current.scale += (targetScale - dataRef.current.scale) * 0.1;

                ctx.save();
                ctx.translate(W / 2, H * 0.25);
                ctx.scale(dataRef.current.scale, dataRef.current.scale);
                ctx.translate(-W / 2, -H * 0.25);

                // Draw links
                ctx.lineWidth = 1.2;
                dataRef.current.links.forEach((l) => {
                    ctx.beginPath();
                    ctx.moveTo(l.source.x, l.source.y);
                    ctx.lineTo(l.target.x, l.target.y);
                    ctx.strokeStyle = l.color || '#ffffff20';
                    ctx.stroke();
                });

                // Draw nodes
                dataRef.current.nodes.forEach((n) => {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI);
                    ctx.fillStyle = n.color || '#fff';
                    // Glow effect
                    ctx.shadowBlur = n.type === 'commit' || n.glow ? 15 : 0;
                    ctx.shadowColor = n.color;
                    ctx.fill();
                    ctx.shadowBlur = 0; // reset

                    if (n.type === 'author' || n.type === 'root') {
                        ctx.fillStyle = '#fff';
                        ctx.font = n.type === 'root' ? 'bold 16px "JetBrains Mono"' : '10px "JetBrains Mono"';
                        ctx.textAlign = 'center';
                        ctx.fillText(n.label, n.x, n.y + n.r + 18);
                    }
                });

                ctx.restore();
            });

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            if (simRef.current) {
                simRef.current.force('center', d3.forceCenter(w / 2, h * 0.25));
                simRef.current.alpha(0.3).restart();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            if (simRef.current) simRef.current.stop();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Update nodes on new commit
    useEffect(() => {
        if (!currentCommit || !currentCommit.sha || !simRef.current) return;

        const data = dataRef.current;
        const authorId = 'author-' + currentCommit.author;

        // Add author node if missing
        if (!data.authors.has(currentCommit.author)) {
            data.authors.add(currentCommit.author);
            const aNode = {
                id: authorId,
                type: 'author',
                label: currentCommit.author,
                r: 12,
                color: '#a855f7',
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 50,
                y: window.innerHeight * 0.25 + (Math.random() - 0.5) * 50
            };
            data.nodes.push(aNode);
            data.links.push({ source: 'root', target: authorId, color: '#a855f750' });
        }

        // Add commit node
        const cNode = {
            id: currentCommit.sha,
            type: 'commit',
            r: 4,
            color: config.color,
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
            y: window.innerHeight * 0.25 + (Math.random() - 0.5) * 100
        };

        // Prevent dupes
        if (!data.nodes.some(n => n.id === currentCommit.sha)) {
            data.nodes.push(cNode);
            data.links.push({ source: authorId, target: currentCommit.sha, color: config.color + '60' });

            // Pulse the author node size briefly
            const authorNode = data.nodes.find(n => n.id === authorId);
            if (authorNode) {
                authorNode.r = 18;
                authorNode.color = config.color;
                authorNode.glow = true;
                setTimeout(() => {
                    authorNode.r = 12;
                    authorNode.color = '#a855f7';
                    authorNode.glow = false;
                    if (simRef.current) simRef.current.alpha(0.1).restart();
                }, 300);
            }
        }

        // Keep maximum 150 commit nodes to maintain performance
        const commitsOnly = data.nodes.filter(n => n.type === 'commit');
        if (commitsOnly.length > 200) {
            const oldest = commitsOnly[0];
            data.nodes = data.nodes.filter(n => n.id !== oldest.id);
            data.links = data.links.filter(l => l.target.id !== oldest.id && l.target !== oldest.id);
        }

        simRef.current.nodes(data.nodes);
        simRef.current.force('link').links(data.links);
        simRef.current.alpha(0.8).restart(); // High alpha for explosive animation

    }, [currentCommit, config]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
        />
    );
}

function VideoTheater({ chapters, activeChapter, isPlaying, onClose, onTogglePlay, onNextChapter, commits, storyIndex }) {
    const safeChapter = Math.min(activeChapter, chapters.length - 1);
    const currentChapter = chapters[safeChapter];
    const config = CHAPTER_CONFIGS[safeChapter % CHAPTER_CONFIGS.length];

    // Calculate progress through current chapter
    let progressPct = 0;
    if (currentChapter) {
        const start = currentChapter.startIndex;
        const end = currentChapter.endIndex;

        if (end > start) {
            const currentOffset = Math.max(0, storyIndex - start);
            const totalLength = end - start;
            progressPct = Math.min(100, Math.max(0, (currentOffset / totalLength) * 100));
        } else if (end === start) {
            progressPct = storyIndex >= start ? 100 : 0;
        }
    }

    const currentCommit = commits[storyIndex] || {};

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: '#0a0e14', display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Cinematic Background */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, opacity: 0.15,
                background: `radial-gradient(circle at center, ${config.color}40 0%, transparent 80%)`
            }} />

            {/* Live Graph Background layer */}
            <LiveGraph currentCommit={currentCommit} config={config} />

            {/* Top Bar */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171', animation: isPlaying ? 'pulse-glow 2s infinite' : 'none' }} />
                    <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: '0.9rem', letterSpacing: '0.1em' }}>REC / VIDEO VIZ</span>
                </div>
                <button className="btn-ghost" onClick={onClose} style={{ padding: '8px', color: '#fff' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1 }} /> {/* Push content to bottom */}

            {/* Main Stage Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10, padding: '10px 20px 10px', textAlign: 'center' }}>
                <motion.div
                    key={activeChapter}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 12 }}
                >
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {config.label}
                    </h1>
                    <p style={{ color: '#e2e8f0', fontSize: '0.8rem', maxWidth: 600, margin: '0 auto', background: 'rgba(0,0,0,0.7)', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                        {config.phaseDesc}
                    </p>
                </motion.div>

                {/* Sub-stage: Live Commit feed */}
                <div style={{ height: 90, width: '100%', maxWidth: 600, zIndex: 10 }}>
                    <AnimatePresence mode="popLayout">
                        {currentCommit && currentCommit.sha && (
                            <motion.div
                                key={currentCommit.sha}
                                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: 16,
                                    border: `1px solid ${config.color}40`, borderLeft: `6px solid ${config.color}`,
                                    display: 'flex', alignItems: 'center', gap: 16,
                                }}
                            >
                                <img src={currentCommit.avatarUrl || `https://ui-avatars.com/api/?name=${currentCommit.author}&background=random`} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                                <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {currentCommit.message}
                                    </div>
                                    <div style={{ color: config.color, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', marginTop: 4 }}>
                                        {currentCommit.author} • {new Date(currentCommit.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: '#94a3b8' }}>
                                    {currentCommit.shortSha}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Playback Bar */}
            <div style={{ padding: '20px 40px', zIndex: 10, background: 'linear-gradient(to top, #0a0e14 0%, transparent 100%)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={onTogglePlay} style={{ width: 50, height: 50, borderRadius: '50%', background: config.color, color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 0 20px ${config.color}60` }}>
                            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 4 }} />}
                        </button>
                        <button onClick={onNextChapter} disabled={activeChapter >= chapters.length - 1} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activeChapter >= chapters.length - 1 ? 'not-allowed' : 'pointer', opacity: activeChapter >= chapters.length - 1 ? 0.3 : 1 }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                            <span>Chapter {safeChapter + 1} / {chapters.length}</span>
                            <span>{Math.round(progressPct)}% Completed</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}>
                            <div className="progress-fill" style={{ width: `${progressPct}%`, background: config.color, transition: 'width 0.8s linear' }} />
                        </div>
                    </div>

                    <button className="btn-secondary" style={{ padding: '12px 24px', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={() => alert('Video Export feature initiates recording of this canvas.')}>
                        <Download size={18} /> Export MP4
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function StoryMode() {
    const { state, dispatch } = useRepo();
    const { aiInsights, commits, repoInfo, owner, repo } = state;
    const [activeChapter, setActiveChapter] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [storyIndex, setStoryIndex] = useState(0);
    const [showVideoMode, setShowVideoMode] = useState(false);
    const intervalRef = useRef(null);

    const clusters = aiInsights?.clusters || [];

    // Auto-play through chapters
    useEffect(() => {
        if (isPlaying) {
            const chapter = clusters[activeChapter];
            if (!chapter) { setIsPlaying(false); return; }

            const startIdx = Math.max(0, chapter.startIndex);
            const endIdx = Math.min(commits.length - 1, chapter.endIndex || commits.length - 1);
            dispatch({ type: 'SET_COMMIT_INDEX', payload: Math.max(storyIndex, startIdx) });

            intervalRef.current = setInterval(() => {
                setStoryIndex(prev => {
                    const next = prev + 1;
                    if (next > endIdx) {
                        // Move to next chapter automatically if we hit the end
                        // Ensure we force progress up to 100% first
                        if (activeChapter < clusters.length - 1) {
                            setActiveChapter(c => c + 1);
                            // Do not setIsPlaying(false) here so the autoplay chain continues
                        } else {
                            setIsPlaying(false);
                            // Optional: Force a loop back to 0 here to replay
                        }
                        clearInterval(intervalRef.current);
                        return prev;
                    }
                    dispatch({ type: 'SET_COMMIT_INDEX', payload: next });
                    return next;
                });
            }, 800);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, activeChapter, clusters, commits.length, dispatch]);

    function handleChapterClick(i) {
        if (i < 0 || i >= clusters.length) return;

        setActiveChapter(i);
        setIsPlaying(true); // Auto-resume play when navigating
        clearInterval(intervalRef.current);
        const chapter = clusters[i];
        if (chapter) {
            const safeIdx = Math.max(0, chapter.startIndex);
            dispatch({ type: 'SET_COMMIT_INDEX', payload: safeIdx });
            setStoryIndex(safeIdx);
        }
    }

    const currentCluster = clusters[activeChapter];
    const currentConfig = CHAPTER_CONFIGS[activeChapter % CHAPTER_CONFIGS.length] || CHAPTER_CONFIGS[0];

    return (
        <div style={{ padding: 24, position: 'relative' }}>
            {showVideoMode && createPortal(
                <VideoTheater
                    chapters={clusters}
                    activeChapter={activeChapter}
                    isPlaying={isPlaying}
                    commits={commits}
                    storyIndex={storyIndex}
                    onClose={() => setShowVideoMode(false)}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onNextChapter={() => {
                        if (activeChapter < clusters.length - 1) {
                            handleChapterClick(activeChapter + 1);
                            setIsPlaying(true);
                        }
                    }}
                />,
                document.getElementById('root') || document.body
            )}

            {/* Header */}
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BookOpen size={24} color="#00ff88" /> Story Mode
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Cinematic auto-play through <strong style={{ color: '#e2e8f0' }}>{owner}/{repo}</strong>'s evolution
                    </p>
                </div>

                {/* Playback controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setShowVideoMode(true)}>
                        <MonitorPlay size={16} color="#38bdf8" /> Video Mode
                    </button>
                    <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => { setActiveChapter(0); setIsPlaying(false); setStoryIndex(clusters[0]?.startIndex || 0); }}>
                        <Rewind size={16} />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                            borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                            background: isPlaying ? 'rgba(248,113,113,0.2)' : 'linear-gradient(135deg, #00ff88, #00ccff)',
                            color: isPlaying ? '#f87171' : '#000',
                            transition: 'all 0.3s',
                        }}
                    >
                        {isPlaying ? <><Pause size={16} /> Pause Story</> : <><Play size={16} /> Play Story</>}
                    </button>
                </div>
            </div>

            {/* Big chapter display */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeChapter}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card"
                    style={{
                        padding: '32px', marginBottom: 24, textAlign: 'center',
                        background: currentConfig.bg,
                        border: `1px solid ${currentConfig.color}30`,
                        borderRadius: 16,
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>{currentConfig.emoji}</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: currentConfig.color, marginBottom: 8 }}>
                        Chapter {activeChapter + 1}: {currentConfig.label}
                    </h2>
                    <p style={{ color: '#e2e8f0', fontSize: '1rem', maxWidth: 550, margin: '0 auto', lineHeight: 1.7 }}>
                        {currentConfig.phaseDesc}
                    </p>
                    {currentCluster && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                            <span className="badge badge-green">{currentCluster.commits} commits</span>
                            <span className="badge badge-blue">
                                {new Date(currentCluster.startDate).toLocaleDateString()} → {new Date(currentCluster.endDate).toLocaleDateString()}
                            </span>
                            {isPlaying && !showVideoMode && (
                                <motion.span
                                    className="badge"
                                    style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                                    animate={{ opacity: [0.6, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                                >
                                    ● Auto-playing timeline...
                                </motion.span>
                            )}
                        </div>
                    )}
                    {!currentCluster && (
                        <p style={{ color: '#475569', marginTop: 12, fontSize: '0.85rem' }}>No commits detected for this phase.</p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Chapter list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                {CHAPTER_CONFIGS.map((config, i) => (
                    <ChapterCard
                        key={config.label}
                        chapter={clusters[i]}
                        config={config}
                        isActive={activeChapter === i}
                        isPlaying={isPlaying && activeChapter === i}
                        onClick={() => handleChapterClick(i)}
                    />
                ))}
            </div>

            {/* Repo summary */}
            {repoInfo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card"
                    style={{ padding: '20px 24px', marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}
                >
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>📖 Repository Summary</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{repoInfo.description || 'No description available.'}</p>
                    </div>
                    {repoInfo.topics?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {repoInfo.topics.slice(0, 5).map(t => (
                                <span key={t} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{t}</span>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
