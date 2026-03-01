function safeFilename(name, dateStr) {
  const base = (name || 'Bao_cao')
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*]/g, '');
  const d = (dateStr || '')
    .replace(/\//g, '-')
    .replace(/[^\d\-]/g, '');
  return d ? `${base}_${d}` : base;
}

function plainText(s) {
  if (s == null || s === undefined) return '';
  return String(s).trim() || '—';
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

  toast('Đang tạo file PDF...', 'in');

  const proj = getProj();
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });

  const MARGIN = 20;
  const PAGE_W = 210;
  const PAGE_H = 297;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const LINE_H = 5.5;

  const doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = MARGIN;

  function nextLine(h) {
    y += h ?? LINE_H;
    if (y > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function putTitle(text, size) {
    doc.setFontSize(size || 16);
    doc.setFont('helvetica', 'bold');
    doc.text(text, PAGE_W / 2, y, { align: 'center' });
    nextLine(8);
  }

  function putLine(label, value) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(plainText(value), CONTENT_W - 45);
    doc.text(lines, MARGIN + 42, y);
    nextLine(lines.length * LINE_H);
  }

  function putHeading(text) {
    nextLine(3);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text, MARGIN, y);
    nextLine(6);
  }

  function putBlock(text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(plainText(text), CONTENT_W);
    doc.text(lines, MARGIN, y);
    nextLine(lines.length * LINE_H + 2);
  }

  try {
    putTitle('BÁO CÁO KIỂM THỬ BẢO MẬT', 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(plainText(proj.name) + ' — ' + plainText(fmtDate(proj.date)), PAGE_W / 2, y, { align: 'center' });
    nextLine(10);

    putLine('Dự án', proj.name);
    putLine('Mục tiêu', proj.target);
    putLine('Đơn vị kiểm thử', proj.org);
    putLine('Kiểm thử viên', proj.auditor);
    putLine('Ngày kiểm thử', fmtDate(proj.date));
    putLine('Phạm vi', proj.scope);
    nextLine(3);

    putHeading('Thống kê lỗ hổng');
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].forEach(s => {
      doc.setFont('helvetica', 'normal');
      doc.text(SEV_VN[s] + ': ' + counts[s], MARGIN, y);
      nextLine();
    });
    nextLine(5);

    vulns.forEach((v, i) => {
      putHeading((i + 1) + '. ' + plainText(v.name));
      putLine('Mức độ', SEV_VN[v.severity] || v.severity);
      putLine('Vị trí', v.location);
      putHeading('Cách khai thác');
      putBlock(v.exploit);
      putHeading('Khuyến nghị');
      putBlock(v.recommend);
      putHeading('Tham chiếu');
      putBlock(v.refs);
      nextLine(5);
    });

    const filename = `Bao_cao_bao_mat_${safeFilename(proj.name, proj.date)}.pdf`;
    doc.save(filename);
    toast('Xuất PDF thành công!', 'ok');
  } catch (err) {
    console.error(err);
    toast('Lỗi khi tạo PDF!', 'er');
  }
}

window.genPdf = genPdf;
