import { useEffect, useState } from 'react';
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    CartesianGrid, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, GitCommit, Calendar, Users, Zap, Award, Clock, Tag } from 'lucide-react';
import { useRepo } from '../../context/RepoContext.jsx';
import { fetchProgress } from '../../services/api.js';

const PIE_COLORS = ['#00ff88', '#a855f7', '#38bdf8', '#fb923c', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#94a3b8'];

// Custom tooltip for bar/area charts
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#161d2b', border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem'
        }}>
            <p style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: '#e2e8f0' }}>{p.name}: <strong style={{ color: p.color }}>{p.value}</strong></span>
                </div>
            ))}
        </div>
    );
}

function PieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div style={{
            background: '#161d2b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem'
        }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700 }}>{d.name}</p>
            <p style={{ color: d.payload.fill }}>{d.value} commits ({d.payload.pct}%)</p>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, sub, color = '#00ff88' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{value}</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', marginTop: 3 }}>{label}</div>
                {sub && <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 2 }}>{sub}</div>}
            </div>
        </motion.div>
    );
}

export default function ProjectProgress() {
    const { state } = useRepo();
    const { commits, contributors, repoInfo, releases } = state;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!commits.length) return;
        setLoading(true);
        fetchProgress(commits, contributors, repoInfo || {}, releases || [])
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [commits.length]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
                <div className="loader-ring" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p style={{ color: '#94a3b8' }}>Calculating project progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: '#f87171' }}>Error: {error}. Make sure the backend is running.</p>
            </div>
        );
    }

    if (!data) return null;

    const { monthlyActivity, authorShare, weeklyVelocity, releaseTimeline, stats } = data;

    // Mark release months on the bar chart
    const releaseMonths = new Set((releaseTimeline || []).map(r => r.monthKey));
    const activityWithReleases = monthlyActivity.map(m => ({
        ...m,
        isRelease: releaseMonths.has(m.month),
        displayMonth: m.month.substring(5), // MM part
    }));

    // Show only last 24 months for readability
    const recentActivity = activityWithReleases.slice(-24);

    return (
        <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#e2e8f0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={22} color="#00ff88" /> Project Progress
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Commit activity, contributor share, velocity trends, and lifecycle overview
                </p>
            </div>

            {/* Stat cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard icon={GitCommit} label="Total Commits" value={commits.length.toLocaleString()} color="#00ff88" />
                <StatCard icon={Users} label="Total Authors" value={stats.totalAuthors} color="#a855f7" />
                <StatCard icon={Calendar} label="Repo Age" value={`${stats.ageMonths}mo`} sub={stats.firstCommit ? new Date(stats.firstCommit).toLocaleDateString() : 'N/A'} color="#38bdf8" />
                <StatCard icon={Zap} label="Avg / Month" value={stats.avgCommitsPerMonth} sub="commits per month" color="#fb923c" />
                <StatCard icon={Award} label="Peak Month" value={stats.peakCommits || 0} sub={stats.peakMonth || 'N/A'} color="#f472b6" />
                <StatCard icon={Tag} label="Releases" value={(releaseTimeline || []).length} color="#fbbf24" />
            </div>

            {/* Monthly commit frequency — bar chart */}
            <div className="glass-card" style={{ padding: '20px 20px 10px', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4, fontSize: '0.95rem' }}>
                    📅 Monthly Commit Frequency
                </h3>
                <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 16 }}>
                    Bars = commits · Line = active authors · 🏷️ = release month
                </p>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={recentActivity} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#475569"
                            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                            tickFormatter={v => v.substring(2)} // YY-MM
                            interval="preserveStartEnd"
                        />
                        <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="commits" name="Commits" radius={[4, 4, 0, 0]}>
                            {recentActivity.map((entry, i) => (
                                <Cell key={i} fill={entry.isRelease ? '#fbbf24' : '#00ff88'} fillOpacity={0.75} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                {(releaseTimeline || []).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <div style={{ width: 12, height: 12, background: '#fbbf24', borderRadius: 2 }} />
                        <span style={{ color: '#475569', fontSize: '0.72rem' }}>Release months highlighted in gold</span>
                    </div>
                )}
            </div>

            {/* 2-col: Weekly velocity + Contributor pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Weekly velocity — area chart */}
                <div className="glass-card" style={{ padding: '20px 20px 10px' }}>
                    <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4, fontSize: '0.95rem' }}>
                        ⚡ Weekly Velocity (last 24 weeks)
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.76rem', marginBottom: 14 }}>
                        Commits per week — shows sprint patterns
                    </p>
                    {weeklyVelocity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={weeklyVelocity}>
                                <defs>
                                    <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="week" stroke="#475569" tick={{ fill: '#475569', fontSize: 9 }} tickFormatter={v => v.substring(5)} interval={3} />
                                <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="commits" name="Commits" stroke="#a855f7" fill="url(#velGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#475569' }}>Not enough data</p>
                        </div>
                    )}
                </div>

                {/* Author share — pie chart */}
                <div className="glass-card" style={{ padding: '20px' }}>
                    <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4, fontSize: '0.95rem' }}>
                        👥 Author Contribution Share
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.76rem', marginBottom: 10 }}>
                        Commit distribution across contributors
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <PieChart width={160} height={160}>
                            <Pie
                                data={authorShare}
                                cx={76} cy={76}
                                innerRadius={44} outerRadius={72}
                                dataKey="commits"
                                nameKey="author"
                                strokeWidth={0}
                            >
                                {authorShare.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                        </PieChart>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                            {authorShare.slice(0, 7).map((a, i) => (
                                <div key={a.author} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span style={{ color: '#e2e8f0', fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.author}</span>
                                    <span style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontSize: '0.72rem', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>{a.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Releases timeline */}
            {(releaseTimeline || []).length > 0 && (
                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: '0.95rem' }}>
                        🏷️ Release Timeline
                    </h3>
                    <div style={{ position: 'relative', paddingLeft: 20 }}>
                        {/* Vertical line */}
                        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #00ff88, #a855f7)', borderRadius: 2 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {releaseTimeline.map((r, i) => (
                                <div key={r.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', border: '2px solid #0a0e14', flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.82rem', fontFamily: 'JetBrains Mono' }}>{r.name}</div>
                                        <div style={{ color: '#475569', fontSize: '0.72rem' }}>{new Date(r.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lifecycle bar */}
            <div className="glass-card" style={{ padding: '18px 20px' }}>
                <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="#38bdf8" /> Project Lifecycle Overview
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 8, overflow: 'hidden', height: 28, marginBottom: 12 }}>
                    {[
                        { label: 'Build', color: '#00ff88', pct: 25 },
                        { label: 'Growth', color: '#38bdf8', pct: 25 },
                        { label: 'Refactor', color: '#a855f7', pct: 25 },
                        { label: 'Stable', color: '#fbbf24', pct: 25 },
                    ].map(p => (
                        <div key={p.label} style={{ flex: p.pct, background: p.color + '40', borderRight: '2px solid rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: p.color, fontSize: '0.72rem', fontWeight: 700 }}>{p.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}>
                    <span>{stats.firstCommit ? new Date(stats.firstCommit).toLocaleDateString() : '—'}</span>
                    <span style={{ color: '#94a3b8' }}>→ {stats.ageMonths} months → </span>
                    <span>{stats.lastCommit ? new Date(stats.lastCommit).toLocaleDateString() : '—'}</span>
                </div>
            </div>
        </div>
    );
}
