'use client';
import { useState } from 'react';

export default function BeforeAfterCompare({ before, after }){
  const [pos, setPos] = useState(50);
  return (
    <div className="card">
      <div className="h2 mb-3">Before – After</div>
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
        <img src={after} className="w-full block" alt="after" />
        <img src={before} style={{clipPath:`inset(0 ${100-pos}% 0 0)`}} className="w-full absolute inset-0" alt="before" />
        <input type="range" value={pos} onChange={e=>setPos(parseInt(e.target.value))}
          className="w-full absolute bottom-2 left-0 right-0" />
      </div>
    </div>
  );
}
