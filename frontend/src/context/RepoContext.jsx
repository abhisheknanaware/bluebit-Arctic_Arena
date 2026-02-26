import React, { createContext, useContext, useReducer } from 'react';

const RepoContext = createContext(null);

const initialState = {
    // Input
    repoUrl: '',
    token: '',
    // Repo data
    repoInfo: null,
    commits: [],
    contributors: [],
    releases: [],
    tags: [],
    totalCommits: 0,
    owner: '',
    repo: '',
    // Analysis
    heatmapData: null,
    hotFiles: [],
    contributorGraph: null,
    aiInsights: null,
    // UI state
    loading: false,
    error: null,
    activeMode: 'visualization', // 'visualization' | 'intelligence' | 'story'
    activeView: 'timeline', // 'timeline' | 'heatmap' | 'contributor'
    // Playback
    currentCommitIndex: 0,
    isPlaying: false,
    playbackSpeed: 1,
    // Filters
    filterAuthor: '',
    filterDir: '',
    showRiskyOverlay: false,
    showUnstableOverlay: false,
    // Search
    searchQuery: '',
    searchResult: null,
    searchLoading: false,
    // Memory
    lastVisitedIndex: 0,
    exploredFiles: [],
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_REPO_URL': return { ...state, repoUrl: action.payload };
        case 'SET_TOKEN': return { ...state, token: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload, error: null };
        case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
        case 'SET_REPO_DATA': return { ...state, ...action.payload, loading: false, error: null };
        case 'SET_HEATMAP': return { ...state, heatmapData: action.payload.hierarchy, hotFiles: action.payload.hotFiles };
        case 'SET_CONTRIBUTOR_GRAPH': return { ...state, contributorGraph: action.payload };
        case 'SET_AI_INSIGHTS': return { ...state, aiInsights: action.payload };
        case 'SET_MODE': return { ...state, activeMode: action.payload };
        case 'SET_VIEW': return { ...state, activeView: action.payload };
        case 'SET_COMMIT_INDEX': return { ...state, currentCommitIndex: action.payload, lastVisitedIndex: action.payload };
        case 'INCREMENT_COMMIT_INDEX': {
            if (state.currentCommitIndex >= action.payload.max) {
                return { ...state, isPlaying: false };
            }
            const nextIdx = state.currentCommitIndex + 1;
            return { ...state, currentCommitIndex: nextIdx, lastVisitedIndex: nextIdx };
        }
        case 'SET_PLAYING': return { ...state, isPlaying: action.payload };
        case 'SET_SPEED': return { ...state, playbackSpeed: action.payload };
        case 'SET_FILTER_AUTHOR': return { ...state, filterAuthor: action.payload };
        case 'SET_FILTER_DIR': return { ...state, filterDir: action.payload };
        case 'TOGGLE_RISKY': return { ...state, showRiskyOverlay: !state.showRiskyOverlay };
        case 'TOGGLE_UNSTABLE': return { ...state, showUnstableOverlay: !state.showUnstableOverlay };
        case 'SET_SEARCH_QUERY': return { ...state, searchQuery: action.payload };
        case 'SET_SEARCH_RESULT': return { ...state, searchResult: action.payload, searchLoading: false };
        case 'SET_SEARCH_LOADING': return { ...state, searchLoading: action.payload };
        case 'ADD_EXPLORED_FILE': return {
            ...state,
            exploredFiles: [...new Set([...state.exploredFiles, action.payload])].slice(-20),
        };
        case 'RESET': return { ...initialState };
        default: return state;
    }
}

export function RepoProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <RepoContext.Provider value={{ state, dispatch }}>
            {children}
        </RepoContext.Provider>
    );
}

export function useRepo() {
    const ctx = useContext(RepoContext);
    if (!ctx) throw new Error('useRepo must be used within RepoProvider');
    return ctx;
}

export default RepoContext;
