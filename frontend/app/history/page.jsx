'use client';
import { getHistory } from '../../lib/storage';
import { useEffect, useState } from 'react';
import LineChartCard from '../../components/LineChartCard';
import BeforeAfterCompare from '../../components/BeforeAfterCompare';

export default function HistoryPage(){
  const [rows, setRows] = useState([]);

  useEffect(()=>{ setRows(getHistory()); }, []);

  const last = rows[rows.length-1];
  const prev = rows[rows.length-2];

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <LineChartCard data={rows} />
      <div className="card">
        <div className="h2 mb-2">ประวัติการวิเคราะห์</div>
        {rows.length? (
          <ul className="text-sm text-slate-700 space-y-1 max-h-72 overflow-auto">
            {rows.slice().reverse().map((r,i)=>(
              <li key={i} className="flex items-center justify-between border-b py-2">
                <span>{new Date(r.ts).toLocaleString()}</span>
                <span className="font-medium">{r.severity} ({Math.round(r.severityScore)})</span>
              </li>
            ))}
          </ul>
        ) : <div className="muted">ยังไม่มีข้อมูล</div>}
      </div>
      {(last && prev) ? <BeforeAfterCompare before={prev.image} after={last.image} /> : <div className="card">อัปโหลดอย่างน้อย 2 ครั้งเพื่อเปรียบเทียบ Before–After</div>}
    </div>
  );
}
