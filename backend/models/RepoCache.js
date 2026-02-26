import mongoose from 'mongoose';

const repoCacheSchema = new mongoose.Schema({
    // Composite key: e.g. "facebook/react"
    ownerRepo: { type: String, required: true, unique: true, index: true },

    // Timestamp when this data was fetched from GitHub
    analyzedAt: { type: Date, default: Date.now },

    // Fetch Progress Tracking (User Request: "mongoose session retry progress")
    fetchStatus: { type: String, enum: ['none', 'fetching', 'complete', 'failed'], default: 'none' },
    lastFetchedPage: { type: Number, default: 0 },
    partialCommits: Array,
    partialInfo: Object,
    partialContributors: Array,
    partialReleases: Array,
    partialTags: Array,

    // Data payload from the POST /analyze endpoint
    analyzeData: {
        info: Object,
        commits: Array,
        contributors: Array,
        releases: Array,
        tags: Array,
        totalCommits: Number,
        owner: String,
        repo: String,
    },

    // Data payload from the POST /heatmap endpoint
    heatmapData: {
        hierarchy: Object,
        hotFiles: Array,
        totalFiles: Number,
    },

    // Data payload from the POST /contributors-graph endpoint
    graphData: {
        nodes: Array,
        links: Array,
        busFactor: Number,
        totalContributors: Number,
    }
}, { timestamps: true });

export default mongoose.model('RepoCache', repoCacheSchema);
