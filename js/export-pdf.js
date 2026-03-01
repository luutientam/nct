function escHtml(s) {
  if (s == null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function safeFilename(name, dateStr) {
  const base = (name || 'Bao_cao')
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*]/g, '');
  const d = (dateStr || '')
    .replace(/\//g, '-')
    .replace(/[^\d\-]/g, '');
  return d ? `${base}_${d}` : base;
}

function getPdfHtml(proj, vulns, counts, SEV_VN) {
  const font = "'Be Vietnam Pro', sans-serif";
  const style = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; font-family: ${font}; font-size: 11pt; color: #111; background: #fff; }
    @media print { body { padding: 0; } }
    #pdf-content { max-width: 210mm; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 10pt; }
    th, td { border: 1px solid #333; padding: 4pt 6pt; text-align: left; }
    th { background: #eee; }
    .tit { font-size: 17pt; font-weight: 700; text-align: center; margin: 0 0 4pt; }
    .sub { font-size: 11pt; text-align: center; margin: 0 0 10pt; color: #444; }
    .h { font-size: 11pt; font-weight: 700; margin: 8pt 0 3pt; }
    .block { margin: 2pt 0 8pt; padding: 5pt; background: #f5f5f5; border-left: 3px solid #333; white-space: pre-wrap; }
    .vuln { page-break-inside: avoid; margin-bottom: 10pt; }
  `;
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo kiểm thử bảo mật</title>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;700&display=swap" rel="stylesheet">
  <style>${style}</style>
</head>
<body>
  <div id="pdf-content">
    <div class="tit">BÁO CÁO KIỂM THỬ BẢO MẬT</div>
    <div class="sub">${escHtml(proj.name)} — ${escHtml(proj.date)}</div>
    <table>
      <tr><td style="width:26%;font-weight:700">Dự án</td><td>${escHtml(proj.name)}</td></tr>
      <tr><td style="font-weight:700">Mục tiêu</td><td>${escHtml(proj.target)}</td></tr>
      <tr><td style="font-weight:700">Đơn vị / Kiểm thử viên</td><td>${escHtml(proj.org)} — ${escHtml(proj.auditor)}</td></tr>
      <tr><td style="font-weight:700">Phạm vi</td><td>${escHtml(proj.scope) || '—'}</td></tr>
    </table>
    <div class="h">Thống kê</div>
    <table>
      <tr><th>Mức độ</th><th>Số lượng</th></tr>
      ${['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(s => `
        <tr><td>${SEV_VN[s]}</td><td>${counts[s]}</td></tr>
      `).join('')}
    </table>
    ${vulns.map((v, i) => `
      <div class="vuln">
        <div class="h">${i + 1}. ${escHtml(v.name)}</div>
        <table>
          <tr><td style="width:26%;font-weight:700">Mức độ</td><td>${SEV_VN[v.severity] || v.severity}</td></tr>
          <tr><td style="font-weight:700">Vị trí</td><td>${escHtml(v.location)}</td></tr>
        </table>
        <div class="h">Cách khai thác</div>
        <div class="block">${escHtml(v.exploit) || '—'}</div>
        <div class="h">Khuyến nghị</div>
        <div class="block">${escHtml(v.recommend) || '—'}</div>
        <div class="h">Tham chiếu</div>
        <div class="block">${escHtml(v.refs) || '—'}</div>
      </div>
    `).join('')}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  <\/script>
</body>
</html>`;
}

function genPdf() {
  const vulns = window.vulns;
  const getProj = window.getProj;
  const fmtDate = window.fmtDate;
  const toast = window.toast;
  const SEV_VN = window.SEV_VN;

  if (!vulns || vulns.length === 0) {
    toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er');
    return;
  }

  const proj = getProj();
  const projWithDate = { ...proj, date: fmtDate(proj.date) };
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });

  const html = getPdfHtml(projWithDate, vulns, counts, SEV_VN);
  const w = window.open('', '_blank');
  if (!w) {
    toast('Cho phép popup để in / lưu PDF.', 'er');
    return;
  }
  w.document.write(html);
  w.document.close();
  toast('Chọn "Lưu dưới dạng PDF" trong hộp thoại in.', 'ok');
}

window.genPdf = genPdf;
