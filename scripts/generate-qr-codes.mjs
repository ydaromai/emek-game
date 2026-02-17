import QRCode from 'qrcode';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://emek-kappa.vercel.app';

const animals = [
  { name_he: 'שלדג', order_index: 1, qr_token: 'c6a9aa96-e58a-4c71-bcbc-5b773a3a9ae4' },
  { name_he: 'לוטרה', order_index: 2, qr_token: 'a80e93fe-da0c-4a52-88e8-9636d997e4d2' },
  { name_he: 'אנפה', order_index: 3, qr_token: 'a942bfd1-2a14-4748-adb4-f342e596a57a' },
  { name_he: 'צב ביצות', order_index: 4, qr_token: '3b440a29-4d1a-40bb-9ef2-baf3c84decf8' },
  { name_he: 'אילנית', order_index: 5, qr_token: '1f9ea972-b084-4cd0-b1c7-9115a63b9138' },
  { name_he: 'סרטן מים מתוקים', order_index: 6, qr_token: '4e0cd51f-8384-4d1b-bd0d-a7d10fa72b28' },
  { name_he: 'שפירית', order_index: 7, qr_token: '7db5b89f-ca4a-41fd-b314-770140d18607' },
  { name_he: 'בינון', order_index: 8, qr_token: '29d371e2-7d65-4b74-970a-f5490969d8a2' },
  { name_he: 'נמייה', order_index: 9, qr_token: 'c4fe290e-40c8-4536-bf68-c8fbcf2de810' },
  { name_he: 'פרפר', order_index: 10, qr_token: 'c4b4040c-3504-4275-92c1-d27b6eeb0761' },
];

mkdirSync('qr-codes', { recursive: true });

// Generate individual SVG files
for (const animal of animals) {
  const url = `${BASE_URL}/scan/${animal.qr_token}`;
  const svg = await QRCode.toString(url, { type: 'svg', width: 300, margin: 2 });
  const filename = `qr-codes/${String(animal.order_index).padStart(2, '0')}-${animal.name_he}.svg`;
  writeFileSync(filename, svg);
  console.log(`✓ ${filename} → ${url}`);
}

// Generate printable HTML page with all QR codes
let html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>QR Codes — פארק המעיינות</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .card {
    border: 2px solid #2F5D50;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    page-break-inside: avoid;
  }
  .card h2 { color: #2F5D50; margin: 0 0 5px; font-size: 22px; }
  .card .number { color: #4DB6AC; font-size: 14px; margin-bottom: 10px; }
  .card svg { max-width: 200px; height: auto; }
  .card .url { font-size: 9px; color: #999; margin-top: 8px; word-break: break-all; }
  h1 { text-align: center; color: #2F5D50; margin-bottom: 30px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>פארק המעיינות — קודי QR לתחנות</h1>
<div class="grid">
`;

for (const animal of animals) {
  const url = `${BASE_URL}/scan/${animal.qr_token}`;
  const svg = await QRCode.toString(url, { type: 'svg', width: 200, margin: 2 });
  html += `<div class="card">
  <h2>${animal.name_he}</h2>
  <div class="number">תחנה ${animal.order_index} מתוך 10</div>
  ${svg}
  <div class="url">${url}</div>
</div>\n`;
}

html += `</div>\n</body>\n</html>`;
writeFileSync('qr-codes/print-all.html', html);
console.log('\n✓ qr-codes/print-all.html — printable page with all QR codes');
console.log('\nDone! Open qr-codes/print-all.html in a browser and print to PDF or paper.');
