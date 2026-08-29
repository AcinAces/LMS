'use client';

import React, { useEffect, useRef } from 'react';

// Universally recognized, memorable, and iconic short syntax snippets
const SYNTAX_SNIPPETS = [
  // Competitive Programming & C++
  'int main()', 'cin >> n;', 'cout << ans << endl;', 'return 0;',
  'for (int i = 0; i < n; i++)', 'vector<int> v;', 'v.push_back(x);',
  'sort(v.begin(), v.end());', 'map<string, int> mp;', 'pair<int, int>',
  'queue<int> q;', 'stack<int> s;', 'priority_queue<int> pq;',
  'int mid = (l + r) / 2;', 'binary_search()', 'dp[i][j]',
  'ans = max(ans, cur);', '1e9 + 7', 'O(n log n)', 'O(1)',
  'while (t--)', 'bool ok = true;', 'nullptr', '#include <iostream>',
  
  // Python
  'def solve():', 'print(ans)', 'for i in range(n):', 'arr.sort()',
  'len(arr)', 'map(int, input().split())', "if __name__ == '__main__':",
  'lambda x: x * 2', 'yield result', 'list(range(n))', 'dict()', 'set()',
  'return True', 'import math', 'min(a, b)', 'max(a, b)',
  
  // JavaScript / TypeScript / React
  'const [state, setState] = useState();', 'useEffect(() => {}, []);',
  'console.log("Accepted!");', 'await fetch(url);', 'async () => {}',
  'export default function()', 'interface User', 'type Node = { val: number }',
  'Promise.all([p1, p2])', 'JSON.stringify(data)', 'arr.map(x => x * 2)',
  'arr.filter(Boolean)', 'arr.reduce((a, b) => a + b, 0)', 'setTimeout(fn, 100)',
  'try { ... } catch (e) {}', '<Component {...props} />', '<></>',
  
  // SQL & Git & Web
  'SELECT * FROM users', 'WHERE status = "AC"', 'GROUP BY user_id',
  'ORDER BY score DESC', 'git commit -m "Accepted"', 'git push origin main',
  'npm run dev', 'display: flex;', 'justify-content: center;'
];

const COLOR_PALETTE = [
  { r: 52, g: 211, b: 153 },  // emerald-400
  { r: 6, g: 182, b: 212 },   // cyan-500
  { r: 96, g: 165, b: 250 },  // blue-400
  { r: 45, g: 212, b: 191 },  // teal-400
  { r: 167, g: 139, b: 250 }  // purple-400
];

class Particle {
  x: number;
  y: number;
  text: string;
  size: number;
  speedX: number;
  speedY: number;
  baseSpeedX: number;
  baseSpeedY: number;
  color: { r: number; g: number; b: number };
  baseOpacity: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  sineOffset: number;
  sineSpeed: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.text = SYNTAX_SNIPPETS[Math.floor(Math.random() * SYNTAX_SNIPPETS.length)];
    
    // Balanced font size for clean readability without clutter
    this.size = Math.random() * 5 + 9; // 9px to 14px
    
    // Organic gentle drift
    this.baseSpeedX = (Math.random() - 0.5) * 0.2;
    this.baseSpeedY = - (Math.random() * 0.25 + 0.1); // gentle floating upward
    this.speedX = this.baseSpeedX;
    this.speedY = this.baseSpeedY;
    
    this.color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    this.baseOpacity = Math.random() * 0.18 + 0.08; // 0.08 to 0.26
    this.opacity = this.baseOpacity;
    
    // Subtle breathing pulse
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
    this.pulseOffset = Math.random() * Math.PI * 2;
    
    // Horizontal gentle wave
    this.sineOffset = Math.random() * Math.PI * 2;
    this.sineSpeed = Math.random() * 0.015 + 0.005;
  }

  update(mouseX: number, mouseY: number, time: number) {
    // Subtle sine wave motion
    this.sineOffset += this.sineSpeed;
    const waveX = Math.sin(this.sineOffset) * 0.15;

    // Pulsing opacity
    this.pulseOffset += this.pulseSpeed;
    this.opacity = this.baseOpacity + Math.sin(this.pulseOffset) * 0.04;

    // Smooth mouse interaction - repulse radius
    if (mouseX !== -1 && mouseY !== -1) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 160;
      
      if (distance < repelRadius) {
        const force = (repelRadius - distance) / repelRadius;
        const targetSpeedX = (dx / (distance || 1)) * force * 2.2;
        const targetSpeedY = (dy / (distance || 1)) * force * 2.2;
        
        this.speedX += (targetSpeedX - this.speedX) * 0.08;
        this.speedY += (targetSpeedY - this.speedY) * 0.08;
      } else {
        this.speedX += (this.baseSpeedX + waveX - this.speedX) * 0.03;
        this.speedY += (this.baseSpeedY - this.speedY) * 0.03;
      }
    } else {
      this.speedX += (this.baseSpeedX + waveX - this.speedX) * 0.03;
      this.speedY += (this.baseSpeedY - this.speedY) * 0.03;
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around screen seamlessly
    if (this.y < -40) this.y = window.innerHeight + 40;
    if (this.y > window.innerHeight + 40) this.y = -40;
    if (this.x < -180) this.x = window.innerWidth + 180;
    if (this.x > window.innerWidth + 180) this.x = -180;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.max(0.02, this.opacity)})`;
    ctx.font = `500 ${this.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.fillText(this.text, this.x, this.y);
  }
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1, y: -1 };
    let time = 0;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      
      particles = [];
      // Adjust density based on screen size
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 16000);
      for (let i = 0; i < Math.max(25, Math.min(numParticles, 75)); i++) {
        particles.push(new Particle(window.innerWidth, window.innerHeight));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1;
      mouse.y = -1;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    handleResize();

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse.x, mouse.y, time);
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-950"
      style={{ pointerEvents: 'none', width: '100vw', height: '100vh' }}
    />
  );
}