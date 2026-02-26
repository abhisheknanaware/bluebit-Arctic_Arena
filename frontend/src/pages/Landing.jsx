import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch, Zap, Search, BarChart2, Users, Clock,
    ChevronRight, Star, Eye, Lock, AlertTriangle, TrendingUp
} from 'lucide-react';
import GitBackground from '../components/GitBackground.jsx';
import { useRepo } from '../context/RepoContext.jsx';
import {
    analyzeRepo, fetchHeatmap, fetchContributorGraph,
    fetchAiInsights
} from '../services/api.js';
import { toast } from 'react-toastify';

const SAMPLE_REPOS = [
    { name: 'D4Vinci/Scrapling', url: 'https://github.com/D4Vinci/Scrapling', desc: 'Python scraping framework' },
    { name: 'facebook/react', url: 'https://github.com/facebook/react', desc: '~20k commits, legendary React library' },
    { name: 'vercel/next.js', url: 'https://github.com/vercel/next.js', desc: 'Full-stack React framework' },
];

const FEATURES = [
    { icon: Clock, title: 'Timeline Evolution', desc: 'Watch commits animate in cinematic playback', color: '#00ff88' },
    { icon: BarChart2, title: 'Heatmap View', desc: 'Color-coded churn and complexity maps', color: '#a855f7' },
    { icon: Users, title: 'Contributor Graph', desc: 'D3 force graph of team collaboration', color: '#38bdf8' },
    { icon: TrendingUp, title: 'Project Progress', desc: 'Monthly charts, velocity, author share & releases', color: '#fbbf24' },
    { icon: Zap, title: 'AI Insights', desc: 'Confidence scores, ghost files, truthfulness analysis', color: '#fb923c' },
    { icon: Eye, title: 'Story Mode', desc: 'Cinematic chapter-by-chapter repo evolution', color: '#f472b6' },
];

export default function Landing() {
    const [repoUrl, setRepoUrl] = useState('');
    const [token, setToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [step, setStep] = useState('idle'); // idle | loading | done | error
    const [loadingMsg, setLoadingMsg] = useState('');
    const [progress, setProgress] = useState(0);
    const { dispatch } = useRepo();
    const navigate = useNavigate();

    async function handleAnalyze(url = repoUrl) {
        if (!url.trim()) { toast.error('Please enter a GitHub repository URL'); return; }
        if (!url.includes('github.com')) { toast.error('Only GitHub repositories are supported'); return; }

        setStep('loading');
        setProgress(0);
        dispatch({ type: 'RESET' });
        dispatch({ type: 'SET_REPO_URL', payload: url });
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            setLoadingMsg('📡 Fetching repository data...');
            setProgress(10);
            const repoData = await analyzeRepo(url, token);

            setProgress(35);
            dispatch({
                type: 'SET_REPO_DATA',
                payload: {
                    repoInfo: repoData.info,
                    commits: repoData.commits,
                    contributors: repoData.contributors,
                    releases: repoData.releases,
                    tags: repoData.tags,
                    totalCommits: repoData.totalCommits,
                    owner: repoData.owner,
                    repo: repoData.repo,
                },
            });

            setLoadingMsg('🔥 Analyzing file heatmap...');
            setProgress(50);
            const heatmapData = await fetchHeatmap(url, token, repoData.commits.slice(0, 50));

            dispatch({ type: 'SET_HEATMAP', payload: heatmapData });
            setProgress(65);

            setLoadingMsg('👥 Building contributor graph...');
            const graphData = await fetchContributorGraph(url, token, repoData.contributors, repoData.commits);
            dispatch({ type: 'SET_CONTRIBUTOR_GRAPH', payload: graphData });
            setProgress(80);

            setLoadingMsg('🧠 Generating AI insights...');
            const insights = await fetchAiInsights(
                url, token,
                repoData.commits,
                repoData.contributors,
                heatmapData.hotFiles || [],
                repoData.info
            );
            dispatch({ type: 'SET_AI_INSIGHTS', payload: insights });
            setProgress(100);

            setStep('done');
            toast.success(`✅ ${repoData.totalCommits} commits loaded for ${repoData.owner}/${repoData.repo}`);

            setTimeout(() => navigate('/dashboard'), 600);
        } catch (err) {
            console.error(err);
            setStep('error');
            const msg = err.response?.data?.error || err.message || 'Failed to analyze repository';
            dispatch({ type: 'SET_ERROR', payload: msg });
            toast.error(`❌ ${msg}`);
        }
    }

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            <GitBackground intensity={1} />

            {/* Main content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Nav */}
                <nav style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GitBranch size={24} color="#00ff88" />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0' }}>
                            Git<span style={{ color: '#00ff88' }}>History</span>
                        </span>
                        <span style={{ color: '#475569', fontFamily: 'JetBrains Mono' }}>// Time Traveller</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <span className="badge badge-green">⚡ AI-Powered</span>
                        <span className="badge badge-purple">🎬 Cinematic</span>
                    </div>
                </nav>

                {/* Hero */}
                <section style={{ textAlign: 'center', padding: '80px 20px 40px', maxWidth: 900, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <span className="badge badge-green">PS10 — Hackathon Project</span>
                            <span className="badge badge-blue">v1.0</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
                            <span className="gradient-text-green">Git History</span>
                            <br />
                            <span style={{ color: '#e2e8f0' }}>Time Traveller</span>
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7 }}>
                            Transform boring git logs into <strong style={{ color: '#e2e8f0' }}>cinematic visualizations</strong>,
                            interactive heatmaps, and <strong style={{ color: '#00ff88' }}>AI-powered insights</strong> —
                            understand any repository in minutes.
                        </p>
                    </motion.div>

                    {/* Input form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="glass"
                        style={{ padding: '32px', maxWidth: 680, margin: '0 auto', textAlign: 'left' }}
                    >
                        <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                            GitHub Repository URL
                        </label>
                        <input
                            className="input-dark"
                            type="url"
                            placeholder="https://github.com/facebook/react"
                            value={repoUrl}
                            onChange={e => setRepoUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                            style={{ marginBottom: 16 }}
                            disabled={step === 'loading'}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                                GitHub Token <span style={{ color: '#475569' }}>(optional, for higher rate limits)</span>
                            </label>
                            <Lock size={12} color="#475569" />
                        </div>
                        <div style={{ position: 'relative', marginBottom: 24 }}>
                            <input
                                className="input-dark"
                                type={showToken ? 'text' : 'password'}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                disabled={step === 'loading'}
                                style={{ paddingRight: 80 }}
                            />
                            <button
                                onClick={() => setShowToken(!showToken)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.75rem'
                                }}
                            >
                                {showToken ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {/* Loading State */}
                        <AnimatePresence>
                            {step === 'loading' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ marginBottom: 20 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <span className="loader-ring" />
                                        <span style={{ color: '#00ff88', fontSize: '0.9rem', fontFamily: 'JetBrains Mono' }}>
                                            {loadingMsg}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <motion.div
                                            className="progress-fill"
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem', padding: '16px' }}
                            onClick={() => handleAnalyze()}
                            disabled={step === 'loading'}
                        >
                            {step === 'loading' ? (
                                <><span className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing...</>
                            ) : step === 'done' ? (
                                <>✅ Ready! Entering Dashboard...</>
                            ) : (
                                <><Zap size={18} /> Analyze Repository</>
                            )}
                        </button>
                    </motion.div>

                    {/* Sample repos */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{ marginTop: 28 }}
                    >
                        <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: 12 }}>
                            Or try a sample repository:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                            {SAMPLE_REPOS.map(r => (
                                <button
                                    key={r.name}
                                    className="btn-ghost"
                                    onClick={() => { setRepoUrl(r.url); handleAnalyze(r.url); }}
                                    disabled={step === 'loading'}
                                >
                                    <GitBranch size={14} />
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* API Warning */}
                <div style={{ maxWidth: 680, margin: '0 auto 40px', padding: '0 20px' }}>
                    <div style={{
                        background: 'rgba(251, 146, 60, 0.08)',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        borderRadius: 10, padding: '12px 16px',
                        display: 'flex', gap: 10, alignItems: 'flex-start'
                    }}>
                        <AlertTriangle size={16} color="#fb923c" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                            <strong style={{ color: '#fb923c' }}>GitHub Rate Limits:</strong> Without a token, GitHub allows only 60 requests/hour.
                            Add a Personal Access Token for 5,000 req/hour and full analysis of large repos.
                        </p>
                    </div>
                </div>

                {/* Feature grid */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: 40, color: '#e2e8f0' }}>
                        Everything you need to understand <span className="gradient-text-green">any repository</span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i + 0.5 }}
                                className="glass-card"
                                style={{ padding: '24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                    background: `${f.color}22`,
                                    border: `1px solid ${f.color}44`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <f.icon size={20} color={f.color} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, marginBottom: 6, color: '#e2e8f0', fontSize: '0.95rem' }}>{f.title}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
