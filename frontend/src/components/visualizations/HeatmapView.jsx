import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useRepo } from '../../context/RepoContext.jsx';
import { Download } from 'lucide-react';

function churnToColor(value, max) {
    const ratio = Math.min(value / max, 1);
    if (ratio < 0.2) return '#0f3460';
    if (ratio < 0.4) return '#16213e';
    if (ratio < 0.6) return '#a855f7';
    if (ratio < 0.8) return '#fb923c';
    return '#f87171';
}

export default function HeatmapView() {
    const { state } = useRepo();
    const { heatmapData, hotFiles } = state;
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (!heatmapData || !svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const svg = d3.select(svgRef.current)
            .attr('width', W)
            .attr('height', H);
        svg.selectAll('*').remove();

        const root = d3.hierarchy(heatmapData)
            .sum(d => d.value || 0)
            .sort((a, b) => b.value - a.value);

        const maxChurn = root.leaves().reduce((m, n) => Math.max(m, n.value || 0), 1);

        const treemap = d3.treemap()
            .size([W, H])
            .paddingInner(2)
            .paddingOuter(4)
            .paddingTop(20)
            .round(true);

        treemap(root);

        const cell = svg.selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        // Rects
        cell.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('rx', d => d.depth === 0 ? 0 : 4)
            .attr('fill', d => {
                if (d.depth === 0) return 'transparent';
                if (!d.children) return churnToColor(d.value || 0, maxChurn);
                return d.depth === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)';
            })
            .attr('stroke', d => d.depth === 1 ? 'rgba(255,255,255,0.1)' : 'rgb(10,14,20,0.5)')
            .attr('stroke-width', d => d.depth === 1 ? 1 : 0.5)
            .style('cursor', 'pointer')
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('stroke', '#00ff88').attr('stroke-width', 2);
                const rect = containerRef.current.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - rect.left + 12,
                    y: event.clientY - rect.top - 10,
                    name: d.data.name,
                    path: d.data.path || d.data.name,
                    churn: d.value || 0,
                    authors: d.data.authors || [],
                });
            })
            .on('mousemove', function (event) {
                const rect = containerRef.current.getBoundingClientRect();
                setTooltip(t => t ? { ...t, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 10 } : t);
            })
            .on('mouseleave', function (event, d) {
                d3.select(this).attr('stroke', d.depth === 1 ? 'rgba(255,255,255,0.1)' : 'rgb(10,14,20,0.5)').attr('stroke-width', d.depth === 1 ? 1 : 0.5);
                setTooltip(null);
            })
            .on('click', (event, d) => {
                if (!d.children) setSelectedFile(d.data);
            });

        // Text labels
        cell.filter(d => d.depth === 1 && d.x1 - d.x0 > 40)
            .append('text')
            .attr('x', 4)
            .attr('y', 14)
            .text(d => d.data.name)
            .attr('fill', 'rgba(255,255,255,0.5)')
            .attr('font-size', '11px')
            .attr('font-family', 'JetBrains Mono')
            .attr('font-weight', '600');

        cell.filter(d => !d.children && d.x1 - d.x0 > 50 && d.y1 - d.y0 > 30)
            .append('text')
            .attr('x', (d) => (d.x1 - d.x0) / 2)
            .attr('y', (d) => (d.y1 - d.y0) / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(d => d.data.name.length > 12 ? d.data.name.substring(0, 10) + '…' : d.data.name)
            .attr('fill', 'rgba(255,255,255,0.8)')
            .attr('font-size', '10px')
            .attr('font-family', 'JetBrains Mono')
            .attr('pointer-events', 'none');

        // Value labels
        cell.filter(d => !d.children && d.x1 - d.x0 > 50 && d.y1 - d.y0 > 45)
            .append('text')
            .attr('x', (d) => (d.x1 - d.x0) / 2)
            .attr('y', (d) => (d.y1 - d.y0) / 2 + 14)
            .attr('text-anchor', 'middle')
            .text(d => `${d.value || 0} changes`)
            .attr('fill', 'rgba(255,255,255,0.5)')
            .attr('font-size', '9px')
            .attr('font-family', 'JetBrains Mono')
            .attr('pointer-events', 'none');

    }, [heatmapData]);

    function exportSVG() {
        if (!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'heatmap.svg'; a.click();
    }

    if (!heatmapData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div className="loader-ring" />
                <p style={{ color: '#475569' }}>Building heatmap...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                background: 'rgba(10,14,20,0.8)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0
            }}>
                <span style={{ color: '#e2e8f0', fontWeight: 700 }}>🔥 File Churn Heatmap</span>
                <span style={{ color: '#475569', fontSize: '0.82rem' }}>Color = churn intensity · Size = relative change frequency</span>
                <div style={{ flex: 1 }} />
                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Low</span>
                    {['#0f3460', '#16213e', '#a855f7', '#fb923c', '#f87171'].map(c => (
                        <div key={c} style={{ width: 20, height: 14, background: c, borderRadius: 3 }} />
                    ))}
                    <span>High</span>
                </div>
                <button className="btn-ghost" style={{ gap: 6, padding: '6px 12px' }} onClick={exportSVG}>
                    <Download size={14} /> Export SVG
                </button>
            </div>

            {/* SVG treemap */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <svg ref={svgRef} style={{ display: 'block' }} />

                {/* Tooltip */}
                {tooltip && (
                    <div style={{
                        position: 'absolute', left: tooltip.x, top: tooltip.y,
                        pointerEvents: 'none', zIndex: 10,
                        background: '#161d2b', border: '1px solid rgba(0,255,136,0.3)',
                        borderRadius: 8, padding: '10px 14px', maxWidth: 240,
                    }}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#00ff88', marginBottom: 4, wordBreak: 'break-all' }}>
                            {tooltip.path}
                        </div>
                        <div style={{ color: '#fb923c', fontSize: '0.85rem', fontWeight: 700 }}>{tooltip.churn} change{tooltip.churn !== 1 ? 's' : ''}</div>
                        {tooltip.authors.length > 0 && (
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>
                                👤 {tooltip.authors.slice(0, 3).join(', ')}{tooltip.authors.length > 3 ? ` +${tooltip.authors.length - 3}` : ''}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hot files panel */}
            {hotFiles.length > 0 && (
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    padding: '12px 20px', background: 'rgba(10,14,20,0.9)',
                    flexShrink: 0
                }}>
                    <p style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Top Hotspots
                    </p>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {hotFiles.slice(0, 8).map(f => (
                            <div key={f.path} style={{
                                flexShrink: 0, padding: '6px 12px',
                                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                                borderRadius: 6, cursor: 'pointer',
                            }}>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#f87171' }}>
                                    {f.path.split('/').pop()}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{f.churn} changes</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
