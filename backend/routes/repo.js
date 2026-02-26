import express from 'express';
import axios from 'axios';
import RepoCache from '../models/RepoCache.js';

const router = express.Router();

// Helper: parse owner/repo from GitHub URL
function parseGitHubUrl(url) {
    try {
        const clean = url.replace(/\.git$/, '').replace(/\/$/, '');
        const match = clean.match(/github\.com[:/]([^/]+)\/([^/]+)/);
        if (!match) throw new Error('Invalid GitHub URL');
        return { owner: match[1], repo: match[2] };
    } catch {
        throw new Error('Could not parse GitHub URL. Use: https://github.com/owner/repo');
    }
}

// Helper: GitHub API instance
function getGitHub(token) {
    const instance = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            Accept: 'application/vnd.github+json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 15000,
    });

    // Auto-fallback: if the token is invalid (401 Bad credentials), retry without it
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response && error.response.status === 401 && error.config && error.config.headers.Authorization) {
                console.warn('GitHub token invalid (401). Falling back to unauthenticated limit (60/hr).');
                delete error.config.headers.Authorization;
                return axios.request(error.config);
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

// POST /api/repo/analyze
// Body: { repoUrl, token? }
router.post('/analyze', async (req, res) => {
    const { repoUrl, token } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const ownerRepo = `${owner}/${repo}`.toLowerCase();

        // Check Cache
        let cache = await RepoCache.findOne({ ownerRepo });
        const isFresh = cache && cache.analyzedAt && (Date.now() - new Date(cache.analyzedAt)) < 24 * 60 * 60 * 1000;

        if (cache && cache.fetchStatus === 'complete' && cache.analyzeData && isFresh) {
            console.log(`[Cache Hit] returning /analyze for ${ownerRepo}`);
            return res.json(cache.analyzeData);
        }

        const gh = getGitHub(token || process.env.GITHUB_TOKEN);
        let info, contributors, releases, tags, commits = [];
        let startPage = 1;

        if (cache && cache.fetchStatus === 'fetching' && cache.partialCommits) {
            console.log(`[Resume] Resuming fetch for ${ownerRepo} from commit page ${cache.lastFetchedPage + 1}`);
            info = cache.partialInfo || {};
            contributors = cache.partialContributors || [];
            releases = cache.partialReleases || [];
            tags = cache.partialTags || [];
            commits = cache.partialCommits || [];
            startPage = cache.lastFetchedPage + 1;
        } else {
            console.log(`[Cache Miss] fetching /analyze for ${ownerRepo}`);
            const [repoInfo, commitsRaw, contributorsRaw, releasesRaw, tagsRaw] = await Promise.allSettled([
                gh.get(`/repos/${owner}/${repo}`),
                gh.get(`/repos/${owner}/${repo}/commits?per_page=100&page=1`),
                gh.get(`/repos/${owner}/${repo}/contributors?per_page=100`),
                gh.get(`/repos/${owner}/${repo}/releases?per_page=20`),
                gh.get(`/repos/${owner}/${repo}/tags?per_page=30`),
            ]);

            if (repoInfo.status === 'rejected') {
                throw new Error(repoInfo.reason?.response?.data?.message || 'Failed to fetch repository info. Check URL or Rate Limits.');
            }
            if (commitsRaw.status === 'rejected') {
                throw new Error(commitsRaw.reason?.response?.data?.message || 'Failed to fetch commits. GitHub API rate limit may be exceeded.');
            }

            info = repoInfo.value.data;
            commits = commitsRaw.value.data || [];
            contributors = contributorsRaw.status === 'fulfilled' ? contributorsRaw.value.data : [];
            releases = releasesRaw.status === 'fulfilled' ? releasesRaw.value.data : [];
            tags = tagsRaw.status === 'fulfilled' ? tagsRaw.value.data : [];
            startPage = 2;

            // Save initial progress to Mongo so we don't lose it on next retry
            cache = await RepoCache.findOneAndUpdate(
                { ownerRepo },
                {
                    $set: {
                        fetchStatus: 'fetching',
                        lastFetchedPage: 1,
                        partialInfo: info,
                        partialCommits: commits,
                        partialContributors: contributors,
                        partialReleases: releases,
                        partialTags: tags
                    }
                },
                { upsert: true, new: true }
            );
        }

        // Fetch additional commit pages sequentially until a page returns < 100 results, max page 100 (10,000 commits)
        if (commits.length >= 100 && commits.length % 100 === 0) {
            for (let page = startPage; page <= 100; page++) {
                try {
                    const pageRes = await gh.get(`/repos/${owner}/${repo}/commits?per_page=100&page=${page}`);
                    const pageData = pageRes.data || [];
                    commits.push(...pageData);

                    // Save progressive checkpoints
                    await RepoCache.updateOne(
                        { ownerRepo },
                        { $set: { lastFetchedPage: page, partialCommits: commits } }
                    );

                    if (pageData.length < 100) break; // last page reached
                } catch (err) {
                    throw new Error(`Failed during progressive fetch (page ${page}). Your progress is naturally saved! Please click "Analyze" again shortly to resume. (${err.message})`);
                }
            }
        }

        // Map commits to simplified structure
        const commitList = commits.map((c, index) => ({
            sha: c.sha,
            shortSha: c.sha.substring(0, 7),
            message: c.commit.message.split('\n')[0],
            fullMessage: c.commit.message,
            author: c.commit.author?.name || 'Unknown',
            authorEmail: c.commit.author?.email || '',
            date: c.commit.author?.date || '',
            avatarUrl: c.author?.avatar_url || null,
            index,
        }));

        const responseData = {
            owner,
            repo,
            info: {
                name: info.name,
                description: info.description,
                stars: info.stargazers_count,
                forks: info.forks_count,
                language: info.language,
                defaultBranch: info.default_branch,
                createdAt: info.created_at,
                pushedAt: info.pushed_at,
                openIssues: info.open_issues_count,
                size: info.size,
                topics: info.topics || [],
                license: info.license?.name || null,
            },
            commits: commitList,
            contributors: Array.isArray(contributors) ? contributors.map(c => ({
                login: c.login,
                avatarUrl: c.avatar_url,
                contributions: c.contributions,
                url: c.html_url,
            })) : [],
            releases: Array.isArray(releases) ? releases.map(r => ({
                name: r.name || r.tag_name,
                tagName: r.tag_name,
                date: r.published_at,
                body: r.body?.substring(0, 200) || '',
            })) : [],
            tags: Array.isArray(tags) ? tags.map(t => ({ name: t.name, sha: t.commit?.sha })) : [],
            totalCommits: commitList.length,
        };

        // Cache final analysis state
        await RepoCache.findOneAndUpdate(
            { ownerRepo },
            {
                $set: {
                    fetchStatus: 'complete',
                    analyzeData: responseData,
                    analyzedAt: new Date(),
                    // Memory optimization: clear partials
                    partialCommits: [],
                    partialInfo: null,
                }
            },
            { upsert: true, new: true }
        );

        res.json(responseData);
    } catch (err) {
        console.error('❌ Analyze error:', err.message);
        res.status(400).json({ error: err.message || 'Failed to analyze repository' });
    }
});

// POST /api/repo/heatmap
// Body: { repoUrl, token?, commits }
router.post('/heatmap', async (req, res) => {
    const { repoUrl, token, commits } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const ownerRepo = `${owner}/${repo}`.toLowerCase();

        // Check Cache
        const cache = await RepoCache.findOne({ ownerRepo });
        if (cache && cache.heatmapData && cache.heatmapData.hierarchy) {
            console.log(`[Cache Hit] returning /heatmap for ${ownerRepo}`);
            return res.json(cache.heatmapData);
        }

        console.log(`[Cache Miss] fetching /heatmap for ${ownerRepo}`);
        const gh = getGitHub(token || process.env.GITHUB_TOKEN);

        // Sample up to 50 commits for file-change analysis
        const sample = (commits || []).slice(0, 50);
        const fileChurn = {};
        const fileAuthors = {};

        const commitDetails = await Promise.allSettled(
            sample.map(c => gh.get(`/repos/${owner}/${repo}/commits/${c.sha}`))
        );

        commitDetails.forEach(result => {
            if (result.status !== 'fulfilled') return;
            const data = result.value.data;
            const author = data.commit?.author?.name || 'Unknown';
            (data.files || []).forEach(f => {
                const path = f.filename;
                fileChurn[path] = (fileChurn[path] || 0) + 1;
                if (!fileAuthors[path]) fileAuthors[path] = new Set();
                fileAuthors[path].add(author);
            });
        });

        // Build heatmap tree
        const tree = {};
        Object.entries(fileChurn).forEach(([filePath, churn]) => {
            const parts = filePath.split('/');
            let node = tree;
            parts.forEach((part, index) => {
                if (!node[part]) {
                    node[part] = index === parts.length - 1
                        ? { _churn: churn, _path: filePath, _authors: [...(fileAuthors[filePath] || [])] }
                        : {};
                } else if (index === parts.length - 1) {
                    node[part]._churn = (node[part]._churn || 0) + churn;
                    node[part]._path = filePath;
                    node[part]._authors = [...(fileAuthors[filePath] || [])];
                }
                node = node[part];
            });
        });

        // Convert tree to D3 hierarchy
        function treeToHierarchy(node, name = 'root') {
            const isFile = '_churn' in node;
            if (isFile) {
                return { name, value: node._churn, path: node._path, authors: node._authors || [] };
            }
            const children = Object.entries(node)
                .filter(([k]) => !k.startsWith('_'))
                .map(([k, v]) => treeToHierarchy(v, k));
            return { name, children };
        }

        const hierarchy = treeToHierarchy(tree);
        const hotFiles = Object.entries(fileChurn)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([path, churn]) => ({ path, churn, authors: [...(fileAuthors[path] || [])] }));

        const responseData = { hierarchy, hotFiles, totalFiles: Object.keys(fileChurn).length };

        // Save to Cache
        await RepoCache.findOneAndUpdate(
            { ownerRepo },
            { $set: { heatmapData: responseData } },
            { upsert: true }
        );

        res.json(responseData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/repo/contributors-graph
// Body: { repoUrl, token?, contributors, commits }
router.post('/contributors-graph', async (req, res) => {
    const { repoUrl, token, contributors, commits = [] } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const ownerRepo = `${owner}/${repo}`.toLowerCase();

        // Check Cache
        const cache = await RepoCache.findOne({ ownerRepo });
        if (cache && cache.graphData && cache.graphData.nodes && cache.graphData.nodes.length > 0) {
            console.log(`[Cache Hit] returning /contributors-graph for ${ownerRepo}`);
            return res.json(cache.graphData);
        }

        console.log(`[Cache Miss] fetching /contributors-graph for ${ownerRepo}`);
        const gh = getGitHub(token || process.env.GITHUB_TOKEN);

        // Fetch commit activity. WARNING: GitHub often returns 202 Accepted and an empty body if the stats aren't cached yet on their end!
        const activityRes = await gh.get(`/repos/${owner}/${repo}/stats/contributors`).catch(() => ({ data: [] }));
        const statsData = Array.isArray(activityRes.data) ? activityRes.data : [];

        // Nodes are built later depending on API success

        // Build edges: contributors who both worked in same weeks
        const links = [];
        const authorMap = {};
        const authorStats = {}; // To build nodes if needed

        if (statsData.length > 0) {
            // Using GitHub Stats
            statsData.forEach(stat => {
                if (!stat.author) return;
                const weeks = stat.weeks.filter(w => w.c > 0).map(w => w.w);
                authorMap[stat.author.login] = new Set(weeks);
            });
        } else {
            console.log(`[Graph Fallback] Generating collaboration graph from ${commits.length} commits.`);
            // Fallback: Using raw commits to natively map week-by-week collaboration
            commits.forEach(c => {
                const authorName = c.author || 'Unknown';
                if (!c.date) return;
                const d = new Date(c.date);
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay()); // group to a Sunday-starting week timestamp
                const weekKey = startOfWeek.getTime();

                if (!authorMap[authorName]) authorMap[authorName] = new Set();
                authorMap[authorName].add(weekKey);

                // Track stats to rebuild nodes
                if (!authorStats[authorName]) {
                    authorStats[authorName] = { id: authorName, name: authorName, avatar: c.avatarUrl, contributions: 0, url: '#' };
                }
                authorStats[authorName].contributions++;
            });
        }

        // Rebuild nodes from fallback if the primary contributor array was useless
        let nodes = (contributors || []).map((c) => ({
            id: c.login,
            name: c.login,
            avatar: c.avatarUrl,
            contributions: c.contributions,
            url: c.url,
            size: Math.max(10, Math.min(60, Math.sqrt(c.contributions) * 3)),
        }));

        if (nodes.length === 0 && Object.keys(authorStats).length > 0) {
            nodes = Object.values(authorStats).map(c => ({
                ...c,
                size: Math.max(10, Math.min(60, Math.sqrt(c.contributions) * 3))
            }));
        }

        const logins = Object.keys(authorMap);
        for (let i = 0; i < Math.min(logins.length, 20); i++) {
            for (let j = i + 1; j < Math.min(logins.length, 20); j++) {
                const shared = [...authorMap[logins[i]]].filter(w => authorMap[logins[j]].has(w)).length;
                if (shared > 1) {
                    links.push({ source: logins[i], target: logins[j], strength: shared });
                }
            }
        }

        // Bus factor
        const total = (contributors || []).reduce((s, c) => s + c.contributions, 0);
        let busFactor = 0;
        let cumulative = 0;
        const sorted = [...(contributors || [])].sort((a, b) => b.contributions - a.contributions);
        for (const c of sorted) {
            cumulative += c.contributions;
            busFactor++;
            if (cumulative / total >= 0.5) break;
        }

        const responseData = { nodes, links, busFactor, totalContributors: nodes.length };

        // Save to Cache
        await RepoCache.findOneAndUpdate(
            { ownerRepo },
            { $set: { graphData: responseData } },
            { upsert: true }
        );

        res.json(responseData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/repo/ai-insights
// Body: { repoUrl, token, commits, contributors, hotFiles }
router.post('/ai-insights', async (req, res) => {
    const { commits = [], contributors = [], hotFiles = [], info = {} } = req.body;

    try {
        // === Commit Truthfulness Analysis ===
        const commitTruth = commits.slice(0, 50).map(c => {
            const msg = c.message.toLowerCase();
            const trivialWords = ['minor', 'small', 'tiny', 'fix typo', 'little', 'trivial', 'quick'];
            const dangerWords = ['refactor', 'restructure', 'rewrite', 'overhaul', 'replace', 'migrate'];
            const bugWords = ['fix', 'bug', 'patch', 'hotfix', 'resolve', 'correct'];

            let label = 'honest';
            let reason = 'Commit message appears accurate.';

            if (trivialWords.some(w => msg.includes(w)) && msg.length < 30) {
                label = 'potentially-misleading';
                reason = 'Message suggests trivial change but may be understated.';
            }
            if (dangerWords.some(w => msg.includes(w))) {
                label = 'high-impact';
                reason = 'This commit likely involves significant structural change.';
            }
            if (bugWords.some(w => msg.includes(w))) {
                label = 'bugfix';
                reason = 'Bug-fix commit — review for regression risk.';
            }
            if (msg.includes('wip') || msg.includes('todo') || msg.includes('temp')) {
                label = 'dangerous';
                reason = 'WIP/TODO commit slipped into history. May indicate instability.';
            }

            return {
                sha: c.sha,
                shortSha: c.shortSha,
                message: c.message,
                author: c.author,
                date: c.date,
                label,
                reason,
            };
        });

        // === Ghost Files ===
        const ghostFiles = hotFiles
            .filter(f => f.churn <= 2)
            .slice(0, 10)
            .map(f => ({
                path: f.path,
                churn: f.churn,
                riskLevel: 'low-activity',
                warning: 'Rarely touched — could be dead code or a silent dependency.',
            }));

        // === Hotspot Files ===
        const hotspots = hotFiles
            .filter(f => f.churn >= 5)
            .slice(0, 10)
            .map(f => ({
                path: f.path,
                churn: f.churn,
                authors: f.authors,
                confidenceScore: Math.max(20, 100 - f.churn * 4 - (f.authors.length > 3 ? 15 : 0)),
                riskLevel: f.churn >= 15 ? 'critical' : f.churn >= 8 ? 'high' : 'medium',
                estimatedHoursLost: Math.round(f.churn * 2.5),
                warning: `High churn (${f.churn} changes). ${f.authors.length} contributors touched this file.`,
            }));

        // === Change Clusters ===
        const sorted = [...commits].sort((a, b) => new Date(a.date) - new Date(b.date));
        const clusters = [];
        if (sorted.length > 0) {
            const start = new Date(sorted[0]?.date);
            const end = new Date(sorted[sorted.length - 1]?.date);
            const total = end - start;
            const quarter = total / 4;

            const phases = [
                { label: 'Initial Build', emoji: '🌱', startOffset: 0, endOffset: 0.25, description: 'First commits establishing project structure.' },
                { label: 'Rapid Growth', emoji: '🚀', startOffset: 0.25, endOffset: 0.5, description: 'Feature development at pace.' },
                { label: 'Refactoring', emoji: '🔧', startOffset: 0.5, endOffset: 0.75, description: 'Code restructuring and optimization.' },
                { label: 'Stabilization', emoji: '🛡️', startOffset: 0.75, endOffset: 1.0, description: 'Bug fixes and stability improvements.' },
            ];

            phases.forEach(p => {
                const from = new Date(start.getTime() + p.startOffset * total);
                const to = new Date(start.getTime() + p.endOffset * total);
                const phaseCommits = sorted.filter(c => {
                    const d = new Date(c.date);
                    return d >= from && d <= to;
                });
                if (phaseCommits.length > 0) {
                    clusters.push({
                        ...p,
                        commits: phaseCommits.length,
                        startDate: from.toISOString(),
                        endDate: to.toISOString(),
                        startIndex: commits.findIndex(c => c.sha === phaseCommits[0]?.sha),
                        endIndex: commits.findIndex(c => c.sha === phaseCommits[phaseCommits.length - 1]?.sha),
                    });
                }
            });
        }

        // === Summary ===
        const summary = {
            totalCommits: commits.length,
            totalContributors: contributors.length,
            topLanguage: info.language || 'Unknown',
            hotspotCount: hotspots.length,
            ghostCount: ghostFiles.length,
            overallHealth: hotspots.length > 5 ? 'risky' : hotspots.length > 2 ? 'moderate' : 'healthy',
            recommendation: hotspots.length > 5
                ? 'This repository has multiple high-churn hotspots. Consider refactoring the top 3 files.'
                : 'Repository appears well-maintained. Focus on documentation and test coverage.',
        };

        res.json({ commitTruth, ghostFiles, hotspots, clusters, summary });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/repo/search
// Body: { query, commits, hotFiles, clusters, info }
router.post('/search', async (req, res) => {
    const { query = '', commits = [], hotFiles = [], clusters = [], info = {} } = req.body;

    const q = query.toLowerCase();

    let answer = '';
    let jumpToIndex = null;
    let highlightFiles = [];

    if (q.includes('what is') || q.includes('what does') || q.includes('about')) {
        answer = `**${info.name || 'This repository'}** — ${info.description || 'No description available.'}\n\nPrimary language: **${info.language || 'Unknown'}** | ${info.stars || 0} ⭐ stars | ${info.forks || 0} forks`;
    } else if (q.includes('last') && (q.includes('month') || q.includes('week') || q.includes('year'))) {
        const months = q.includes('year') ? 12 : q.includes('month') ? parseInt(q.match(/\d+/)?.[0] || 6) : 1;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        const recent = commits.filter(c => new Date(c.date) >= cutoff);
        answer = `In the last ${months} month(s), there were **${recent.length} commits**. ${recent.length > 50 ? 'This is a highly active period.' : recent.length > 10 ? 'Moderate activity.' : 'Low activity recently.'}`;
        jumpToIndex = commits.length - recent.length;
    } else if (q.includes('risky') || q.includes('dangerous') || q.includes('hotspot')) {
        highlightFiles = hotFiles.filter(f => f.churn >= 5).slice(0, 5).map(f => f.path);
        answer = `Top risky files with high churn:\n${highlightFiles.map(f => `• \`${f}\``).join('\n')}\n\nThese files change frequently and may be fragile.`;
    } else if (q.includes('auth') || q.includes('login') || q.includes('security')) {
        highlightFiles = hotFiles.filter(f => f.path.toLowerCase().match(/auth|login|security|token|jwt|session/)).map(f => f.path);
        answer = highlightFiles.length > 0
            ? `Found ${highlightFiles.length} authentication-related file(s):\n${highlightFiles.map(f => `• \`${f}\``).join('\n')}`
            : 'No obvious authentication files found in the hot-change list. Try searching the codebase directly.';
    } else if (q.includes('contributor') || q.includes('who')) {
        answer = `This repository has **${info.contributors || 'multiple'} contributors**. The most active ones drive the majority of commits.`;
    } else if (q.includes('phase') || q.includes('growth') || q.includes('refactor')) {
        const cluster = clusters.find(c => q.includes(c.label.toLowerCase()));
        if (cluster) {
            jumpToIndex = cluster.startIndex;
            answer = `**${cluster.emoji} ${cluster.label}** phase: ${cluster.commits} commits from ${new Date(cluster.startDate).toLocaleDateString()} to ${new Date(cluster.endDate).toLocaleDateString()}.\n${cluster.description}`;
        } else {
            answer = `Detected phases: ${clusters.map(c => `${c.emoji} ${c.label} (${c.commits} commits)`).join(', ')}`;
        }
    } else {
        answer = `I searched the repository history for **"${query}"**. Try asking about:\n• What is this repo for?\n• Risky files to touch\n• What changed in the last 6 months?\n• Authentication logic\n• Which phase is the repo in?`;
    }

    res.json({ answer, jumpToIndex, highlightFiles });
});

// POST /api/repo/progress
// Body: { commits, contributors, info, releases }
router.post('/progress', async (req, res) => {
    const { commits = [], contributors = [], info = {}, releases = [] } = req.body;

    try {
        // === Monthly Commit Frequency ===
        const monthMap = {};
        commits.forEach(c => {
            if (!c.date) return;
            const d = new Date(c.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthMap[key]) monthMap[key] = { month: key, commits: 0, authors: new Set() };
            monthMap[key].commits++;
            monthMap[key].authors.add(c.author);
        });
        const monthlyActivity = Object.values(monthMap)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(m => ({ month: m.month, commits: m.commits, authors: m.authors.size }));

        // === Author Share (for pie chart) ===
        const authorMap = {};
        commits.forEach(c => {
            authorMap[c.author] = (authorMap[c.author] || 0) + 1;
        });
        const authorShare = Object.entries(authorMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([author, count]) => ({ author, commits: count, pct: Math.round((count / commits.length) * 100) }));

        // Others bucket
        const topTotal = authorShare.reduce((s, a) => s + a.commits, 0);
        if (topTotal < commits.length) {
            authorShare.push({ author: 'Others', commits: commits.length - topTotal, pct: Math.round(((commits.length - topTotal) / commits.length) * 100) });
        }

        // === Weekly Velocity (rolling 4-week avg) ===
        const weekMap = {};
        commits.forEach(c => {
            if (!c.date) return;
            const d = new Date(c.date);
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - d.getDay());
            const key = startOfWeek.toISOString().split('T')[0];
            weekMap[key] = (weekMap[key] || 0) + 1;
        });
        const weeklyVelocity = Object.entries(weekMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-24) // last 24 weeks
            .map(([week, count]) => ({ week, commits: count }));

        // === Lifecycle stats ===
        const sortedByDate = [...commits].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstCommit = sortedByDate[0]?.date;
        const lastCommit = sortedByDate[sortedByDate.length - 1]?.date;
        const ageMonths = firstCommit && lastCommit
            ? Math.round((new Date(lastCommit) - new Date(firstCommit)) / (30.44 * 86400000))
            : 0;
        const avgCommitsPerMonth = ageMonths > 0 ? Math.round(commits.length / ageMonths) : commits.length;
        const peakMonth = monthlyActivity.reduce((max, m) => m.commits > (max?.commits || 0) ? m : max, null);

        // === Releases timeline ===
        const releaseTimeline = releases
            .filter(r => r.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(r => ({
                name: r.name,
                date: r.date,
                monthKey: new Date(r.date).toISOString().substring(0, 7),
            }));

        res.json({
            monthlyActivity,
            authorShare,
            weeklyVelocity,
            releaseTimeline,
            stats: {
                firstCommit,
                lastCommit,
                ageMonths,
                avgCommitsPerMonth,
                peakMonth: peakMonth?.month,
                peakCommits: peakMonth?.commits,
                totalAuthors: Object.keys(authorMap).length,
            },
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
