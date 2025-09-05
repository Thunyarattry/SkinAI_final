'use client';
import { useEffect, useState } from 'react';
import { analyzeImage } from '../../lib/api-adapter';
import AnalysisCanvas from '../../components/AnalysisCanvas';
import { addHistory } from '../../lib/storage';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
  const [img, setImg] = useState('');
  const [res, setRes] = useState(null);
  const [mode, setMode] = useState('box');
  const router = useRouter();

  useEffect(() => {
    const upStr = localStorage.getItem('skinai_last_upload');
    if (!upStr) return;

    try {
      const up = JSON.parse(upStr); // Parse JSON object
      if (!up.preview) return;

      setImg(up.preview); // Use preview for display

      analyzeImage(up.preview).then((r) => {
        setRes(r);

        // Store history
        const record = {
          ts: Date.now(),
          severity: r.severity,
          severityScore: r.severityScore,
          pie: r.pie,
          image: up.preview,
          fileName: up.name,
          uploadTime: up.uploadTime
        };
        addHistory(record);
        localStorage.setItem('skinai_last_analysis', JSON.stringify(record));
      });
    } catch (e) {
      console.error('Failed to load last upload', e);
    }
  }, []);

  if (!img) {
    return (
      <div className="card">
        ไม่พบรูปภาพ โปรดอัปโหลดที่หน้า{' '}
        <button className="text-blue-600" onClick={() => router.push('/upload')}>
          Upload
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className="card">
        <div className="h2 mb-2">AI Analysis</div>
        <div className="muted mb-4">
          ตรวจจับสิว / ฝ้า / กระ / รอยดำ และระดับความรุนแรง
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode('box')}
            className={`btn ${mode === 'box' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Bounding Box
          </button>
          <button
            onClick={() => setMode('mask')}
            className={`btn ${mode === 'mask' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Segmentation Mask
          </button>
        </div>
        {res ? (
          <AnalysisCanvas src={img} boxes={res.boxes} mode={mode} />
        ) : (
          <div className="muted">กำลังประมวลผล…</div>
        )}
      </div>
      <div className="card">
        <div className="h2 mb-2">Result</div>
        {res ? (
          <div>
            <div className="mb-2">
              Severity:{' '}
              <span className="font-semibold">{res.severity}</span> (
              {Math.round(res.severityScore)})
            </div>
            <ul className="list-disc list-inside text-slate-600 text-sm">
              {res.pie.map((p) => (
                <li key={p.name}>
                  {p.name}: {p.value}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <a href="/report" className="btn btn-primary">
                Create Report
              </a>
              <a href="/upload" className="btn btn-ghost">
                Analyze another
              </a>
            </div>
          </div>
        ) : (
          <div className="muted">…</div>
        )}
      </div>
    </div>
  );
}
