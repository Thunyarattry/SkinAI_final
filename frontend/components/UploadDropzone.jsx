'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadDropzone({ onLoaded }) {
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    setError('');
    if (!accepted?.length) return;
    const file = accepted[0];
    const ok = ['image/jpeg','image/png'].includes(file.type);
    if (!ok) { setError('รองรับเฉพาะ JPG/PNG'); return; }
    const reader = new FileReader();
    reader.onload = () => onLoaded?.(reader.result, file);
    reader.readAsDataURL(file);
  }, [onLoaded]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop, multiple: false, accept: { 'image/*': ['.jpg','.jpeg','.png'] },
  });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${isDragActive? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-300/80'}`}>
      <input {...getInputProps()} />
      <div className="text-5xl">📤</div>
      <div className="font-medium mt-2">Drag & Drop รูปภาพที่นี่</div>
      <div className="muted text-sm">หรือคลิกเพื่อเลือกไฟล์ (JPG/PNG)</div>
      {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
    </div>
  );
}
