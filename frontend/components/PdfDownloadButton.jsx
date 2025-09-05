'use client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PdfDownloadButton({ targetId, filename='skinai-report.pdf' }){
  const onClick = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(imgData, 'PNG', (pageWidth-w)/2, 20, w, h);
    pdf.save(filename);
  };
  return <button onClick={onClick} className="btn btn-primary">Download PDF</button>;
}
