const axios = require('axios');

async function testGraph() {
    try {
        console.log("Fetching root repo data for facebook/react");
        const initData = await axios.post('http://localhost:3001/api/repo/analyze', { repoUrl: 'https://github.com/facebook/react' });
        const { contributors, commits } = initData.data;

        console.log(`Sending ${contributors?.length} contributors and ${commits?.length} commits to graph generator`);

        const graphData = await axios.post('http://localhost:3001/api/repo/contributors-graph', {
            repoUrl: 'https://github.com/facebook/react',
            contributors: contributors,
            commits: commits
        });

        console.log('Graph Response Summary:');
        console.log('- Total Nodes:', graphData.data.nodes?.length);
        console.log('- Total Links:', graphData.data.links?.length);
        console.log('- Bus Factor:', graphData.data.busFactor);

        if (graphData.data.nodes?.length > 0) {
            console.log('Sample node:', graphData.data.nodes[0]);
        }
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

testGraph();
