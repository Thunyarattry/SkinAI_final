'use client';
import { useEffect, useRef } from 'react';

export default function AnalysisCanvas({ src, boxes=[], mode='box' }){
  const ref = useRef(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = ref.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img,0,0);
      if (mode==='box') {
        ctx.lineWidth = Math.max(2, canvas.width/300);
        boxes.forEach(b => {
          ctx.strokeStyle = '#2563eb';
          ctx.strokeRect(b.x*canvas.width, b.y*canvas.height, b.w*canvas.width, b.h*canvas.height);
          ctx.fillStyle = 'rgba(37,99,235,0.2)';
          ctx.fillRect(b.x*canvas.width, b.y*canvas.height, b.w*canvas.width, b.h*canvas.height);
          ctx.fillStyle = '#1f2937';
          ctx.font = `${Math.max(12, canvas.width/40)}px sans-serif`;
          ctx.fillText(b.label, b.x*canvas.width+4, b.y*canvas.height+18);
        });
      } else {
        ctx.fillStyle = 'rgba(99,102,241,0.25)';
        boxes.forEach(b => {
          ctx.beginPath();
          ctx.ellipse((b.x+b.w/2)*canvas.width, (b.y+b.h/2)*canvas.height, b.w*canvas.width/1.8, b.h*canvas.height/1.8, 0, 0, Math.PI*2);
          ctx.fill();
        });
      }
    };
    img.src = src;
  }, [src, boxes, mode]);

  return <canvas ref={ref} className="w-full rounded-xl border border-slate-200" />;
}
