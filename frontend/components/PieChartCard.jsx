'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PieChartCard({ data=[] }){
  const COLORS = ['#4f46e5','#06b6d4','#f59e0b','#ef4444'];
  return (
    <div className="card">
      <div className="h2 mb-3">สัดส่วนปัญหาผิว (Pie)</div>
      <div style={{width:'100%', height:300}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie dataKey="value" data={data} outerRadius={110} label>
              {data.map((_, i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
