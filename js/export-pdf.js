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

async function genPdf() {
  const vulns = window.vulns;
  const getProj = window.getProj;
  const fmtDate = window.fmtDate;
  const toast = window.toast;
  const SEV_VN = window.SEV_VN;

  if (!vulns || vulns.length === 0) {
    toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er');
    return;
  }

  toast('Đang tạo file PDF...', 'in');

  const proj = getProj();
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });

  const font = "'Be Vietnam Pro', sans-serif";

  const style = `
    #pdf-content {
      width: 210mm; padding: 15mm; box-sizing: border-box;
      font-family: ${font}; font-size: 11pt; color: #111; background: #fff;
    }
    table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 10pt; }
    th, td { border: 1px solid #333; padding: 4pt 6pt; text-align: left; }
    th { background: #eee; font-family: ${font}; }
    .tit { font-size: 17pt; font-weight: 700; text-align: center; margin: 0 0 4pt; font-family: ${font}; }
    .sub { font-size: 11pt; text-align: center; margin: 0 0 10pt; color: #444; font-family: ${font}; }
    .h { font-size: 11pt; font-weight: 700; margin: 8pt 0 3pt; font-family: ${font}; }
    .block { margin: 2pt 0 8pt; padding: 5pt; background: #f5f5f5; border-left: 3px solid #333; white-space: pre-wrap; font-family: ${font}; }
    .vuln { page-break-inside: avoid; margin-bottom: 10pt; }
  `;

  const html = `
    <style>${style}</style>
    <div id="pdf-content">
      <div class="tit">BÁO CÁO KIỂM THỬ BẢO MẬT</div>
      <div class="sub">${escHtml(proj.name)} — ${escHtml(fmtDate(proj.date))}</div>
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
  `;

  try {
    await document.fonts.ready;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:794px;max-width:100vw;z-index:99999;background:#fff;box-shadow:0 0 0 9999px rgba(0,0,0,0.3);';
    container.innerHTML = html;
    document.body.appendChild(container);

    await new Promise(r => setTimeout(r, 400));

    const target = container.querySelector('#pdf-content');
    if (!target) throw new Error('Không tìm thấy nội dung PDF');

    const filename = `Bao_cao_bao_mat_${safeFilename(proj.name, proj.date)}.pdf`;

    await html2pdf().set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    }).from(target).save();

    document.body.removeChild(container);
    toast('Xuất PDF thành công!', 'ok');
  } catch (err) {
    console.error(err);
    toast('Lỗi khi tạo PDF!', 'er');
  }
}

window.genPdf = genPdf;
