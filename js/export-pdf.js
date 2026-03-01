async function genPdf() {
  const vulns = window.vulns;
  const getProj = window.getProj;
  const fmtDate = window.fmtDate;
  const toast = window.toast;
  const SEV_ORDER = window.SEV_ORDER;
  const SEV_VN = window.SEV_VN;

  if (!vulns || vulns.length === 0) { toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er'); return; }
  toast('Đang tạo file PDF...', 'in');
  try {
    const { jsPDF } = window.jspdf;
    const proj = getProj();
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', hotfixes: ['px_scaling'] });
    const W = 595, H = 842, ML = 52, MR = 52, CW = W - ML - MR;
    const lineHeight = 14;
    const C = {
      bg: [7, 11, 22], bg2: [12, 16, 32], bg3: [17, 24, 39], card: [20, 27, 48],
      border: [30, 45, 80], accent: [0, 229, 255], accent2: [124, 58, 237],
      green: [0, 255, 136], text: [221, 232, 255], textd: [106, 123, 168],
      crit: [255, 51, 102], high: [255, 107, 53], med: [251, 191, 36], low: [56, 189, 248], inf: [107, 114, 128],
    };
    const SEVC = { CRITICAL: C.crit, HIGH: C.high, MEDIUM: C.med, LOW: C.low, INFO: C.inf };
    const SEVBG = { CRITICAL: [45, 0, 16], HIGH: [45, 18, 0], MEDIUM: [45, 32, 0], LOW: [0, 26, 45], INFO: [21, 21, 21] };
    const fontName = doc.getFontList().times ? 'times' : 'helvetica';

    function setFont(size, bold, color) {
      doc.setFontSize(size);
      doc.setFont(fontName, bold ? 'bold' : 'normal');
      doc.setTextColor(...(color || C.text));
    }
    function fillRect(x, y, w, h, color) { doc.setFillColor(...color); doc.rect(x, y, w, h, 'F'); }

    let pageNum = 1;
    function addFooter() {
      fillRect(0, H - 28, W, 28, C.bg2);
      doc.setDrawColor(...C.border); doc.setLineWidth(0.5); doc.line(0, H - 28, W, H - 28);
      setFont(7, false, C.textd);
      doc.text(proj.name, ML, H - 10);
      doc.text(`Trang ${pageNum}`, W / 2, H - 10, { align: 'center' });
      doc.text(`${proj.leaderName} | ${proj.leaderMSSV} | ${proj.leaderClass}`, W - ML, H - 10, { align: 'right' });
      pageNum++;
    }
    function newPage() { addFooter(); doc.addPage(); }

    fillRect(0, 0, W, H, C.bg);
    if (doc.GState) {
      doc.setGState(doc.GState({ opacity: 0.04 }));
      for (let i = 0; i < W; i += 40) doc.line(i, 0, i, H);
      for (let j = 0; j < H; j += 40) doc.line(0, j, W, j);
      doc.setGState(doc.GState({ opacity: 1 }));
    }

    doc.setFillColor(...C.accent2); doc.rect(0, 0, W, 4, 'F');
    doc.setFillColor(...C.accent); doc.rect(W / 2, 0, W / 2, 4, 'F');

    fillRect(ML, 60, 120, 20, [20, 30, 60]);
    doc.setDrawColor(0, 229, 255); doc.setLineWidth(0.5); doc.rect(ML, 60, 120, 20, 'S');
    setFont(7, true, C.accent); doc.text('SECURITY REPORT', ML + 10, 72.5);

    setFont(26, true, C.text); doc.text('BÁO CÁO KIỂM THỬ', ML, 132);
    setFont(26, true, C.accent); doc.text('BẢO MẬT', ML, 162);
    setFont(11, false, [124, 58, 237]); doc.text('SECURITY ASSESSMENT REPORT', ML, 184);

    doc.setDrawColor(...C.border); doc.setLineWidth(1); doc.line(ML, 200, W - MR, 200);

    const infoY = 228;
    const rowH = 28;
    const labelW = 200;
    const rows = [
      ['Dự án / Project', proj.name],
      ['Mục tiêu / Target', proj.target],
      ['Đơn vị kiểm thử', proj.org],
      ['Kiểm thử viên', proj.auditor],
      ['Ngày kiểm thử', fmtDate(proj.date)],
      ['Phiên bản', proj.ver],
      ['Trưởng nhóm', proj.leaderName],
      ['MSSV trưởng nhóm', proj.leaderMSSV],
      ['Lớp', proj.leaderClass],
    ];
    let ry = infoY;
    rows.forEach(([l, v], i) => {
      fillRect(ML, ry, labelW, rowH, i % 2 === 0 ? [18, 26, 48] : [14, 20, 38]);
      fillRect(ML + labelW, ry, CW - labelW, rowH, i % 2 === 0 ? [12, 16, 32] : [10, 14, 28]);
      doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.rect(ML, ry, CW, rowH, 'S');
      setFont(9, true, C.accent); doc.text(l, ML + 10, ry + rowH / 2 + 3);
      const valLines = doc.splitTextToSize(String(v || '—'), CW - labelW - 20);
      doc.setFont(fontName, 'normal'); doc.setFontSize(9); doc.setTextColor(...C.text);
      doc.text(valLines[0] || '—', ML + labelW + 10, ry + rowH / 2 + 3);
      ry += rowH;
    });

    const sumY = ry + 24;
    setFont(10, true, C.text); doc.text('Tóm Tắt Lỗ Hổng', ML, sumY);
    let sx = ML, sy = sumY + 10;
    const sevFiltered = SEV_ORDER.filter(s => counts[s] > 0);
    const colW = sevFiltered.length ? CW / sevFiltered.length : CW;
    sevFiltered.forEach(s => {
      fillRect(sx, sy, colW - 4, 50, SEVBG[s]);
      doc.setDrawColor(...SEVC[s]); doc.setLineWidth(0.5); doc.rect(sx, sy, colW - 4, 50, 'S');
      setFont(18, true, SEVC[s]); doc.text(String(counts[s]), sx + (colW - 4) / 2, sy + 28, { align: 'center' });
      setFont(7, true, SEVC[s]); doc.text(SEV_VN[s].toUpperCase(), sx + (colW - 4) / 2, sy + 42, { align: 'center' });
      sx += colW;
    });

    fillRect(ML, H - 120, CW, 36, [45, 0, 20]);
    doc.setDrawColor(...C.crit); doc.setLineWidth(0.7); doc.rect(ML, H - 120, CW, 36, 'S');
    setFont(9, true, C.crit); doc.text('⚠ TÀI LIỆU BẢO MẬT — KHÔNG PHÂN PHỐI', W / 2, H - 98, { align: 'center' });

    addFooter();

    doc.addPage();
    fillRect(0, 0, W, H, C.bg);

    let y = 56;
    fillRect(ML, y, 4, 26, C.accent);
    setFont(15, true, C.text); doc.text('2. DANH SÁCH LỖ HỔNG', ML + 14, y + 18);
    y += 48;

    const ovCols = [{ h: '#', w: 32 }, { h: 'Tên lỗi', w: 200 }, { h: 'Vị trí', w: 170 }, { h: 'Mức độ', w: 78 }, { h: 'CVSS', w: CW - 32 - 200 - 170 - 78 }];
    const cellH = 24;
    let hx = ML;
    ovCols.forEach(col => {
      fillRect(hx, y, col.w, cellH, C.card);
      setFont(9, true, C.accent); doc.text(col.h, hx + 6, y + cellH / 2 + 3);
      doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.rect(hx, y, col.w, cellH, 'S');
      hx += col.w;
    });
    y += cellH;

    vulns.forEach((v, i) => {
      if (y > H - 90) { newPage(); fillRect(0, 0, W, H, C.bg); y = 56; }
      const bg = i % 2 === 0 ? C.bg2 : [14, 18, 30];
      fillRect(ML, y, CW, cellH, bg);
      let cx = ML;
      const cells = [String(i + 1), v.name || '—', v.location || '—', SEV_VN[v.severity], { CRITICAL: '9.0–10', HIGH: '7.0–8.9', MEDIUM: '4.0–6.9', LOW: '1.0–3.9', INFO: 'N/A' }[v.severity]];
      cells.forEach((cell, ci) => {
        const col = ovCols[ci];
        if (ci === 3) {
          fillRect(cx + 2, y + 2, col.w - 4, cellH - 4, SEVBG[v.severity]);
          setFont(8, true, SEVC[v.severity]); doc.text(String(cell), cx + col.w / 2, y + cellH / 2 + 3, { align: 'center' });
        } else {
          setFont(9, ci === 0, ci === 0 ? C.textd : C.text);
          doc.text(doc.splitTextToSize(String(cell), col.w - 10)[0], cx + 6, y + cellH / 2 + 3);
        }
        doc.setDrawColor(...C.border); doc.setLineWidth(0.25); doc.rect(cx, y, col.w, cellH, 'S');
        cx += col.w;
      });
      y += cellH;
    });

    vulns.forEach((v, i) => {
      newPage();
      fillRect(0, 0, W, H, C.bg);
      let dy = 60;

      fillRect(ML, dy, CW, 52, [12, 18, 36]);
      doc.setDrawColor(...SEVC[v.severity]); doc.setLineWidth(1); doc.rect(ML, dy, CW, 52, 'S');
      fillRect(ML, dy, 3, 52, SEVC[v.severity]);
      setFont(7, true, C.textd); doc.text(`FINDING #${i + 1}`, ML + 12, dy + 14);
      setFont(12, true, C.text); doc.text(v.name || 'Lỗ hổng ' + (i + 1), ML + 12, dy + 32);
      const bw = 80;
      fillRect(W - MR - bw, dy + 10, bw, 32, SEVBG[v.severity]);
      doc.setDrawColor(...SEVC[v.severity]); doc.setLineWidth(0.5); doc.rect(W - MR - bw, dy + 10, bw, 32, 'S');
      setFont(8, true, SEVC[v.severity]); doc.text(SEV_VN[v.severity].toUpperCase(), (W - MR - bw) + bw / 2, dy + 29, { align: 'center' });
      dy += 68;

      function infoBlock(label, value, x, yw, bWidth) {
        fillRect(x, yw, bWidth, 20, [18, 26, 48]);
        setFont(7, true, C.accent); doc.text(label, x + 6, yw + 13.5);
        doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.rect(x, yw, bWidth, 20, 'S');
        fillRect(x, yw + 20, bWidth, 18, C.bg2);
        setFont(8, false, C.text);
        const line = doc.splitTextToSize(value || '—', bWidth - 12)[0];
        doc.text(line, x + 6, yw + 32.5);
        doc.setDrawColor(...C.border); doc.rect(x, yw + 20, bWidth, 18, 'S');
      }
      infoBlock('VỊ TRÍ LỖI', v.location, ML, dy, CW / 2 - 4);
      infoBlock('CVSS SCORE', { CRITICAL: '9.0 – 10.0', HIGH: '7.0 – 8.9', MEDIUM: '4.0 – 6.9', LOW: '1.0 – 3.9', INFO: 'N/A' }[v.severity], ML + CW / 2 + 4, dy, CW / 2 - 4);
      dy += 52;

      function section(title, content, accentClr) {
        dy += 18;
        if (dy > H - 120) { newPage(); fillRect(0, 0, W, H, C.bg); dy = 56; }
        fillRect(ML, dy, 4, 18, accentClr);
        setFont(11, true, C.text); doc.text(title, ML + 12, dy + 13);
        dy += 28;
        fillRect(ML, dy, CW, 1, C.border);
        dy += 12;
        if (!content || String(content).trim() === '' || content === '—') {
          setFont(10, false, C.textd); doc.text('Không có thông tin', ML + 10, dy + 12);
          dy += 28;
          return;
        }
        const lines = doc.splitTextToSize(String(content).trim(), CW - 24);
        const blockH = Math.min(lines.length * lineHeight + 20, H - dy - 80);
        if (dy + blockH > H - 90) { newPage(); fillRect(0, 0, W, H, C.bg); dy = 56; }
        fillRect(ML, dy, CW, blockH, C.bg2);
        doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.rect(ML, dy, CW, blockH, 'S');
        fillRect(ML, dy, 3, blockH, accentClr);
        setFont(10, false, C.text);
        let lineY = dy + 14;
        lines.forEach(ln => { doc.text(ln, ML + 14, lineY); lineY += lineHeight; });
        dy += Math.max(blockH, lines.length * lineHeight + 20);
      }
      section('CÁCH KHAI THÁC', v.exploit, C.crit);
      section('KHUYẾN NGHỊ', v.recommend, C.green);
      section('THAM CHIẾU', v.refs, C.accent2);
    });

    addFooter();

    doc.save(`Security_Report_${proj.name.replace(/\s+/g, '_')}_${proj.date || 'report'}.pdf`);
    toast('Đã xuất file PDF thành công!', 'ok');
  } catch (e) {
    console.error(e);
    toast('Lỗi tạo PDF: ' + e.message, 'er');
  }
}

window.genPdf = genPdf;
