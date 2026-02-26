import { useEffect, useRef } from 'react';

const GIT_COLORS = ['#00ff88', '#7c3aed', '#38bdf8', '#fb923c', '#f472b6'];

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

export default function GitBackground({ intensity = 1 }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);

        // Nodes (commits)
        const NODE_COUNT = Math.floor(50 * intensity);
        const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
            id: i,
            x: randomBetween(0, W),
            y: randomBetween(0, H),
            vx: randomBetween(-0.3, 0.3),
            vy: randomBetween(-0.3, 0.3),
            r: randomBetween(3, 8),
            color: GIT_COLORS[Math.floor(Math.random() * GIT_COLORS.length)],
            pulse: randomBetween(0, Math.PI * 2),
            pulseSpeed: randomBetween(0.02, 0.05),
            branch: Math.floor(Math.random() * 4),
            commitChar: Math.random().toString(36).substring(2, 9),
        }));

        // Edges (connections between commits on same branch)
        const edges = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].branch === nodes[j].branch && Math.random() < 0.15) {
                    edges.push({ from: i, to: j });
                }
            }
        }

        // Floating code chars
        const CHAR_COUNT = 40;
        const chars = Array.from({ length: CHAR_COUNT }, () => ({
            x: randomBetween(0, W),
            y: randomBetween(-100, H),
            speed: randomBetween(0.5, 2),
            opacity: randomBetween(0.03, 0.12),
            char: randomBetween(0, 1) > 0.5
                ? Math.random().toString(36).substring(2, 3)
                : ['git', 'HEAD', 'main', 'feat', 'fix', 'push', 'pull', 'merge', 'commit'][Math.floor(Math.random() * 9)],
            size: randomBetween(10, 18),
        }));

        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);

        let frame = 0;

        function draw() {
            // Clear with fade
            ctx.fillStyle = 'rgba(10, 14, 20, 0.2)';
            ctx.fillRect(0, 0, W, H);

            frame++;

            // Draw edges
            edges.forEach(e => {
                const n1 = nodes[e.from];
                const n2 = nodes[e.to];
                const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
                if (dist > 350) return;
                const alpha = (1 - dist / 350) * 0.15;
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                // Bezier curve for branches
                const mx = (n1.x + n2.x) / 2 + (Math.sin(frame * 0.005 + e.from) * 30);
                const my = (n1.y + n2.y) / 2;
                ctx.quadraticCurveTo(mx, my, n2.x, n2.y);
                ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach(n => {
                n.pulse += n.pulseSpeed;
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > W) n.vx *= -1;
                if (n.y < 0 || n.y > H) n.vy *= -1;

                const pulseR = n.r + Math.sin(n.pulse) * 2;
                const alpha = 0.3 + Math.sin(n.pulse) * 0.2;

                // Outer glow
                const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulseR * 4);
                grad.addColorStop(0, n.color + '44');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(n.x, n.y, pulseR * 4, 0, Math.PI * 2);
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
                ctx.fillStyle = n.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.fill();

                // Commit SHA label (tiny)
                if (n.r > 5) {
                    ctx.font = '9px JetBrains Mono';
                    ctx.fillStyle = n.color + '66';
                    ctx.fillText(n.commitChar, n.x + 10, n.y + 4);
                }
            });

            // Draw falling code chars
            chars.forEach(c => {
                c.y += c.speed;
                if (c.y > H + 50) c.y = -50;

                ctx.font = `${c.size}px JetBrains Mono`;
                ctx.fillStyle = `rgba(0, 255, 136, ${c.opacity})`;
                ctx.fillText(c.char, c.x, c.y);
            });

            animRef.current = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [intensity]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
}
