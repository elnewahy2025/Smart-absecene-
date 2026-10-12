import fs from 'fs';

async function generate() {
  const res = await fetch('http://127.0.0.1:3000/api/pdf/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'falah.localhost:3000',
    },
    body: JSON.stringify({
      htmlContent: '<div dir="rtl"><h1>تقرير مدرسة الفلاح</h1><p>طالب حاضر ومعتمد</p></div>',
      title: 'تقرير مدرسة الفلاح',
      filename: 'تقرير_مدرسة_الفلاح.pdf'
    }),
  });

  console.log('Status:', res.status, res.headers.get('content-type'));
  const json = await res.json();
  console.log('Success:', json.success, 'Size:', json.size, 'Filename:', json.filename);
  const buf = Buffer.from(json.pdfBase64, 'base64');
  console.log('PDF Header bytes:', buf.subarray(0, 10).toString('utf8'));
  console.log('Total bytes:', buf.length);
  fs.writeFileSync('sample_report.pdf', buf);
  console.log('Written sample_report.pdf successfully!');
}

generate().catch(console.error);
