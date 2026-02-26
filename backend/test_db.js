import mongoose from 'mongoose';
import RepoCache from './models/RepoCache.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB Connected.');
        const cache = await RepoCache.findOne({ ownerRepo: 'facebook/react' });
        if (cache && cache.graphData) {
            console.log('GRAPH DATA:');
            console.log(`Nodes: ${cache.graphData.nodes?.length}`);
            console.log(`Links: ${cache.graphData.links?.length}`);
            console.log(`Bus Factor: ${cache.graphData.busFactor}`);
            console.log(`Total Contributors: ${cache.graphData.totalContributors}`);
            if (cache.graphData.nodes?.length > 0) {
                console.log('Sample node keys:', Object.keys(cache.graphData.nodes[0]));
            }
        } else {
            console.log('No cache found or no graphData for facebook/react');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
