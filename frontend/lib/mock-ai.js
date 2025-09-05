export function mockAnalyze(base64) {
  const seed = (base64?.length || 12345) % 97;
  const rng = (a) => ((Math.sin(a*999)+1)/2);

  const acne = Math.max(1, Math.round(rng(seed+1)*6));
  const melasma = Math.max(0, Math.round(rng(seed+2)*4));
  const freckles = Math.max(0, Math.round(rng(seed+3)*5));
  const dark = Math.max(0, Math.round(rng(seed+4)*3));
  const total = acne + melasma + freckles + dark;

  const severityScore = Math.min(100, 20*acne + 15*melasma + 10*freckles + 12*dark);
  const severity = severityScore < 40 ? 'Mild' : severityScore < 70 ? 'Moderate' : 'Severe';

  const boxes = Array.from({length: Math.min(8, total)}, (_, i) => ({
    x: rng(seed+i)*0.6 + 0.2,
    y: rng(seed+i+10)*0.5 + 0.2,
    w: rng(seed+i+20)*0.15 + 0.05,
    h: rng(seed+i+30)*0.15 + 0.05,
    label: ['Acne','Melasma','Freckles','Dark Spot'][i%4]
  }));

  const pie = [
    { name: 'Acne', value: acne },
    { name: 'Melasma', value: melasma },
    { name: 'Freckles', value: freckles },
    { name: 'Dark Spots', value: dark },
  ];

  const suggestions = [
    { name: 'Gentle Cleanser', reason: 'ลดการอุดตัน เหมาะผิวเป็นสิว' },
    { name: 'Niacinamide 10%', reason: 'ช่วยรอยดำ/กระ ลดแดง' },
    { name: 'Azelaic Acid 10%', reason: 'สิวอุดตัน-รอยสิว' },
    { name: 'Sunscreen SPF50 PA++++', reason: 'กันกระ ฝ้า และรอยเข้ม' },
    { name: 'Moisturizer (Ceramides)', reason: 'ซ่อมเกราะผิว ลดระคายเคือง' },
  ];

  return { boxes, pie, severity, severityScore, suggestions };
}
