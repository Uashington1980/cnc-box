/**
 * 2D Laser / CNC Exporter for CNC Box (SVG, AutoCAD R12 DXF, and Store-ZIP)
 * Supports outer cuts + interior mortise cuts (distinct inner color / DXF layer),
 * exact physical mm/in scale, Kerf offset, CNC dogbone corner relief arcs,
 * Separate/Combine panel layout, and Single/Separate file output.
 */
(function (global) {
  'use strict';

  const MM_PER_INCH = 25.4;

  function fmt(num) {
    const v = Math.abs(num) < 1e-7 ? 0 : num;
    return Number(v.toFixed(4)).toString();
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function localizeLabel(raw) {
    return global.CNCBoxI18n ? global.CNCBoxI18n.translatePanelLabel(raw) : raw;
  }

  /**
   * Build SVG path `d` attribute string from Y-up geometric segments,
   * converted into SVG Y-down coordinates using sheetHeight.
   */
  function segmentsToSvgPath(segments, offsetX, offsetY, sheetHeight, scale) {
    if (!segments.length) return '';
    const s = scale || 1;
    const tx = x => (x + offsetX) * s;
    const ty = y => (sheetHeight - (y + offsetY)) * s;

    const first = segments[0];
    const parts = [`M ${fmt(tx(first.x1))} ${fmt(ty(first.y1))}`];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === 'line') {
        parts.push(`L ${fmt(tx(seg.x2))} ${fmt(ty(seg.y2))}`);
      } else if (seg.type === 'arc') {
        const r = seg.r * s;
        parts.push(`A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(tx(seg.x2))} ${fmt(ty(seg.y2))}`);
      }
    }
    parts.push('Z');
    return parts.join(' ');
  }

  /**
   * Compute outer & inner (hole) path segments for every placed item in a sheet layout.
   */
  function buildSheetData(panels, options) {
    const layout = global.BoxGeometry.layoutPanels(
      panels,
      options.layoutMode,
      options.panelSpacingMm
    );

    const compType = options.compType || 'none';
    const compValue = compType === 'kerf'
      ? (options.kerfMm || 0)
      : compType === 'corner'
        ? (options.bitDiameterMm || 0)
        : 0;

    const renderedItems = layout.items.map(item => {
      const segments = global.BoxGeometry.buildPathSegments(
        item.panel.outline2D,
        compType,
        compValue
      );
      const holeSegments = (item.panel.holes2D || []).map(holePts =>
        global.BoxGeometry.buildPathSegments(holePts, compType, compValue)
      );
      return {
        panel: item.panel,
        x: item.x,
        y: item.y,
        segments,
        holeSegments,
        slits: item.panel.slits2D || []
      };
    });

    return {
      widthMm: layout.width,
      heightMm: layout.height,
      items: renderedItems
    };
  }

  /**
   * Generate a complete SVG string (exact 1:1 physical dimensions in mm or in).
   */
  function generateSvg(panels, options) {
    const isInch = options.unit === 'in';
    const unitStr = isInch ? 'in' : 'mm';
    const scale = isInch ? (1 / MM_PER_INCH) : 1;

    const sheet = buildSheetData(panels, options);
    const padMm = Math.max(4, (options.kerfMm || 0) * 2 + 4);
    const totalWMm = sheet.widthMm + padMm * 2;
    const totalHMm = sheet.heightMm + padMm * 2;

    const viewW = totalWMm * scale;
    const viewH = totalHMm * scale;

    const strokeW = Math.max(0.01, (options.lineWidthMm || 0.25) * scale);
    const outerColor = options.outerLineColor || '#ff0000';
    const innerColor = options.innerLineColor || '#0000ff';
    const labelColor = options.labelColor || '#000000';
    const showLabels = options.labelsEnabled !== false;

    const outerPaths = [];
    const innerPaths = [];
    const labels = [];

    for (const item of sheet.items) {
      const d = segmentsToSvgPath(
        item.segments,
        item.x + padMm,
        item.y + padMm,
        totalHMm,
        scale
      );
      outerPaths.push(
        `    <path id="panel-${escapeXml(item.panel.id)}" d="${d}" fill="none" stroke="${escapeXml(outerColor)}" stroke-width="${fmt(strokeW)}" stroke-linejoin="miter" vector-effect="non-scaling-stroke" />`
      );

      for (let h = 0; h < item.holeSegments.length; h++) {
        const hd = segmentsToSvgPath(
          item.holeSegments[h],
          item.x + padMm,
          item.y + padMm,
          totalHMm,
          scale
        );
        innerPaths.push(
          `    <path id="hole-${escapeXml(item.panel.id)}-${h + 1}" d="${hd}" fill="none" stroke="${escapeXml(innerColor)}" stroke-width="${fmt(strokeW)}" stroke-linejoin="miter" vector-effect="non-scaling-stroke" />`
        );
      }

      if (item.slits && item.slits.length > 0) {
        const slitD = [];
        for (let sIdx = 0; sIdx < item.slits.length; sIdx++) {
          const sl = item.slits[sIdx];
          const x1 = (sl.x1 + item.x + padMm) * scale;
          const y1 = (totalHMm - (sl.y1 + item.y + padMm)) * scale;
          const x2 = (sl.x2 + item.x + padMm) * scale;
          const y2 = (totalHMm - (sl.y2 + item.y + padMm)) * scale;
          slitD.push(`M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}`);
        }
        innerPaths.push(
          `    <path id="kerf-slits-${escapeXml(item.panel.id)}" d="${slitD.join(' ')}" fill="none" stroke="${escapeXml(outerColor)}" stroke-width="${fmt(strokeW)}" vector-effect="non-scaling-stroke" />`
        );
      }

      if (showLabels) {
        const cx = (item.x + padMm + item.panel.width * 0.5) * scale;
        const cy = (totalHMm - (item.y + padMm + item.panel.height * 0.5)) * scale;
        const minDim = Math.min(item.panel.width, item.panel.height);
        const fontSize = Math.max(3.0, Math.min(10.5, minDim * 0.15)) * scale;
        labels.push(
          `    <text x="${fmt(cx)}" y="${fmt(cy)}" fill="${escapeXml(labelColor)}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fmt(fontSize)}" font-weight="500" text-anchor="middle" dominant-baseline="central">${escapeXml(localizeLabel(item.panel.label))}</text>`
        );
      }
    }

    const svgLines = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(viewW)}${unitStr}" height="${fmt(viewH)}${unitStr}" viewBox="0 0 ${fmt(viewW)} ${fmt(viewH)}">`,
      `  <title>CNC Box — Planos de Corte</title>`
    ];

    if (innerPaths.length > 0) {
      svgLines.push(`  <g id="inner-cuts">`);
      svgLines.push(...innerPaths);
      svgLines.push(`  </g>`);
    }

    svgLines.push(`  <g id="outer-cuts">`);
    svgLines.push(...outerPaths);
    svgLines.push(`  </g>`);

    if (showLabels && labels.length > 0) {
      svgLines.push(`  <g id="labels">`);
      svgLines.push(...labels);
      svgLines.push(`  </g>`);
    }

    svgLines.push(`</svg>`);

    return {
      svg: svgLines.join('\n'),
      sheetWidthMm: sheet.widthMm,
      sheetHeightMm: sheet.heightMm
    };
  }

  /**
   * Generate a preview-friendly SVG (with crisp stroke visibility on white canvas).
   */
  function generatePreviewSvg(panels, options) {
    const sheet = buildSheetData(panels, options);
    const padMm = Math.max(5, Math.min(sheet.widthMm, sheet.heightMm) * 0.035);
    const totalWMm = sheet.widthMm + padMm * 2;
    const totalHMm = sheet.heightMm + padMm * 2;

    const minVisibleStroke = Math.max(totalWMm, totalHMm) * 0.0026;
    const strokeW = Math.max(options.lineWidthMm || 0.25, minVisibleStroke);
    const outerColor = options.outerLineColor || '#ff0000';
    const innerColor = options.innerLineColor || '#0000ff';
    const labelColor = options.labelColor || '#000000';
    const showLabels = options.labelsEnabled !== false;

    const outerPaths = [];
    const innerPaths = [];
    const labels = [];

    for (const item of sheet.items) {
      const d = segmentsToSvgPath(
        item.segments,
        item.x + padMm,
        item.y + padMm,
        totalHMm,
        1
      );
      outerPaths.push(
        `<path d="${d}" fill="none" stroke="${escapeXml(outerColor)}" stroke-width="${fmt(strokeW)}" stroke-linejoin="miter" />`
      );

      for (let h = 0; h < item.holeSegments.length; h++) {
        const hd = segmentsToSvgPath(
          item.holeSegments[h],
          item.x + padMm,
          item.y + padMm,
          totalHMm,
          1
        );
        innerPaths.push(
          `<path d="${hd}" fill="none" stroke="${escapeXml(innerColor)}" stroke-width="${fmt(strokeW)}" stroke-linejoin="miter" />`
        );
      }

      if (item.slits && item.slits.length > 0) {
        const slitD = [];
        for (let sIdx = 0; sIdx < item.slits.length; sIdx++) {
          const sl = item.slits[sIdx];
          const x1 = sl.x1 + item.x + padMm;
          const y1 = totalHMm - (sl.y1 + item.y + padMm);
          const x2 = sl.x2 + item.x + padMm;
          const y2 = totalHMm - (sl.y2 + item.y + padMm);
          slitD.push(`M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}`);
        }
        innerPaths.push(
          `<path d="${slitD.join(' ')}" fill="none" stroke="${escapeXml(outerColor)}" stroke-width="${fmt(strokeW * 0.8)}" />`
        );
      }

      if (showLabels) {
        const cx = item.x + padMm + item.panel.width * 0.5;
        const cy = totalHMm - (item.y + padMm + item.panel.height * 0.5);
        const minDim = Math.min(item.panel.width, item.panel.height);
        const fontSize = Math.max(3.6, Math.min(12, minDim * 0.16));
        labels.push(
          `<text x="${fmt(cx)}" y="${fmt(cy)}" fill="${escapeXml(labelColor)}" font-family="Inter, Arial, sans-serif" font-size="${fmt(fontSize)}" font-weight="500" text-anchor="middle" dominant-baseline="central">${escapeXml(localizeLabel(item.panel.label))}</text>`
        );
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(totalWMm)} ${fmt(totalHMm)}" preserveAspectRatio="xMidYMid meet">
      <g id="preview-inner">${innerPaths.join('')}</g>
      <g id="preview-outer">${outerPaths.join('')}</g>
      <g id="preview-labels">${labels.join('')}</g>
    </svg>`;

    return {
      svg,
      sheetWidthMm: sheet.widthMm,
      sheetHeightMm: sheet.heightMm
    };
  }

  /**
   * Generate a standard AutoCAD R12 DXF file (LINE, ARC, TEXT entities) in exact 1:1 scale
   * with separate CUT_OUTER (red), CUT_INNER (blue), and LABELS layers.
   */
  function generateDxf(panels, options) {
    const isInch = options.unit === 'in';
    const scale = isInch ? (1 / MM_PER_INCH) : 1;
    const insUnits = isInch ? 1 : 4;

    const sheet = buildSheetData(panels, options);
    const showLabels = options.labelsEnabled !== false;

    const lines = [
      '0', 'SECTION',
      '2', 'HEADER',
      '9', '$ACADVER', '1', 'AC1009',
      '9', '$INSUNITS', '70', String(insUnits),
      '0', 'ENDSEC',
      '0', 'SECTION',
      '2', 'TABLES',
      '0', 'TABLE',
      '2', 'LAYER',
      '70', '3',
      '0', 'LAYER',
      '2', 'CUT_OUTER',
      '70', '0',
      '62', '1', // Red
      '6', 'CONTINUOUS',
      '0', 'LAYER',
      '2', 'CUT_INNER',
      '70', '0',
      '62', '5', // Blue
      '6', 'CONTINUOUS',
      '0', 'LAYER',
      '2', 'LABELS',
      '70', '0',
      '62', '7', // Black/White
      '6', 'CONTINUOUS',
      '0', 'ENDTAB',
      '0', 'ENDSEC',
      '0', 'SECTION',
      '2', 'ENTITIES'
    ];

    function radToDeg360(rad) {
      let deg = (rad * 180) / Math.PI;
      while (deg < 0) deg += 360;
      while (deg >= 360) deg -= 360;
      return deg;
    }

    function emitSegments(segments, ox, oy, layerName, aciColor) {
      for (const seg of segments) {
        if (seg.type === 'line') {
          lines.push(
            '0', 'LINE',
            '8', layerName,
            '62', aciColor,
            '10', fmt((seg.x1 + ox) * scale),
            '20', fmt((seg.y1 + oy) * scale),
            '30', '0',
            '11', fmt((seg.x2 + ox) * scale),
            '21', fmt((seg.y2 + oy) * scale),
            '31', '0'
          );
        } else if (seg.type === 'arc') {
          const aStart = radToDeg360(seg.endAngle);
          const aEnd = radToDeg360(seg.startAngle);
          lines.push(
            '0', 'ARC',
            '8', layerName,
            '62', aciColor,
            '10', fmt((seg.cx + ox) * scale),
            '20', fmt((seg.cy + oy) * scale),
            '30', '0',
            '40', fmt(seg.r * scale),
            '50', fmt(aStart),
            '51', fmt(aEnd)
          );
        }
      }
    }

    for (const item of sheet.items) {
      const ox = item.x;
      const oy = item.y;

      for (let h = 0; h < item.holeSegments.length; h++) {
        emitSegments(item.holeSegments[h], ox, oy, 'CUT_INNER', '5');
      }

      if (item.slits && item.slits.length > 0) {
        for (let sIdx = 0; sIdx < item.slits.length; sIdx++) {
          const sl = item.slits[sIdx];
          lines.push(
            '0', 'LINE',
            '8', 'CUT_INNER',
            '62', '5',
            '10', fmt((sl.x1 + ox) * scale),
            '20', fmt((sl.y1 + oy) * scale),
            '30', '0',
            '11', fmt((sl.x2 + ox) * scale),
            '21', fmt((sl.y2 + oy) * scale),
            '31', '0'
          );
        }
      }

      emitSegments(item.segments, ox, oy, 'CUT_OUTER', '1');

      if (showLabels) {
        const cx = (ox + item.panel.width * 0.5) * scale;
        const cy = (oy + item.panel.height * 0.5) * scale;
        const minDim = Math.min(item.panel.width, item.panel.height);
        const textH = Math.max(2.8, Math.min(9.5, minDim * 0.14)) * scale;
        lines.push(
          '0', 'TEXT',
          '8', 'LABELS',
          '62', '7',
          '10', fmt(cx),
          '20', fmt(cy),
          '30', '0',
          '40', fmt(textH),
          '1', localizeLabel(item.panel.label),
          '72', '1',
          '73', '2',
          '11', fmt(cx),
          '21', fmt(cy),
          '31', '0'
        );
      }
    }

    lines.push('0', 'ENDSEC', '0', 'EOF', '');
    return lines.join('\r\n');
  }

  /**
   * Minimal zero-dependency ZIP (Store / method 0) archive builder for "Arquivos Separados" mode.
   */
  const crcTable = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createZipBlob(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const f of files) {
      const nameBytes = encoder.encode(f.name);
      const dataBytes = encoder.encode(f.content);
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      const central = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(42, offset, true);
      central.set(nameBytes, 46);

      centralParts.push(central);
      offset += localHeader.length + dataBytes.length;
    }

    const centralSize = centralParts.reduce((s, b) => s + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadExport(boxModel, options, format) {
    const baseName = (options.filename || 'cnc-box').trim().replace(/[<>:"/\\|?*]+/g, '-') || 'cnc-box';
    const ext = format === 'dxf' ? 'dxf' : 'svg';
    const mime = format === 'dxf' ? 'application/dxf' : 'image/svg+xml;charset=utf-8';

    if (options.fileOutput === 'separate') {
      const files = boxModel.panels.map(panel => {
        const content = format === 'dxf'
          ? generateDxf([panel], options)
          : generateSvg([panel], options).svg;
        return {
          name: `${baseName}-${panel.id}.${ext}`,
          content
        };
      });
      const zipBlob = createZipBlob(files);
      triggerDownload(zipBlob, `${baseName}-${ext}.zip`);
      return;
    }

    const content = format === 'dxf'
      ? generateDxf(boxModel.panels, options)
      : generateSvg(boxModel.panels, options).svg;

    const blob = new Blob([content], { type: mime });
    triggerDownload(blob, `${baseName}.${ext}`);
  }

  global.BoxExporter = {
    generateSvg,
    generatePreviewSvg,
    generateDxf,
    downloadExport
  };
})(window);
