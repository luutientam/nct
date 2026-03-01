async function genDocx() {
  const vulns = window.vulns;
  const getProj = window.getProj;
  const fmtDate = window.fmtDate;
  const toast = window.toast;
  const SEV_ORDER = window.SEV_ORDER;
  const SEV_VN = window.SEV_VN;
  const SEV_DOCX_COLOR = window.SEV_DOCX_COLOR;
  const SEV_DOCX_BG = window.SEV_DOCX_BG;

  if (!vulns || vulns.length === 0) { toast('Vui lòng thêm ít nhất một lỗ hổng!', 'er'); return; }
  toast('Đang tạo file DOCX...', 'in');
  try {
    const docxLib = window.docx;
    if (!docxLib) { toast('Thư viện DOCX chưa tải xong. Vui lòng tải lại trang.', 'er'); return; }
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
      PageBreak
    } = docxLib;

    const proj = getProj();
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });

    const def = { style: BorderStyle.SINGLE, size: 1, color: '2A3F70' };
    const brd = { top: def, bottom: def, left: def, right: def };
    const defClr = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

    const FONT = 'Times New Roman';
    function hdrCell(txt, w) {
      return new TableCell({
        borders: brd, width: { size: w, type: WidthType.DXA },
        shading: { fill: '1A2240', type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: txt, bold: true, color: '00E5FF', size: 22, font: FONT })] })]
      });
    }
    function dataCell(txt, w, clr) {
      return new TableCell({
        borders: brd, width: { size: w, type: WidthType.DXA },
        shading: { fill: '0C1020', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: String(txt || '—').trim(), size: 21, color: clr || 'DDEEFF', font: FONT })], spacing: { line: 360 } })]
      });
    }
    function infoRow(label, val) {
      return new TableRow({
        children: [
          new TableCell({ borders: brd, width: { size: 3000, type: WidthType.DXA }, shading: { fill: '121830', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 21, color: '00E5FF', font: FONT })] })] }),
          new TableCell({ borders: brd, width: { size: 6360, type: WidthType.DXA }, shading: { fill: '0C1020', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({ children: [new TextRun({ text: String(val || '—').trim(), size: 21, color: 'DDEEFF', font: FONT })], spacing: { line: 360 } })] })
        ]
      });
    }
    function sevCell(sev, w) {
      const c = SEV_DOCX_COLOR[sev] || '6B7280';
      const bg = SEV_DOCX_BG[sev] || '151515';
      return new TableCell({
        borders: brd, width: { size: w, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: SEV_VN[sev] || sev, bold: true, size: 21, color: c, font: FONT })] })]
      });
    }
    function h2p(txt) {
      return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: txt, size: 26, bold: true, color: '00E5FF', font: FONT })], spacing: { before: 320, after: 180, line: 360 } });
    }
    function h3p(txt) {
      return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: txt, size: 24, bold: true, color: '7C3AED', font: FONT })], spacing: { before: 260, after: 140, line: 320 } });
    }
    function bodyP(txt) {
      const s = String(txt || '').trim();
      if (!s) return [new Paragraph({ children: [new TextRun({ text: ' ', font: FONT })], spacing: { after: 100 } })];
      return s.split(/\r?\n/).map(line => new Paragraph({ children: [new TextRun({ text: line || ' ', size: 21, color: 'DDEEFF', font: FONT })], spacing: { after: 100, line: 360 } }));
    }
    function sp(n = 1) { return Array(n).fill(new Paragraph({ children: [new TextRun({ text: ' ', font: FONT })], spacing: { after: 80 } })); }

    const coverChildren = [
      new Paragraph({ spacing: { before: 900, after: 240 }, children: [new TextRun({ text: 'BÁO CÁO KIỂM THỬ BẢO MẬT', bold: true, size: 52, color: '00E5FF', font: FONT })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { after: 520 }, children: [new TextRun({ text: 'SECURITY ASSESSMENT REPORT', size: 26, color: '7C3AED', font: FONT })], alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { after: 240 }, children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '2A3F70' } } }),
      ...sp(2),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360],
        rows: [
          infoRow('Dự án', proj.name),
          infoRow('Mục tiêu', proj.target),
          infoRow('Đơn vị kiểm thử', proj.org),
          infoRow('Kiểm thử viên', proj.auditor),
          infoRow('Ngày kiểm thử', fmtDate(proj.date)),
          infoRow('Phiên bản', proj.ver),
          infoRow('Trưởng nhóm', proj.leaderName),
          infoRow('MSSV trưởng nhóm', proj.leaderMSSV),
          infoRow('Lớp', proj.leaderClass),
        ]
      }),
      ...sp(2),
      new Paragraph({ children: [new TextRun({ text: '⚠  TÀI LIỆU BẢO MẬT — KHÔNG PHÂN PHỐI', bold: true, size: 18, color: 'FF3366', font: FONT })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new PageBreak()] }),
    ];

    const summaryChildren = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 0, after: 240 }, children: [new TextRun({ text: '1. TỔNG QUAN', bold: true, size: 32, color: 'FFFFFF', font: FONT })], spacing: { line: 400 } }),
      ...bodyP(`Báo cáo này ghi nhận kết quả kiểm thử bảo mật ${proj.name}, thực hiện bởi ${proj.auditor} (${proj.org}) ngày ${fmtDate(proj.date)}. Trưởng nhóm: ${proj.leaderName} — MSSV: ${proj.leaderMSSV} — Lớp: ${proj.leaderClass}.`),
      h3p('Phạm vi kiểm thử'),
      ...bodyP(proj.scope),
      ...sp(),
      h3p('Thống kê lỗ hổng'),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [3120, 3120, 3120],
        rows: [
          new TableRow({ children: [hdrCell('Mức Độ', 3120), hdrCell('Số Lượng', 3120), hdrCell('Tỷ Lệ', 3120)] }),
          ...SEV_ORDER.filter(s => counts[s] > 0).map(s => new TableRow({
            children: [
              sevCell(s, 3120),
              dataCell(String(counts[s]), 3120, SEV_DOCX_COLOR[s]),
              dataCell(((counts[s] / vulns.length) * 100).toFixed(1) + '%', 3120, 'AABBCC'),
            ]
          })),
          new TableRow({
            children: [
              hdrCell('TỔNG CỘNG', 3120),
                new TableCell({
                borders: brd, width: { size: 3120, type: WidthType.DXA }, shading: { fill: '1A2240', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(vulns.length), bold: true, size: 22, color: 'FFFFFF', font: FONT })] })]
              }),
              dataCell('100%', 3120, 'AABBCC'),
            ]
          })
        ]
      }),
      ...sp(),
      new Paragraph({ children: [new PageBreak()] }),
    ];

    const overviewRows = [
      new TableRow({
        children: [
          hdrCell('#', 800), hdrCell('Tên Lỗi', 3000), hdrCell('Vị Trí', 3000), hdrCell('Mức Độ', 1600), hdrCell('Điểm CVSS', 1960)
        ]
      })
    ];
    vulns.forEach((v, i) => {
      overviewRows.push(new TableRow({
        children: [
          dataCell(String(i + 1), 800, 'AABBCC'),
          dataCell(v.name || '—', 3000, 'DDEEFF'),
          dataCell(v.location || '—', 3000, 'AABBCC'),
          sevCell(v.severity, 1600),
          dataCell({ CRITICAL: '9.0–10.0', HIGH: '7.0–8.9', MEDIUM: '4.0–6.9', LOW: '1.0–3.9', INFO: 'N/A' }[v.severity], 1960, 'AABBCC'),
        ]
      }));
    });

    const ovTableSection = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '2. DANH SÁCH LỖ HỔNG', bold: true, size: 32, color: 'FFFFFF', font: FONT })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [800, 3000, 3000, 1600, 1960], rows: overviewRows }),
      ...sp(),
      new Paragraph({ children: [new PageBreak()] }),
    ];

    const detailsChildren = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 300 }, children: [new TextRun({ text: '3. CHI TIẾT LỖ HỔNG', bold: true, size: 32, color: 'FFFFFF', font: FONT })] }),
    ];
    vulns.forEach((v, i) => {
      detailsChildren.push(
        h2p(`${i + 1}. ${v.name || 'Lỗ hổng ' + (i + 1)}`),
        ...sp(),
        new Table({
          width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 6960], rows: [
            new TableRow({
              children: [
                new TableCell({ borders: brd, width: { size: 2400, type: WidthType.DXA }, shading: { fill: '1A2240', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Mức độ', bold: true, size: 21, color: '00E5FF', font: FONT })] })] }),
                sevCell(v.severity, 6960),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: brd, width: { size: 2400, type: WidthType.DXA }, shading: { fill: '1A2240', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Vị trí lỗi', bold: true, size: 21, color: '00E5FF', font: FONT })] })] }),
                dataCell(v.location || '—', 6960, 'DDEEFF'),
              ]
            }),
          ]
        }),
        ...sp(),
        h3p('Cách Khai Thác'),
        ...bodyP(v.exploit || '—'),
        ...sp(),
        h3p('Khuyến Nghị'),
        ...bodyP(v.recommend || '—'),
        ...sp(),
        h3p('Tham Chiếu'),
        ...bodyP(v.refs || '—'),
        ...sp(),
        new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2A3F70' } } }),
        ...sp(2),
      );
      if (i < vulns.length - 1) detailsChildren.push(new Paragraph({ children: [new PageBreak()] }));
    });

    const doc = new Document({
      styles: {
        default: { document: { run: { font: FONT, size: 21 } }, paragraph: { spacing: { line: 360 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: FONT, color: 'FFFFFF' }, paragraph: { spacing: { before: 400, after: 240 }, outlineLevel: 0 } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: FONT, color: '00E5FF' }, paragraph: { spacing: { before: 320, after: 180 }, outlineLevel: 1 } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: FONT, color: '7C3AED' }, paragraph: { spacing: { before: 260, after: 140 }, outlineLevel: 2 } },
        ]
      },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, color: { pageColor: '070B16' } } },
        children: [...coverChildren, ...summaryChildren, ...ovTableSection, ...detailsChildren]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Security_Report_${proj.name.replace(/\s+/g, '_')}_${proj.date || 'report'}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Đã xuất file DOCX thành công!', 'ok');
  } catch (e) {
    console.error(e);
    toast('Lỗi tạo DOCX: ' + e.message, 'er');
  }
}

window.genDocx = genDocx;
