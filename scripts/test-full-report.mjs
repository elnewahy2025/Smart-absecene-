import fs from 'fs';

async function testFullReport() {
  const sampleHtml = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; padding: 20px;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; font-size: 16px; font-weight: bold;">المملكة العربية السعودية</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">وزارة التعليم</p>
          <p style="margin: 2px 0; font-size: 13px; font-weight: bold;">مدرسة الفلاح المتوسطة الحديثة</p>
          <span style="font-size: 11px; color: #64748b;">كود المنشأة: FALAH-202</span>
        </div>
        <div style="text-align: center;">
          <div style="background: #065f46; color: white; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">ح</div>
          <h3 style="margin: 6px 0 2px; font-size: 15px;">تقرير الانضباط والحضور المدرسي</h3>
          <span style="font-size: 12px; color: #047857; font-weight: 600;">التقرير الإحصائي الشامل للطلاب</span>
        </div>
        <div style="direction: ltr; text-align: left; font-size: 11px; color: #475569;">
          <div>التاريخ: 12 أكتوبر 2026</div>
          <div>العام: 1448-1447 هـ</div>
          <div>الفصل الدراسي الأول</div>
          <div>نطاق الفصل: جميع الفصول</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
        <div>
          <span style="font-size: 11px; color: #64748b; display: block;">إجمالي الطلاب المقيدين:</span>
          <strong style="font-size: 16px; color: #0f172a;">3 طالب</strong>
        </div>
        <div>
          <span style="font-size: 11px; color: #64748b; display: block;">متوسط نسبة الحضور:</span>
          <strong style="font-size: 16px; color: #047857;">93.8%</strong>
        </div>
        <div>
          <span style="font-size: 11px; color: #64748b; display: block;">حالات الإنذار الثاني:</span>
          <strong style="font-size: 16px; color: #b45309;">1 طالب</strong>
        </div>
        <div>
          <span style="font-size: 11px; color: #64748b; display: block;">حالات حرجة:</span>
          <strong style="font-size: 16px; color: #e11d48;">0 طالب</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; color: #1e293b; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 30px;">م</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم الطالب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرقم المدرسي</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">السجل المدني</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الفصل</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">أيام الغياب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">نسبة الحضور</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التصنيف الإجرائي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">1</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">عبد الرحمن بن خالد العتيبي</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">STU-1049</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">1109823451</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">ثالث متوسط / 1</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #b45309; font-weight: bold;">5 أيام</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">88.5%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #b45309;">إنذار مرحلة ثانية (خطي)</td>
          </tr>
          <tr style="background: #fafafa;">
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">2</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">محمد بن فهد الدوسري</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">STU-1052</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">1123498765</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">ثاني متوسط / 2</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #047857;">1 يوم</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">96.0%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #047857;">منتظم ومستقر</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">3</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">فيصل بن عبد الله الغامدي</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">STU-1088</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">1145678901</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">أول متوسط / 3</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #047857;">0 يوم</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">100%</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #047857;">مثالي (شهادة تميز)</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; display: flex; justify-content: space-between; border-top: 1px dashed #94a3b8; padding-top: 15px; font-size: 11px;">
        <div>
          <div>المرشد الطلابي: أ. عبد العزيز الدوسري</div>
          <div>التوقيع: ............................</div>
        </div>
        <div>
          <div>وكيل شؤون الطلاب: أ. فيصل المالكي</div>
          <div>التوقيع: ............................</div>
        </div>
        <div>
          <div>مدير المدرسة: أ. سامي بن أحمد الزهراني</div>
          <div>الختم الرسمي: ............................</div>
        </div>
      </div>
    </div>
  `;

  const res = await fetch('http://127.0.0.1:3000/api/pdf/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'falah.localhost:3000'
    },
    body: JSON.stringify({
      htmlContent: sampleHtml,
      title: 'تقرير الانضباط والحضور المدرسي - مدرسة الفلاح',
      filename: 'تقرير_الانضباط_مدرسة_الفلاح.pdf'
    })
  });

  console.log('Response Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Disposition:', res.headers.get('content-disposition'));
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('Buffer byte length:', buf.length);
  console.log('Header magic bytes:', buf.subarray(0, 10).toString('utf8'));
  fs.writeFileSync('full_attendance_report.pdf', buf);
  console.log('Saved full_attendance_report.pdf successfully!');
}

testFullReport().catch(console.error);
