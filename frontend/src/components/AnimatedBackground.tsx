'use client';

import React, { useEffect, useRef } from 'react';

const SYNTAX_SNIPPETS = [
  'const', 'let', '=>', '{}', '[]', '<Component />', 'function()', 'return',
  'import { useState }', 'useEffect(() => {}, [])', 'console.log()', 'await', 
  'async', 'class', 'interface', 'type', 'try', 'catch', 'export default',
  '<div>', '</div>', 'props', 'state', 'map()', 'filter()', 'reduce()'
];

class Particle {
  x: number;
  y: number;
  text: string;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
  scattered: boolean;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.text = SYNTAX_SNIPPETS[Math.floor(Math.random() * SYNTAX_SNIPPETS.length)];
    this.size = Math.random() * 14 + 10; // 10px to 24px
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5 - 0.2; // slight upward drift
    this.baseOpacity = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
    this.opacity = this.baseOpacity;
    this.scattered = false;
  }

  update(mouseX: number, mouseY: number) {
    if (this.scattered) {
      this.opacity -= 0.02;
      this.y += this.speedY * 5;
      this.x += this.speedX * 5;
    } else {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around
      if (this.y < -50) this.y = window.innerHeight + 50;
      if (this.x < -50) this.x = window.innerWidth + 50;
      if (this.x > window.innerWidth + 50) this.x = -50;

      // Mouse interaction
      if (mouseX !== -1 && mouseY !== -1) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          this.scattered = true;
          // Fly away from mouse
          this.speedX = -dx * 0.05;
          this.speedY = -dy * 0.05;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.fillStyle = `rgba(100, 150, 255, ${this.opacity})`;
    ctx.font = `${this.size}px monospace`;
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

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize particles on resize
      particles = [];
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 15000);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(mouse.x, mouse.y);
        p.draw(ctx);

        // Respawn dead particles
        if (p.opacity <= 0) {
          particles[i] = new Particle(canvas.width, canvas.height);
          // Spawn at random edge or completely random if we want continuous flow
        }
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
      className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0f111a]"
      style={{ pointerEvents: 'none' }}
    />
  );
}
