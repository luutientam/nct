function escHtml(s) {
  if (s == null || s === undefined) return '';
  const t = String(s);
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function safeFilename(name, dateStr) {
  const base = (name || 'Bao_cao').replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
  const d = (dateStr || '').replace(/\//g, '-').replace(/[^\d\-]/g, '');
  return d ? `${base}_${d}` : base;
}

async function genPdf() {
  const vulns = window.vulns;
  const getProj = window.getProj;
  const fmtDate = window.fmtDate;
  const toast = window.toast;
  const SEV_ORDER = window.SEV_ORDER;
  const SEV_VN = window.SEV_VN;

  if (!vulns || vulns.length === 0) { toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er'); return; }
  toast('Đang tạo file PDF...', 'in');
  const proj = getProj();
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });

  const fontFamily = "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif";
  const A4_W = 794;
  const A4_H = 1123;
  const PAD = 76;
  const style = `
    * { box-sizing: border-box; }
    #pdf-content { width: ${A4_W}px; font-family: ${fontFamily}; font-size: 11pt; color: #dde8ff; background: #0a0f1a !important; }
    .pdf-wrap { width: ${A4_W}px; min-height: ${A4_H}px; padding: ${PAD}px; background: #0a0f1a !important; page-break-after: always; overflow: hidden; }
    .pdf-wrap:last-child { page-break-after: auto; }
    .pdf-title { font-size: 26pt; font-weight: 700; color: #00e5ff; text-align: center; margin: 20pt 0 6pt; }
    .pdf-sub { font-size: 13pt; color: #7c3aed; text-align: center; margin-bottom: 16pt; }
    .pdf-hr { border: none; border-top: 2px solid #2a3f70; margin: 12pt 0; }
    .pdf-table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10pt; table-layout: fixed; }
    .pdf-table th, .pdf-table td { border: 1px solid #2a3f70; padding: 6pt 8pt; text-align: left; word-wrap: break-word; overflow-wrap: break-word; }
    .pdf-table th { background: #1a2240; color: #00e5ff; font-weight: 700; }
    .pdf-table tr:nth-child(even) td { background: #0c1020; }
    .pdf-table tr:nth-child(odd) td { background: #111827; }
    .pdf-label { width: 32%; background: #121830 !important; color: #00e5ff; font-weight: 700; }
    .pdf-h1 { font-size: 16pt; font-weight: 700; color: #fff; margin: 20pt 0 10pt; page-break-after: avoid; }
    .pdf-h2 { font-size: 14pt; font-weight: 700; color: #00e5ff; margin: 16pt 0 8pt; page-break-after: avoid; }
    .pdf-h3 { font-size: 11pt; font-weight: 700; color: #7c3aed; margin: 12pt 0 6pt; page-break-after: avoid; }
    .pdf-block { background: #0c1020; border: 1px solid #1e2d50; border-left: 4px solid #00e5ff; padding: 10pt; margin: 8pt 0; line-height: 1.55; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
    .pdf-block.crit { border-left-color: #ff3366; }
    .pdf-block.rec { border-left-color: #00ff88; }
    .pdf-block.ref { border-left-color: #7c3aed; }
    .sev-c { color: #ff3366; font-weight: 700; }
    .sev-h { color: #ff6b35; font-weight: 700; }
    .sev-m { color: #fbbf24; font-weight: 700; }
    .sev-l { color: #38bdf8; font-weight: 700; }
    .sev-i { color: #6b7280; font-weight: 700; }
    .pdf-badge { display: inline-block; padding: 2pt 8pt; border-radius: 4pt; font-size: 9pt; font-weight: 700; }
    .pdf-cover-table .pdf-label { width: 28%; }
    .pdf-warn { text-align: center; color: #ff3366; font-weight: 700; margin: 16pt 0; font-size: 11pt; }
    .pdf-footer { margin-top: 20pt; padding-top: 10pt; border-top: 1px solid #2a3f70; font-size: 9pt; color: #6a7ba8; }
    .pdf-page-break { page-break-before: always; }
  `;

  const html = `
    <style>${style}</style>
    <div id="pdf-content" style="background:#0a0f1a;color:#dde8ff;width:${A4_W}px;font-family:${fontFamily};">
    <div class="pdf-wrap">
      <div class="pdf-title">BÁO CÁO KIỂM THỬ BẢO MẬT</div>
      <div class="pdf-sub">SECURITY ASSESSMENT REPORT</div>
      <hr class="pdf-hr">
      <table class="pdf-table pdf-cover-table">
        <tr><td class="pdf-label">Dự án</td><td>${escHtml(proj.name)}</td></tr>
        <tr><td class="pdf-label">Mục tiêu</td><td>${escHtml(proj.target)}</td></tr>
        <tr><td class="pdf-label">Đơn vị kiểm thử</td><td>${escHtml(proj.org)}</td></tr>
        <tr><td class="pdf-label">Kiểm thử viên</td><td>${escHtml(proj.auditor)}</td></tr>
        <tr><td class="pdf-label">Ngày kiểm thử</td><td>${escHtml(fmtDate(proj.date))}</td></tr>
        <tr><td class="pdf-label">Phiên bản</td><td>${escHtml(proj.ver)}</td></tr>
        <tr><td class="pdf-label">Trưởng nhóm</td><td>${escHtml(proj.leaderName)}</td></tr>
        <tr><td class="pdf-label">MSSV trưởng nhóm</td><td>${escHtml(proj.leaderMSSV)}</td></tr>
        <tr><td class="pdf-label">Lớp</td><td>${escHtml(proj.leaderClass)}</td></tr>
      </table>
      <div style="display:flex;gap:8pt;flex-wrap:wrap;margin:16pt 0;">
        ${SEV_ORDER.filter(s => counts[s] > 0).map(s => `
          <span class="pdf-badge sev-${s.toLowerCase().charAt(0)}" style="background:rgba(0,0,0,.2);padding:6pt 12pt;">
            ${SEV_VN[s]}: ${counts[s]}
          </span>
        `).join('')}
      </div>
      <div class="pdf-warn">⚠ TÀI LIỆU BẢO MẬT — KHÔNG PHÂN PHỐI</div>
    </div>
    <div class="pdf-wrap pdf-page-break">
      <div class="pdf-h1">1. TỔNG QUAN</div>
      <p style="line-height:1.7;color:#dde8ff;">Báo cáo này ghi nhận kết quả kiểm thử bảo mật ${escHtml(proj.name)}, thực hiện bởi ${escHtml(proj.auditor)} (${escHtml(proj.org)}) ngày ${escHtml(fmtDate(proj.date))}. Trưởng nhóm: ${escHtml(proj.leaderName)} — MSSV: ${escHtml(proj.leaderMSSV)} — Lớp: ${escHtml(proj.leaderClass)}.</p>
      <div class="pdf-h3">Phạm vi kiểm thử</div>
      <div class="pdf-block">${escHtml(proj.scope) || '—'}</div>
      <div class="pdf-h3">Thống kê lỗ hổng</div>
      <table class="pdf-table">
        <tr><th>Mức độ</th><th>Số lượng</th><th>Tỷ lệ</th></tr>
        ${SEV_ORDER.filter(s => counts[s] > 0).map(s => `
          <tr><td class="sev-${s.toLowerCase().charAt(0)}">${SEV_VN[s]}</td><td>${counts[s]}</td><td>${((counts[s] / vulns.length) * 100).toFixed(1)}%</td></tr>
        `).join('')}
        <tr><td><strong>TỔNG CỘNG</strong></td><td><strong>${vulns.length}</strong></td><td>100%</td></tr>
      </table>
    </div>
    <div class="pdf-wrap pdf-page-break">
      <div class="pdf-h1">2. DANH SÁCH LỖ HỔNG</div>
      <table class="pdf-table">
        <tr><th>#</th><th>Tên lỗi</th><th>Vị trí</th><th>Mức độ</th><th>CVSS</th></tr>
        ${vulns.map((v, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escHtml(v.name) || '—'}</td>
            <td>${escHtml(v.location) || '—'}</td>
            <td class="sev-${(v.severity || 'INFO').toLowerCase().charAt(0)}">${SEV_VN[v.severity] || v.severity}</td>
            <td>${{ CRITICAL: '9.0–10.0', HIGH: '7.0–8.9', MEDIUM: '4.0–6.9', LOW: '1.0–3.9', INFO: 'N/A' }[v.severity] || 'N/A'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ${vulns.map((v, i) => `
    <div class="pdf-wrap pdf-page-break">
      <div class="pdf-h2">Finding #${i + 1}: ${escHtml(v.name) || 'Lỗ hổng ' + (i + 1)}</div>
      <table class="pdf-table">
        <tr><td class="pdf-label">Mức độ</td><td class="sev-${(v.severity || 'INFO').toLowerCase().charAt(0)}">${SEV_VN[v.severity] || v.severity}</td></tr>
        <tr><td class="pdf-label">Vị trí lỗi</td><td>${escHtml(v.location) || '—'}</td></tr>
        <tr><td class="pdf-label">CVSS</td><td>${{ CRITICAL: '9.0 – 10.0', HIGH: '7.0 – 8.9', MEDIUM: '4.0 – 6.9', LOW: '1.0 – 3.9', INFO: 'N/A' }[v.severity] || 'N/A'}</td></tr>
      </table>
      <div class="pdf-h3">Cách khai thác</div>
      <div class="pdf-block crit">${escHtml(v.exploit) || 'Không có thông tin'}</div>
      <div class="pdf-h3">Khuyến nghị</div>
      <div class="pdf-block rec">${escHtml(v.recommend) || 'Không có thông tin'}</div>
      <div class="pdf-h3">Tham chiếu</div>
      <div class="pdf-block ref">${escHtml(v.refs) || 'Không có thông tin'}</div>
      <div class="pdf-footer">${escHtml(proj.name)} — ${escHtml(proj.leaderName)} | ${escHtml(proj.leaderMSSV)} | ${escHtml(proj.leaderClass)}</div>
    </div>
    `).join('')}
    </div>
  `;

  try {
    const container = document.createElement('div');
    container.id = 'pdf-export-container';
    container.style.cssText = `position:fixed;left:50%;top:0;transform:translateX(-50%);width:${A4_W}px;z-index:10000;background:#0a0f1a;color:#dde8ff;max-height:100vh;overflow:auto;box-shadow:0 0 0 100vmax rgba(0,0,0,.85);`;
    container.innerHTML = html;
    document.body.appendChild(container);
    const contentEl = container.querySelector('#pdf-content');
    const filename = `Bao_cao_bao_mat_${safeFilename(proj.name, proj.date)}.pdf`;
    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: A4_W,
        onclone: function (clonedDoc, el) {
          const target = el || (clonedDoc && clonedDoc.body);
          if (!target) return;
          const root = target.querySelector ? target.querySelector('#pdf-content') : null;
          if (root) {
            root.style.backgroundColor = '#0a0f1a';
            root.style.width = A4_W + 'px';
          }
          const wraps = target.querySelectorAll ? target.querySelectorAll('.pdf-wrap') : [];
          for (let i = 0; i < wraps.length; i++) wraps[i].style.backgroundColor = '#0a0f1a';
        },
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait', hotfixes: ['px_scaling'] },
      pagebreak: { mode: 'css', before: '.pdf-page-break' },
    };
    await html2pdf().set(opt).from(contentEl || container).save();
    document.body.removeChild(container);
    toast('Đã xuất file PDF thành công!', 'ok');
  } catch (e) {
    console.error(e);
    const c = document.getElementById('pdf-export-container');
    if (c) c.remove();
    toast('Lỗi tạo PDF: ' + (e.message || e), 'er');
  }
}

window.genPdf = genPdf;
