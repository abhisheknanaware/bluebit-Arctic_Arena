import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useRepo } from '../../context/RepoContext.jsx';

export default function ContributorGraph() {
    const { state } = useRepo();
    const { contributorGraph } = state;
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const simRef = useRef(null);

    useEffect(() => {
        if (!contributorGraph || !svgRef.current || !containerRef.current) return;

        const { nodes: rawNodes, links: rawLinks, busFactor } = contributorGraph;
        if (!rawNodes || !rawNodes.length) return;

        const container = containerRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const svg = d3.select(svgRef.current)
            .attr('width', W)
            .attr('height', H)
            .style('background', 'transparent');
        svg.selectAll('*').remove();

        const nodes = rawNodes.map(n => ({ ...n }));
        const links = rawLinks.map(l => ({ ...l }));

        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(nodes.map((_, i) => i))
            .range(['#00ff88', '#a855f7', '#38bdf8', '#fb923c', '#f472b6', '#fbbf24', '#34d399', '#60a5fa']);

        // Force simulation - Balanced Constraints
        const sim = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.5))
            .force('charge', d3.forceManyBody().strength(-200)) // Higher repulsion
            .force('center', d3.forceCenter(W / 2, H / 2).strength(0.05))
            .force('x', d3.forceX(W / 2).strength(0.08)) // Gentler gravity
            .force('y', d3.forceY(H / 2).strength(0.08)) // Gentler gravity
            .force('collision', d3.forceCollide(d => d.size + 20).iterations(3));

        simRef.current = sim;

        // Defs: arrow markers
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15).attr('refY', 0)
            .attr('markerWidth', 6).attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'rgba(0,255,136,0.4)');

        // Glow filter
        const filter = defs.append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'coloredBlur');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'coloredBlur');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Links
        const link = svg.append('g').selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', 'rgba(0,255,136,0.2)')
            .attr('stroke-width', d => Math.max(1, Math.min(5, d.strength / 3)))
            .attr('stroke-dasharray', '4,4');

        // Node groups
        const node = svg.append('g').selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'contributor-node')
            .style('cursor', 'pointer')
            .call(
                d3.drag()
                    .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
                    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                    .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
            )
            .on('click', (event, d) => setSelectedNode(d));

        // Glow circles
        node.append('circle')
            .attr('r', d => d.size + 8)
            .attr('fill', (d, i) => colorScale(i) + '15')
            .attr('filter', 'url(#glow)');

        // Main circles
        node.append('circle')
            .attr('r', d => d.size)
            .attr('fill', (d, i) => colorScale(i) + '33')
            .attr('stroke', (d, i) => colorScale(i))
            .attr('stroke-width', 2);

        // Avatar placeholder
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', d => Math.max(10, d.size * 0.7))
            .attr('fill', '#fff')
            .text(d => d.name.charAt(0).toUpperCase());

        // Name labels
        node.append('text')
            .attr('x', 0)
            .attr('y', d => d.size + 16)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(255,255,255,0.7)')
            .attr('font-size', '11px')
            .attr('font-family', 'JetBrains Mono')
            .text(d => d.name.length > 14 ? d.name.substring(0, 12) + '…' : d.name);

        // Contribution count
        node.append('text')
            .attr('x', 0)
            .attr('y', d => d.size + 28)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(0,255,136,0.6)')
            .attr('font-size', '9px')
            .attr('font-family', 'JetBrains Mono')
            .text(d => `${d.contributions} commits`);

        sim.on('tick', () => {
            // Hard clamp nodes inside the screen box
            nodes.forEach(d => {
                d.x = Math.max(d.size + 10, Math.min(W - d.size - 10, d.x));
                d.y = Math.max(d.size + 10, Math.min(H - d.size - 10, d.y));
            });

            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        return () => sim.stop();
    }, [contributorGraph]);

    if (!contributorGraph) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div className="loader-ring" />
                <p style={{ color: '#475569' }}>Building contributor graph...</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                position: 'absolute', top: 12, left: 12, right: 12, zIndex: 5,
                display: 'flex', alignItems: 'center', gap: 12
            }}>
                <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', gap: 20 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>👥 Contributor Graph</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {contributorGraph.totalContributors} contributors
                    </span>
                    <span style={{ color: '#fb923c', fontSize: '0.8rem' }}>
                        🚌 Bus Factor: {contributorGraph.busFactor}
                        {contributorGraph.busFactor <= 2 && <span style={{ color: '#f87171' }}> ⚠️ HIGH RISK</span>}
                    </span>
                </div>
                <div className="glass-card" style={{ padding: '8px 14px' }}>
                    <span style={{ color: '#475569', fontSize: '0.75rem' }}>Drag nodes · Click for details</span>
                </div>
            </div>

            {/* SVG */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <svg ref={svgRef} />
            </div>

            {/* Selected node panel */}
            {selectedNode && (
                <div style={{
                    position: 'absolute', right: 16, top: 60,
                    width: 220,
                    background: 'rgba(13, 17, 23, 0.95)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: 12, padding: '16px', zIndex: 10,
                    backdropFilter: 'blur(16px)',
                }}>
                    <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(0,255,136,0.2)', border: '2px solid #00ff88',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', fontWeight: 700, color: '#00ff88'
                        }}>
                            {selectedNode.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{selectedNode.name}</div>
                            <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', fontSize: '0.75rem' }}>View Profile ↗</a>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Commits</span>
                            <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{selectedNode.contributions}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Impact Size</span>
                            <span style={{ color: '#a855f7', fontFamily: 'JetBrains Mono' }}>{selectedNode.size.toFixed(0)}px node</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
