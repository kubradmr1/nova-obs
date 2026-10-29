import {
  UNIVERSITY_NAME,
  UNIVERSITY_UNIT,
  UNIVERSITY_VERIFICATION,
} from '@/config/branding';
import { ACADEMIC_HISTORY, COURSES, STUDENT } from '@/data/student';
import {
  computeAverage,
  formatGpa,
  formatGrade,
  letterPoints,
  resolveLetter,
  summarizeSemester,
} from '@/utils/grading';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const longDate = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function documentNumber(prefix: string): string {
  return `NOVA-${prefix}-${new Date().getFullYear()}-${STUDENT.identifier}`;
}

function verificationPattern(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 33 + char.charCodeAt(0)) % 4093;
  }

  const cells: string[] = [];
  for (let index = 0; index < 49; index += 1) {
    hash = (hash * 1103515245 + 12345) % 2147483648;
    const filled = hash % 3 !== 0;
    cells.push(`<span style="background:${filled ? '#0f172a' : 'transparent'}"></span>`);
  }

  return `<div class="qr-grid" aria-label="Doğrulama kodu">${cells.join('')}</div>`;
}

function signatureBlock(code: string): string {
  return `
    <div class="signature">
      <div class="seal">e-imza</div>
      <div class="signature-body">
        <div class="signature-line"></div>
        <p class="signature-name">${escapeHtml(STUDENT.advisor)}</p>
        <p class="signature-role">Danışman Akademisyen · ${escapeHtml(STUDENT.department)}</p>
        <p class="signature-meta">${escapeHtml(UNIVERSITY_VERIFICATION)} · ${escapeHtml(code)}</p>
      </div>
    </div>`;
}

function documentShell(title: string, heading: string, documentNo: string, body: string): string {
  const origin = window.location.origin;

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef1f8; color: #0f172a; font-family: "Segoe UI", Inter, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; background: #0b0a18; }
    .toolbar button { border: 0; border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .toolbar .primary { background: linear-gradient(110deg, #7c5cff, #5f6bff); color: #fff; }
    .toolbar .ghost { background: rgba(255,255,255,0.12); color: #fff; }
    .sheet { width: 210mm; min-height: 277mm; margin: 20px auto; padding: 18mm 18mm 14mm; background: #fff; border-radius: 14px; box-shadow: 0 30px 80px -50px rgba(15,23,42,0.65); display: flex; flex-direction: column; }
    .doc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 14px; border-bottom: 2px solid #7c5cff; }
    .brand { display: flex; align-items: center; gap: 11px; }
    .brand img { width: 44px; height: 44px; border-radius: 13px; }
    .brand h1 { margin: 0; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; }
    .brand p { margin: 4px 0 0; font-size: 9px; color: #64748b; }
    .doc-meta { text-align: right; font-size: 9px; color: #64748b; }
    .doc-meta strong { display: block; color: #0f172a; font-size: 10px; }
    .doc-title { margin: 26px 0 4px; text-align: center; font-size: 22px; letter-spacing: 0.1em; text-transform: uppercase; }
    .doc-subtitle { margin: 0 0 22px; text-align: center; font-size: 10px; color: #64748b; }
    .lead { font-size: 12px; line-height: 1.8; margin: 0 0 18px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
    .info-grid div { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .info-grid div:nth-child(odd) { border-right: 1px solid #e2e8f0; }
    .info-grid div:nth-last-child(-n+2) { border-bottom: 0; }
    .info-grid span { display: block; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; }
    .info-grid strong { display: block; margin-top: 3px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 18px; }
    thead th { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 8px 7px; text-align: left; font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; }
    tbody td { border-bottom: 1px solid #eef2f7; padding: 7px; }
    tbody tr:nth-child(even) { background: #fbfcfe; }
    tfoot td { border-top: 1px solid #cbd5e1; padding: 8px 7px; font-weight: 700; }
    .numeric { text-align: center; font-variant-numeric: tabular-nums; }
    .summary { display: flex; gap: 10px; margin: 0 0 18px; }
    .summary div { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 11px; }
    .summary span { display: block; font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; }
    .summary strong { display: block; margin-top: 3px; font-size: 16px; }
    .summary small { color: #94a3b8; font-size: 9px; font-weight: 500; }
    .signature { margin-top: auto; display: flex; align-items: center; justify-content: flex-end; gap: 18px; padding-top: 26px; }
    .seal { width: 62px; height: 62px; border: 2px solid #7c5cff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #7c5cff; font-size: 10px; font-weight: 800; letter-spacing: 0.04em; transform: rotate(-8deg); }
    .signature-body { min-width: 230px; text-align: center; }
    .signature-line { height: 1px; background: #cbd5e1; margin-bottom: 7px; }
    .signature-name { margin: 0; font-size: 11px; font-weight: 700; }
    .signature-role { margin: 3px 0 0; font-size: 9px; color: #64748b; }
    .signature-meta { margin: 5px 0 0; font-size: 8px; color: #94a3b8; }
    .qr-grid { display: grid; grid-template-columns: repeat(7, 6px); gap: 2px; padding: 5px; border: 1px solid #e2e8f0; border-radius: 6px; }
    .qr-grid span { width: 6px; height: 6px; border-radius: 1px; }
    .footnote { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 20px; font-size: 8px; line-height: 1.6; color: #94a3b8; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .sheet { width: auto; min-height: 0; margin: 0; padding: 0; border-radius: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="ghost" onclick="window.close()">Kapat</button>
    <button class="primary" onclick="window.print()">PDF olarak kaydet</button>
  </div>
  <main class="sheet">
    <header class="doc-header">
      <div class="brand">
        <img src="${origin}/nova-mark.svg" alt="" />
        <div>
          <h1>${escapeHtml(UNIVERSITY_NAME)}</h1>
          <p>${escapeHtml(UNIVERSITY_UNIT)} · Öğrenci Bilgi Sistemi</p>
        </div>
      </div>
      <div class="doc-meta">
        <span>Belge no</span>
        <strong>${escapeHtml(documentNo)}</strong>
        <span>${escapeHtml(longDate.format(new Date()))}</span>
      </div>
    </header>
    <h2 class="doc-title">${escapeHtml(heading)}</h2>
    <p class="doc-subtitle">Nova Teknik Üniversitesi Öğrenci Bilgi Sistemi üzerinden üretilmiştir</p>
    ${body}
  </main>
</body>
</html>`;
}

function openPrintableDocument(title: string, heading: string, documentNo: string, body: string) {
  const popup = window.open('', '_blank', 'width=920,height=1040');
  if (!popup) {
    return false;
  }

  popup.document.open();
  popup.document.write(documentShell(title, heading, documentNo, body));
  popup.document.close();
  popup.document.title = title;

  const triggerPrint = () => {
    try {
      popup.focus();
      popup.print();
    } catch {
      // Yazdırma diyaloğu engellenirse kullanıcı araç çubuğundaki düğmeyi kullanabilir.
    }
  };

  window.setTimeout(triggerPrint, 500);
  return true;
}

export function openStudentCertificate(): boolean {
  const code = documentNumber('OB');
  const body = `
    <p class="lead">
      Bu belge; <strong>${escapeHtml(UNIVERSITY_NAME)}</strong> ${escapeHtml(STUDENT.faculty)}
      ${escapeHtml(STUDENT.department)} programı <strong>${escapeHtml(STUDENT.identifier)}</strong>
      numaralı öğrencisi <strong>${escapeHtml(STUDENT.name)}</strong>’ın
      <strong>${escapeHtml(STUDENT.term)}</strong> eğitim-öğretim döneminde öğrenimine aktif olarak
      devam ettiğini doğrulamak amacıyla düzenlenmiştir.
    </p>

    <div class="info-grid">
      <div><span>Öğrenci no</span><strong>${escapeHtml(STUDENT.identifier)}</strong></div>
      <div><span>Kayıt durumu</span><strong>Aktif öğrenci</strong></div>
      <div><span>Fakülte</span><strong>${escapeHtml(STUDENT.faculty)}</strong></div>
      <div><span>Bölüm</span><strong>${escapeHtml(STUDENT.department)}</strong></div>
      <div><span>Program</span><strong>${escapeHtml(STUDENT.program)}</strong></div>
      <div><span>Sınıf</span><strong>${escapeHtml(STUDENT.classYear)}</strong></div>
      <div><span>Kayıt yılı</span><strong>${escapeHtml(STUDENT.enrolledAt)}</strong></div>
      <div><span>Danışman</span><strong>${escapeHtml(STUDENT.advisor)}</strong></div>
    </div>

    <p class="lead">
      Belge, ${escapeHtml(UNIVERSITY_VERIFICATION)} adresinden belge numarası ile doğrulanabilir.
      5070 sayılı Elektronik İmza Kanunu kapsamında e-imza ile imzalanmıştır.
    </p>

    ${signatureBlock(code)}

    <div class="footnote">
      <span>Bu belge demo amaçlı üretilmiştir; resmî belge niteliği taşımaz.</span>
      <span>${verificationPattern(code)}</span>
    </div>`;

  return openPrintableDocument(
    `Nova-Teknik-Ogrenci-Belgesi-${STUDENT.identifier}`,
    'Öğrenci Belgesi',
    code,
    body,
  );
}

export function openTranscriptDocument(): boolean {
  const code = documentNumber('TR');
  const summary = summarizeSemester(COURSES);

  const rows = COURSES.map((course) => {
    const average = computeAverage(course.midterm, course.final);
    const letter = resolveLetter(average);

    return `
      <tr>
        <td><strong>${escapeHtml(course.name)}</strong><br /><span style="font-size:8px;color:#94a3b8;">${escapeHtml(course.code)}</span></td>
        <td class="numeric">${course.credits}</td>
        <td class="numeric">${course.ects}</td>
        <td class="numeric">${formatGrade(average)}</td>
        <td class="numeric"><strong>${letter}</strong></td>
        <td class="numeric">${formatGrade(letterPoints(letter))}</td>
      </tr>`;
  }).join('');

  const historyRows = ACADEMIC_HISTORY.map(
    (semester) => `
      <tr>
        <td>${escapeHtml(semester.term)}</td>
        <td class="numeric">${semester.ects}</td>
        <td class="numeric">${formatGpa(semester.gpa)}</td>
        <td class="numeric">${semester.status === 'ongoing' ? 'Devam ediyor' : 'Tamamlandı'}</td>
      </tr>`,
  ).join('');

  const body = `
    <div class="info-grid">
      <div><span>Öğrenci</span><strong>${escapeHtml(STUDENT.name)}</strong></div>
      <div><span>Öğrenci no</span><strong>${escapeHtml(STUDENT.identifier)}</strong></div>
      <div><span>Program</span><strong>${escapeHtml(STUDENT.program)}</strong></div>
      <div><span>Danışman</span><strong>${escapeHtml(STUDENT.advisor)}</strong></div>
    </div>

    <div class="summary">
      <div><span>Genel not ortalaması</span><strong>${formatGpa(STUDENT.cumulativeGpa)} <small>/ 4,00</small></strong></div>
      <div><span>Dönem ortalaması</span><strong>${formatGpa(summary.gpa)} <small>/ 4,00</small></strong></div>
      <div><span>Toplam AKTS</span><strong>${STUDENT.completedEcts} <small>/ ${STUDENT.totalEcts}</small></strong></div>
      <div><span>Başarılı ders</span><strong>${summary.passedCount} <small>/ ${COURSES.length}</small></strong></div>
    </div>

    <table>
      <caption style="text-align:left;font-size:10px;font-weight:700;padding-bottom:6px;">
        ${escapeHtml(STUDENT.term)} dönem dökümü · ${summary.credits} kredi · ${summary.ects} AKTS
      </caption>
      <thead>
        <tr>
          <th>Ders</th>
          <th class="numeric">Kredi</th>
          <th class="numeric">AKTS</th>
          <th class="numeric">Ortalama</th>
          <th class="numeric">Harf</th>
          <th class="numeric">Katsayı</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td>Dönem sonu</td>
          <td class="numeric">${summary.credits}</td>
          <td class="numeric">${summary.ects}</td>
          <td class="numeric">—</td>
          <td class="numeric">GNO</td>
          <td class="numeric">${formatGpa(summary.gpa)}</td>
        </tr>
      </tfoot>
    </table>

    <table>
      <caption style="text-align:left;font-size:10px;font-weight:700;padding-bottom:6px;">Akademik geçmiş</caption>
      <thead>
        <tr>
          <th>Dönem</th>
          <th class="numeric">AKTS</th>
          <th class="numeric">GNO</th>
          <th class="numeric">Durum</th>
        </tr>
      </thead>
      <tbody>${historyRows}</tbody>
    </table>

    ${signatureBlock(code)}

    <div class="footnote">
      <span>Bu transkript demo amaçlı üretilmiştir; resmî belge niteliği taşımaz. Vize %40, final %60 ağırlığıyla hesaplanmıştır.</span>
      <span>${verificationPattern(code)}</span>
    </div>`;

  return openPrintableDocument(
    `Nova-Teknik-Transkript-${STUDENT.identifier}`,
    'Transkript',
    code,
    body,
  );
}
