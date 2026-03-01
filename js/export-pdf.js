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
  const SEV_ORDER = window.SEV_ORDER;
  const SEV_VN = window.SEV_VN;

  if (!vulns || vulns.length === 0) {
    toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er');
    return;
  }

  toast('Đang tạo file PDF...', 'in');

  const proj = getProj();
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };

  vulns.forEach(v => {
    counts[v.severity] = (counts[v.severity] || 0) + 1;
  });

  const fontFamily = "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif";

  const style = `
    * { box-sizing: border-box; }

    #pdf-content {
      width: 210mm;
      min-width: 794px;
      font-family: ${fontFamily};
      font-size: 11pt;
      color: #dde8ff;
      background: #0a0f1a;
    }

    .pdf-wrap {
      width: 210mm;
      padding: 20mm;
      background: #0a0f1a;
      page-break-after: always;
    }

    .pdf-wrap:last-child {
      page-break-after: auto;
    }

    .pdf-title {
      font-size: 26pt;
      font-weight: 700;
      color: #00e5ff;
      text-align: center;
      margin-bottom: 8pt;
    }

    .pdf-sub {
      font-size: 13pt;
      color: #7c3aed;
      text-align: center;
      margin-bottom: 16pt;
    }

    .pdf-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
      table-layout: fixed;
    }

    .pdf-table th,
    .pdf-table td {
      border: 1px solid #2a3f70;
      padding: 6pt 8pt;
      word-break: break-word;
    }

    .pdf-table th {
      background: #1a2240;
      color: #00e5ff;
    }

    .pdf-label {
      width: 32%;
      font-weight: bold;
      color: #00e5ff;
      background: #121830;
    }

    .pdf-h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 18pt 0 8pt;
    }

    .pdf-h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 14pt 0 6pt;
      color: #00e5ff;
    }

    .pdf-h3 {
      font-size: 11pt;
      font-weight: bold;
      margin: 10pt 0 4pt;
      color: #7c3aed;
    }

    .pdf-block {
      background: #0c1020;
      border-left: 4px solid #00e5ff;
      padding: 10pt;
      margin: 8pt 0;
      white-space: pre-wrap;
    }

    .crit { border-left-color: #ff3366; }
    .rec  { border-left-color: #00ff88; }
    .ref  { border-left-color: #7c3aed; }

    .sev-c { color: #ff3366; font-weight: bold; }
    .sev-h { color: #ff6b35; font-weight: bold; }
    .sev-m { color: #fbbf24; font-weight: bold; }
    .sev-l { color: #38bdf8; font-weight: bold; }
    .sev-i { color: #6b7280; font-weight: bold; }

    .pdf-page-break {
      page-break-before: always;
    }
  `;

  const html = `
    <style>${style}</style>
    <div id="pdf-content">

      <div class="pdf-wrap">
        <div class="pdf-title">BÁO CÁO KIỂM THỬ BẢO MẬT</div>
        <div class="pdf-sub">SECURITY ASSESSMENT REPORT</div>

        <table class="pdf-table">
          <tr><td class="pdf-label">Dự án</td><td>${escHtml(proj.name)}</td></tr>
          <tr><td class="pdf-label">Mục tiêu</td><td>${escHtml(proj.target)}</td></tr>
          <tr><td class="pdf-label">Đơn vị kiểm thử</td><td>${escHtml(proj.org)}</td></tr>
          <tr><td class="pdf-label">Kiểm thử viên</td><td>${escHtml(proj.auditor)}</td></tr>
          <tr><td class="pdf-label">Ngày kiểm thử</td><td>${escHtml(fmtDate(proj.date))}</td></tr>
          <tr><td class="pdf-label">Phiên bản</td><td>${escHtml(proj.ver)}</td></tr>
        </table>
      </div>

      <div class="pdf-wrap">
        <div class="pdf-h1">1. Tổng quan</div>

        <div class="pdf-h3">Phạm vi kiểm thử</div>
        <div class="pdf-block">${escHtml(proj.scope) || '—'}</div>

        <div class="pdf-h3">Thống kê lỗ hổng</div>

        <table class="pdf-table">
          <tr><th>Mức độ</th><th>Số lượng</th><th>Tỷ lệ</th></tr>
          ${SEV_ORDER.map(s => `
            <tr>
              <td class="sev-${s.toLowerCase().charAt(0)}">${SEV_VN[s]}</td>
              <td>${counts[s]}</td>
              <td>${((counts[s] / vulns.length) * 100 || 0).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>

      ${vulns.map((v, i) => `
        <div class="pdf-wrap">
          <div class="pdf-h2">Finding #${i + 1}: ${escHtml(v.name)}</div>

          <table class="pdf-table">
            <tr><td class="pdf-label">Mức độ</td>
                <td class="sev-${(v.severity || 'INFO').toLowerCase().charAt(0)}">
                  ${SEV_VN[v.severity] || v.severity}
                </td></tr>
            <tr><td class="pdf-label">Vị trí</td><td>${escHtml(v.location)}</td></tr>
          </table>

          <div class="pdf-h3">Cách khai thác</div>
          <div class="pdf-block crit">${escHtml(v.exploit) || 'Không có thông tin'}</div>

          <div class="pdf-h3">Khuyến nghị</div>
          <div class="pdf-block rec">${escHtml(v.recommend) || 'Không có thông tin'}</div>

          <div class="pdf-h3">Tham chiếu</div>
          <div class="pdf-block ref">${escHtml(v.refs) || 'Không có thông tin'}</div>
        </div>
      `).join('')}

    </div>
  `;

  try {
    await document.fonts.ready;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:794px;max-width:100vw;z-index:9999;opacity:0.001;pointer-events:none;';
    container.innerHTML = html;
    document.body.appendChild(container);

    await new Promise(r => setTimeout(r, 300));

    const target = container.querySelector('#pdf-content');
    if (!target) throw new Error('Không tìm thấy nội dung PDF');

    const filename = `Bao_cao_bao_mat_${safeFilename(proj.name, proj.date)}.pdf`;

    await html2pdf().set({
      margin: 0,
      filename,
      image: { type: 'png', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0f1a',
        allowTaint: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(target).save();

    document.body.removeChild(container);
    toast('Xuất PDF thành công!', 'ok');

  } catch (err) {
    console.error(err);
    toast('Lỗi khi tạo PDF!', 'er');
  }
}

window.genPdf = genPdf;