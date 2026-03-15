import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function BackgroundEffects() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const bloomRef = useRef({ x: -1000, y: -1000 });
  const requestRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // --- Configuration ---
    const starCount = isMobile ? 80 : 180;
    const particleCount = isMobile ? 30 : 60;
    const connectionDist = 120;
    const mouseRadius = 150;
    const bloomRadius = 280;
    const lerpFactor = 0.08;

    // --- State Initialization ---
    // Layer 1: Stars
    const stars = Array.from({ length: starCount }, () => {
      const p = Math.random();
      let size = 0.5;
      if (p > 0.6 && p <= 0.9) size = 1.2;
      else if (p > 0.9) size = 2.5;

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        speed: size * 0.05,
        opacity: Math.random() * 0.5 + 0.5,
        pulse: Math.random() > 0.8,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        color: Math.random() > 0.85 
          ? (Math.random() > 0.5 ? 'rgba(201,168,76,0.7)' : 'rgba(120,100,255,0.6)')
          : 'rgba(255,255,255,0.9)'
      };
    });

    // Layer 3: Particle Web
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: 1.5,
    }));
    
    // Layer 2: Soul Particles
    const soulParticles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      size: Math.random() * 1.5 + 1.5,
      opacity: Math.random() * 0.2 + 0.2,
      shadowBlur: Math.random() * 15 + 10
    }));

    let auroraTime = 0;

    // --- Interaction ---
    const handleMouseMove = (e) => {
      if (isMobile) return;
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    const animate = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      auroraTime += 0.001;

      // 4. Cursor Bloom (Interpolated)
      if (!isMobile) {
        bloomRef.current.x += (mouseRef.current.x - bloomRef.current.x) * lerpFactor;
        bloomRef.current.y += (mouseRef.current.y - bloomRef.current.y) * lerpFactor;
        
        const gradient = ctx.createRadialGradient(
          bloomRef.current.x, bloomRef.current.y, 0,
          bloomRef.current.x, bloomRef.current.y, bloomRadius
        );
        gradient.addColorStop(0, 'rgba(201,168,76,0.1)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bloomRef.current.x, bloomRef.current.y, bloomRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. Render Stars
      stars.forEach(s => {
        if (s.pulse) {
          s.opacity += Math.sin(time * s.pulseSpeed) * 0.02;
          s.opacity = Math.max(0.3, Math.min(0.9, s.opacity));
        }
        
        s.y -= s.speed;
        if (s.y < 0) s.y = canvas.height;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 2. Render Aurora Ribbons
      const drawAurora = (color, yOffset, amplitude) => {
        ctx.save();
        ctx.filter = 'blur(40px)';
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 300;
        
        const cp1x = canvas.width * 0.3 + Math.cos(auroraTime * 0.6) * 300;
        const cp1y = yOffset + Math.sin(auroraTime * 0.3) * amplitude;
        const cp2x = canvas.width * 0.7 + Math.sin(auroraTime * 0.5) * 300;
        const cp2y = yOffset - Math.cos(auroraTime * 0.4) * amplitude;

        ctx.moveTo(-200, yOffset);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, canvas.width + 200, yOffset);
        ctx.stroke();
        ctx.restore();
      };

      drawAurora('rgba(220, 20, 60, 0.18)', canvas.height * 0.45, 140);
      drawAurora('rgba(60,40,180,0.15)', canvas.height * 0.35, 180);
      drawAurora('rgba(201,168,76,0.12)', canvas.height * 0.65, 120);

      // 3. Render Particle Web
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (!isMobile) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius) {
            const force = (mouseRadius - dist) / mouseRadius;
            p.x += (dx / dist) * force * 0.6;
            p.y += (dy / dist) * force * 0.6;
          }
        }

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = 'rgba(201,168,76,0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
          if (dist < connectionDist) {
            ctx.strokeStyle = `rgba(201,168,76, ${0.15 * (1 - dist/connectionDist)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      // 5. Render Soul Particles
      soulParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = p.shadowBlur;
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [isMobile]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#050508] z-0">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* CSS Atmospheric Layers */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.45, 0.7, 0.45],
          x: [-20, 20, -20],
          y: [-20, 20, -20],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent blur-[120px]"
      />

      <motion.div 
        animate={{ 
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.65, 0.4],
          x: [20, -20, 20],
          y: [20, -20, 20],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-20 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-950/30 via-transparent to-transparent blur-[120px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(5,5,8,0.85)_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
