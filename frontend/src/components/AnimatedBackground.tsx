'use client';

import React, { useEffect, useRef } from 'react';

const SYNTAX_SNIPPETS = [
  // JS/TS
  'const', 'let', '=>', '{}', '[]', '<Component />', 'function()', 'return',
  'import { useState }', 'useEffect(() => {}, [])', 'console.log()', 'await', 
  'async', 'class', 'interface', 'type', 'try', 'catch', 'export default',
  'props', 'state', 'map()', 'filter()', 'reduce()', 'Promise.all()', 'setTimeout()',
  
  // HTML/CSS
  '<div>', '</div>', '<h1>', '/>', '</>', 'display: flex;', 'margin: 0;', 
  'color: #fff;', 'grid-template-columns:', 'box-sizing: border-box;',
  
  // Python
  'def __init__(self):', 'import pandas as pd', 'print()', "if __name__ == '__main__':",
  'lambda x: x', '@decorator', 'yield', 'self.', 'dict()', 'list()',
  
  // Java/C++/C#
  'public static void main', 'System.out.println', 'std::cout', '#include <iostream>',
  'virtual void', 'std::vector', 'List<String>', 'public class', 'private final',
  
  // SQL/Bash
  'SELECT * FROM', 'LEFT JOIN', 'WHERE id =', 'GROUP BY', 'npm run dev', 'git commit -m'
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
  opacity: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.text = SYNTAX_SNIPPETS[Math.floor(Math.random() * SYNTAX_SNIPPETS.length)];
    // Reduced size by 30% (was 10 to 22, now 7 to 15.4)
    this.size = (Math.random() * 12 + 10) * 0.7; 
    
    // Slower movement
    this.baseSpeedX = (Math.random() - 0.5) * 0.25;
    this.baseSpeedY = (Math.random() - 0.5) * 0.25 - 0.15; // gentle upward drift
    this.speedX = this.baseSpeedX;
    this.speedY = this.baseSpeedY;
    
    this.opacity = Math.random() * 0.25 + 0.05; // 0.05 to 0.3 opacity
  }

  update(mouseX: number, mouseY: number) {
    // Mouse interaction - smooth repulse
    if (mouseX !== -1 && mouseY !== -1) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 180;
      
      if (distance < repelRadius) {
        // Force is stronger the closer the mouse is
        const force = (repelRadius - distance) / repelRadius;
        
        // Push away (10% faster, was 1.5 now 1.65)
        const targetSpeedX = (dx / distance) * force * 1.65;
        const targetSpeedY = (dy / distance) * force * 1.65;
        
        // Smoothly accelerate towards the target pushed speed (10% faster reaction, was 0.05 now 0.055)
        this.speedX += (targetSpeedX - this.speedX) * 0.055;
        this.speedY += (targetSpeedY - this.speedY) * 0.055;
      } else {
        // Smoothly decelerate back to normal speed
        this.speedX += (this.baseSpeedX - this.speedX) * 0.03;
        this.speedY += (this.baseSpeedY - this.speedY) * 0.03;
      }
    } else {
      // Smoothly decelerate back to normal speed if mouse is out
      this.speedX += (this.baseSpeedX - this.speedX) * 0.03;
      this.speedY += (this.baseSpeedY - this.speedY) * 0.03;
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around screen seamlessly
    if (this.y < -50) this.y = window.innerHeight + 50;
    if (this.y > window.innerHeight + 50) this.y = -50;
    if (this.x < -150) this.x = window.innerWidth + 150;
    if (this.x > window.innerWidth + 150) this.x = -150;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Using the Teal primary accent color (rgb(0, 175, 182))
    ctx.fillStyle = `rgba(0, 175, 182, ${this.opacity})`;
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
      
      particles = [];
      // Adjust density based on screen size
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 17000);
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

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse.x, mouse.y);
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
      style={{ pointerEvents: 'none' }}
    />
  );
}