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
    
    // Proportional crisp font sizing
    this.size = Math.random() * 4 + 10; // 10px to 14px
    
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

  update(mouseX: number, mouseY: number, time: number, boundsWidth: number, boundsHeight: number) {
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
      const repelRadius = 140;
      
      if (distance < repelRadius) {
        const force = (repelRadius - distance) / repelRadius;
        const targetSpeedX = (dx / (distance || 1)) * force * 2.0;
        const targetSpeedY = (dy / (distance || 1)) * force * 2.0;
        
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

    // Wrap around screen seamlessly using dynamic bounds
    if (this.y < -40) this.y = boundsHeight + 40;
    if (this.y > boundsHeight + 40) this.y = -40;
    if (this.x < -180) this.x = boundsWidth + 180;
    if (this.x > boundsWidth + 180) this.x = -180;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.max(0.04, this.opacity)})`;
    ctx.font = `500 ${Math.round(this.size)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
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
    let currentWidth = 0;
    let currentHeight = 0;

    const handleResize = () => {
      // Use documentElement dimensions for 100% accurate viewport bounds on mobile
      const width = document.documentElement.clientWidth || window.innerWidth || 360;
      const height = window.innerHeight || document.documentElement.clientHeight || 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      currentWidth = width;
      currentHeight = height;

      // Set physical canvas pixel buffer
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      // Set CSS dimensions to 1:1 match physical display
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Reset and set clean transform matrix without compounding scales
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Adjust particle count based on screen real estate
      particles = [];
      const numParticles = Math.floor((width * height) / 18000);
      const count = Math.max(18, Math.min(numParticles, 65));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(width, height));
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
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse.x, mouse.y, time, currentWidth, currentHeight);
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
      className="fixed inset-0 pointer-events-none -z-10 bg-slate-950"
    />
  );
}