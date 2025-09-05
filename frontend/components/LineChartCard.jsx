'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LineChartCard({ data=[] }){
  const fmt = (ts) => new Date(ts).toLocaleDateString();
  const rows = data.map(d => ({ x: fmt(d.ts), y: d.severityScore }));
  return (
    <div className="card">
      <div className="h2 mb-3">แนวโน้มความรุนแรง (Line)</div>
      <div style={{width:'100%', height:320}}>
        <ResponsiveContainer>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
