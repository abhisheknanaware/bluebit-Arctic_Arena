import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 60000,
});

export const analyzeRepo = (repoUrl, token) =>
    API.post('/repo/analyze', { repoUrl, token }).then(r => r.data);

export const fetchHeatmap = (repoUrl, token, commits) =>
    API.post('/repo/heatmap', { repoUrl, token, commits }).then(r => r.data);

export const fetchContributorGraph = (repoUrl, token, contributors, commits) =>
    API.post('/repo/contributors-graph', { repoUrl, token, contributors, commits }).then(r => r.data);

export const fetchAiInsights = (repoUrl, token, commits, contributors, hotFiles, info) =>
    API.post('/repo/ai-insights', { repoUrl, token, commits, contributors, hotFiles, info }).then(r => r.data);

export const fetchProgress = (commits, contributors, info, releases) =>
    API.post('/repo/progress', { commits, contributors, info, releases }).then(r => r.data);

export const searchRepo = (query, commits, hotFiles, clusters, info) =>
    API.post('/repo/search', { query, commits, hotFiles, clusters, info }).then(r => r.data);

export default API;
