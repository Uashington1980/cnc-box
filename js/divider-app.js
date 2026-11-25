/**
 * CNC Box — Grid Divider Box UI Controller (Caixa Divisória em Grade — FLAT & FINGER only)
 */
(function (global) {
  'use strict';

  const MM_PER_INCH = 25.4;

  const THICKNESS_PRESETS = {
    mm: [
      { label: '1.50 mm', mm: 1.5 },
      { label: '2.00 mm', mm: 2.0 },
      { label: '3.00 mm', mm: 3.0 },
      { label: '5.00 mm', mm: 5.0 },
      { label: '6.00 mm', mm: 6.0 },
      { label: '9.00 mm', mm: 9.0 },
      { label: '12.00 mm', mm: 12.0 }
    ],
    in: [
      { label: '1/8 (0.118) in', mm: 3.0 },
      { label: '1/4 (0.236) in', mm: 6.0 },
      { label: '3/8 (0.354) in', mm: 9.0 },
      { label: '1/2 (0.472) in', mm: 12.0 }
    ]
  };

  const state = {
    unit: 'mm',
    widthMm: 150,
    heightMm: 50,
    depthMm: 100,
    thicknessMm: 3,
    customThickness: false,
    rowCount: 3,
    colCount: 3,
    colWidthsMm: null,    // null => equal distribution, or array[colCount] in mm
    rowDepthsMm: null,    // null => equal distribution, or array[rowCount] in mm
    dimRef: 'outside',    // 'inside' | 'outside' | 'cell'
    lidType: 'none',      // 'none' | 'flat'
    joint: 'finger',      // 'flat' | 'finger' (NO T-SLOT)
    fingerSizeMm: 9.0,
    exploded: false,

    // Export modal options
    labelsEnabled: true,
    labelColor: '#000000',
    lineWidthMm: 0.25,
    outerLineColor: '#ff0000',
    innerLineColor: '#0000ff',
    compType: 'none',
    kerfMm: 0.1,
    bitDiameterMm: 3.17,
    layoutMode: 'separate',
    panelSpacingMm: 3.0,
    fileOutput: 'single',
    filenameEdited: false,
    filename: ''
  };

  const tr = (k, fb) => (global.CNCBoxI18n ? global.CNCBoxI18n.t(k, fb) : (fb || k));

  let currentModel = null;
  let renderer = null;

  // Draft values inside the Resize Dividers modal
  let draftColWidthsMm = [];
  let draftRowDepthsMm = [];

  function mmToUnit(mm) {
    return state.unit === 'in' ? mm / MM_PER_INCH : mm;
  }

  function unitToMm(val) {
    return state.unit === 'in' ? val * MM_PER_INCH : val;
  }

  function decimalsForUnit() {
    return state.unit === 'in' ? 3 : 2;
  }

  function fmtUnit(mm, customDecimals) {
    const d = customDecimals !== undefined ? customDecimals : decimalsForUnit();
    return mmToUnit(mm).toFixed(d);
  }

  function isValidHexColor(str) {
    return /^#[0-9a-fA-F]{6}$/.test(str);
  }

  const dom = {};

  function cacheDom() {
    dom.canvas = document.getElementById('box-canvas');
    dom.webglFallback = document.getElementById('webgl-fallback');
    dom.panel = document.getElementById('divider-box-ui');
    dom.btnTogglePanel = document.getElementById('btn-toggle-panel');
    dom.btnExplode = document.getElementById('btn-explode');
    dom.btnResetView = document.getElementById('btn-reset-view');
    dom.btnHelp = document.getElementById('btn-help');

    dom.unitButtons = document.querySelectorAll('[data-unit]');
    dom.dimRefButtons = document.querySelectorAll('[data-dim-ref]');
    dom.jointButtons = document.querySelectorAll('[data-joint]');
    dom.unitSuffixes = document.querySelectorAll('[data-unit-label]');

    dom.inputWidth = document.getElementById('input-width');
    dom.inputHeight = document.getElementById('input-height');
    dom.inputDepth = document.getElementById('input-depth');
    dom.inputRows = document.getElementById('input-rows');
    dom.inputCols = document.getElementById('input-cols');
    dom.btnResizeDividers = document.getElementById('btn-resize-dividers');

    dom.thicknessDropdownWrap = document.getElementById('thickness-dropdown-wrap');
    dom.thicknessDetails = document.getElementById('thickness-details');
    dom.thicknessDisplay = document.getElementById('thickness-display');
    dom.thicknessMenu = document.getElementById('thickness-menu');
    dom.thicknessCustomWrap = document.getElementById('thickness-custom-wrap');
    dom.inputThickness = document.getElementById('input-thickness');
    dom.btnThicknessPresets = document.getElementById('btn-thickness-presets');

    dom.lidDetails = document.getElementById('lid-details');
    dom.lidDisplay = document.getElementById('lid-display');
    dom.lidOptions = document.querySelectorAll('[data-lid]');

    dom.validationMsg = document.getElementById('validation-msg');

    dom.fingerSection = document.getElementById('finger-size-section');
    dom.fingerCountHint = document.getElementById('finger-count-hint');
    dom.fingerMinBtn = document.getElementById('finger-min-btn');
    dom.fingerMaxBtn = document.getElementById('finger-max-btn');
    dom.inputFingerSize = document.getElementById('input-finger-size');
    dom.fingerSliderFill = document.getElementById('finger-slider-fill');
    dom.fingerThumbPill = document.getElementById('finger-thumb-pill');

    dom.hudOuter = document.getElementById('hud-outer');
    dom.hudGrid = document.getElementById('hud-grid');
    dom.hudPanels = document.getElementById('hud-panels');

    // Resize Dividers modal
    dom.resizeModal = document.getElementById('resize-modal');
    dom.btnCloseResize = document.getElementById('btn-close-resize');
    dom.btnCancelResize = document.getElementById('btn-cancel-resize');
    dom.btnEqualizeCells = document.getElementById('btn-equalize-cells');
    dom.btnApplyResize = document.getElementById('btn-apply-resize');
    dom.resizeGridShell = document.getElementById('resize-grid-shell');
    dom.resizeOldDim = document.getElementById('resize-old-dim');
    dom.resizeNewDim = document.getElementById('resize-new-dim');

    // Download modal
    dom.btnOpenDownload = document.getElementById('btn-open-download');
    dom.downloadModal = document.getElementById('download-modal');
    dom.btnCloseDownload = document.getElementById('btn-close-download');
    dom.svgPreviewContainer = document.getElementById('svg-preview-container');
    dom.svgPreviewMeta = document.getElementById('svg-preview-meta');

    dom.tabButtons = document.querySelectorAll('[data-tab]');
    dom.tabPanels = document.querySelectorAll('[data-tab-panel]');

    dom.labelButtons = document.querySelectorAll('[data-labels]');
    dom.labelColorField = document.getElementById('label-color-field');
    dom.inputLabelColor = document.getElementById('input-label-color');
    dom.pickerLabelColor = document.getElementById('picker-label-color');

    dom.inputLineWidth = document.getElementById('input-line-width');
    dom.inputOuterColor = document.getElementById('input-outer-color');
    dom.pickerOuterColor = document.getElementById('picker-outer-color');
    dom.inputInnerColor = document.getElementById('input-inner-color');
    dom.pickerInnerColor = document.getElementById('picker-inner-color');

    dom.compButtons = document.querySelectorAll('[data-comp]');
    dom.compKerfField = document.getElementById('comp-kerf-field');
    dom.inputKerf = document.getElementById('input-kerf');
    dom.compCornerField = document.getElementById('comp-corner-field');
    dom.inputBitDiameter = document.getElementById('input-bit-diameter');
    dom.cornerFlatNote = document.getElementById('corner-flat-note');

    dom.layoutButtons = document.querySelectorAll('[data-layout]');
    dom.panelSpacingField = document.getElementById('panel-spacing-field');
    dom.inputPanelSpacing = document.getElementById('input-panel-spacing');
    dom.outputButtons = document.querySelectorAll('[data-output]');

    dom.inputFilename = document.getElementById('input-filename');
    dom.btnDownloadSvg = document.getElementById('btn-download-svg');
    dom.btnDownloadDxf = document.getElementById('btn-download-dxf');
    dom.downloadCaption = document.getElementById('download-caption');

    // Help modal
    dom.helpModal = document.getElementById('help-modal');
    dom.btnCloseHelp = document.getElementById('btn-close-help');
  }

  function setActiveSegment(buttons, attr, value) {
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset[attr] === value);
    });
  }

  function renderThicknessMenu() {
    const presets = THICKNESS_PRESETS[state.unit];
    dom.thicknessMenu.innerHTML = '';

    let matchedLabel = null;
    presets.forEach(preset => {
      const isSelected = !state.customThickness && Math.abs(preset.mm - state.thicknessMm) < 0.05;
      if (isSelected) matchedLabel = preset.label;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thickness-option' + (isSelected ? ' selected' : '');
      btn.setAttribute('role', 'option');
      btn.textContent = preset.label;
      btn.addEventListener('click', () => {
        state.thicknessMm = preset.mm;
        state.customThickness = false;
        dom.thicknessDetails.removeAttribute('open');
        syncThicknessUI();
        rebuildAll();
      });
      dom.thicknessMenu.appendChild(btn);
    });

    const customBtn = document.createElement('button');
    customBtn.type = 'button';
    customBtn.className = 'thickness-option is-custom';
    customBtn.setAttribute('role', 'option');
    customBtn.textContent = tr('Personalizado');
    customBtn.addEventListener('click', () => {
      state.customThickness = true;
      dom.thicknessDetails.removeAttribute('open');
      syncThicknessUI();
      dom.inputThickness.focus();
      dom.inputThickness.select();
    });
    dom.thicknessMenu.appendChild(customBtn);

    dom.thicknessDisplay.textContent = matchedLabel || `${fmtUnit(state.thicknessMm)} ${state.unit}`;
  }

  function syncThicknessUI() {
    if (state.customThickness) {
      dom.thicknessDropdownWrap.hidden = true;
      dom.thicknessCustomWrap.hidden = false;
      dom.inputThickness.value = fmtUnit(state.thicknessMm);
      dom.inputThickness.step = state.unit === 'in' ? '0.01' : '0.1';
    } else {
      dom.thicknessDropdownWrap.hidden = false;
      dom.thicknessCustomWrap.hidden = true;
      renderThicknessMenu();
    }
  }

  function syncDimensionInputs() {
    const step = state.unit === 'in' ? '0.1' : '1';
    dom.inputWidth.step = step;
    dom.inputHeight.step = step;
    dom.inputDepth.step = step;

    dom.inputWidth.value = fmtUnit(state.widthMm);
    dom.inputHeight.value = fmtUnit(state.heightMm);
    dom.inputDepth.value = fmtUnit(state.depthMm);

    dom.inputRows.value = String(state.rowCount);
    dom.inputCols.value = String(state.colCount);

    dom.unitSuffixes.forEach(el => {
      el.textContent = state.unit;
    });

    dom.inputLineWidth.value = fmtUnit(state.lineWidthMm);
    dom.inputLineWidth.step = state.unit === 'in' ? '0.002' : '0.05';

    dom.inputKerf.value = fmtUnit(state.kerfMm);
    dom.inputKerf.step = state.unit === 'in' ? '0.001' : '0.01';

    dom.inputBitDiameter.value = fmtUnit(state.bitDiameterMm);
    dom.inputBitDiameter.step = state.unit === 'in' ? '0.01' : '0.1';

    dom.inputPanelSpacing.value = fmtUnit(state.panelSpacingMm);
    dom.inputPanelSpacing.step = state.unit === 'in' ? '0.05' : '0.5';

    syncThicknessUI();
  }

  function syncFingerSlider(model) {
    const isFinger = state.joint === 'finger';
    dom.fingerSection.hidden = !isFinger;
    if (!isFinger) return;

    const { min, max } = model.finger.limits;
    state.fingerSizeMm = model.finger.size;

    const dispMin = mmToUnit(min);
    const dispMax = mmToUnit(max);
    const dispVal = mmToUnit(state.fingerSizeMm);
    const boundDec = state.unit === 'in' ? 2 : 1;

    dom.inputFingerSize.min = String(min);
    dom.inputFingerSize.max = String(max);
    dom.inputFingerSize.step = String(Math.max(0.05, (max - min) / 150));
    dom.inputFingerSize.value = String(state.fingerSizeMm);

    dom.fingerMinBtn.textContent = dispMin.toFixed(boundDec);
    dom.fingerMaxBtn.textContent = dispMax.toFixed(boundDec);
    dom.fingerThumbPill.textContent = dispVal.toFixed(decimalsForUnit());

    const pct = max > min ? ((state.fingerSizeMm - min) / (max - min)) * 100 : 50;
    const clampedPct = Math.max(0, Math.min(100, pct));
    dom.fingerSliderFill.style.width = `${clampedPct}%`;
    dom.fingerThumbPill.style.left = `${clampedPct}%`;

    const c = model.finger.counts;
    dom.fingerCountHint.textContent = `${c.x}×${c.y}×${c.z} ${tr('dyn.seg')}`;
  }

  function defaultFilename(model) {
    const u = state.unit;
    const dec = u === 'in' ? 2 : 0;
    const w = Number(mmToUnit(model.outer.width).toFixed(dec));
    const d = Number(mmToUnit(model.outer.depth).toFixed(dec));
    const h = Number(mmToUnit(model.outer.height).toFixed(dec));
    const t = Number(mmToUnit(model.thickness).toFixed(u === 'in' ? 3 : 1));
    const modeTag = state.joint === 'flat' ? 'plano' : 'dedo';
    return `caixa-divisoria-${model.rows}x${model.cols}-${modeTag}-${w}x${d}x${h}-${t}${u}`;
  }

  function syncHud(model) {
    const dec = state.unit === 'in' ? 2 : 1;
    const u = state.unit;
    const o = model.outer;
    const cells = model.rows * model.cols;

    dom.hudOuter.textContent = `${fmtUnit(o.width, dec)} × ${fmtUnit(o.height, dec)} × ${fmtUnit(o.depth, dec)} ${u}`;
    dom.hudGrid.textContent = `${model.rows}×${model.cols} (${cells} ${tr('dyn.cells')})`;
    dom.hudPanels.textContent = `${model.panels.length} (${state.joint === 'flat' ? tr('dyn.flat') : tr('dyn.finger')})`;

    if (!model.valid) {
      dom.validationMsg.textContent = 'Dimensões insuficientes para esta quantidade de linhas/colunas e espessura.';
      dom.validationMsg.hidden = false;
    } else {
      dom.validationMsg.hidden = true;
    }
  }

  function getExportOptions() {
    return {
      unit: state.unit,
      labelsEnabled: state.labelsEnabled,
      labelColor: state.labelColor,
      lineWidthMm: state.lineWidthMm,
      outerLineColor: state.outerLineColor,
      innerLineColor: state.innerLineColor,
      compType: state.compType,
      kerfMm: state.kerfMm,
      bitDiameterMm: state.bitDiameterMm,
      layoutMode: state.layoutMode,
      panelSpacingMm: state.panelSpacingMm,
      fileOutput: state.fileOutput,
      filename: dom.inputFilename.value
    };
  }

  function updateModalPreview() {
    if (!currentModel || dom.downloadModal.hidden) return;
    const opts = getExportOptions();
    const res = global.BoxExporter.generatePreviewSvg(currentModel.panels, opts);
    dom.svgPreviewContainer.innerHTML = res.svg;

    const dec = state.unit === 'in' ? 2 : 1;
    dom.svgPreviewMeta.textContent =
      `${tr('dyn.sheet')}: ${fmtUnit(res.sheetWidthMm, dec)} × ${fmtUnit(res.sheetHeightMm, dec)} ${state.unit} · ${currentModel.panels.length} ${tr('dyn.parts')}`;

    dom.cornerFlatNote.hidden = !(state.compType === 'corner' && state.joint === 'flat');
    dom.downloadCaption.textContent = state.fileOutput === 'separate'
      ? tr('dyn.captionSeparate')
      : tr('dyn.captionSingle');
  }

  function rebuildAll() {
    currentModel = global.BoxGeometry.buildDividerBoxModel({
      width: state.widthMm,
      height: state.heightMm,
      depth: state.depthMm,
      thickness: state.thicknessMm,
      rowCount: state.rowCount,
      colCount: state.colCount,
      colWidths: state.colWidthsMm,
      rowDepths: state.rowDepthsMm,
      dimRef: state.dimRef,
      lidType: state.lidType,
      joint: state.joint,
      fingerSize: state.fingerSizeMm
    });

    syncFingerSlider(currentModel);
    syncHud(currentModel);

    if (!state.filenameEdited) {
      state.filename = defaultFilename(currentModel);
      dom.inputFilename.value = state.filename;
    }

    if (renderer && renderer.available) {
      renderer.setModel(currentModel);
    }

    if (!dom.downloadModal.hidden) {
      updateModalPreview();
    }
  }

  /* ---------- Resize Dividers Modal (Custom Compartment Sizes) ---------- */
  function openResizeModal() {
    if (!currentModel) return;
    draftColWidthsMm = currentModel.colWidths.slice();
    draftRowDepthsMm = currentModel.rowDepths.slice();
    renderResizeGrid();
    dom.resizeModal.hidden = false;
  }

  function updateResizeSummary() {
    if (!currentModel) return;
    const T = currentModel.thickness;
    const newW = draftColWidthsMm.reduce((s, v) => s + v, 0) + (draftColWidthsMm.length + 1) * T;
    const newD = draftRowDepthsMm.reduce((s, v) => s + v, 0) + (draftRowDepthsMm.length + 1) * T;
    const dec = state.unit === 'in' ? 2 : 1;
    const u = state.unit;

    dom.resizeOldDim.textContent =
      `${fmtUnit(currentModel.outer.width, dec)} × ${fmtUnit(currentModel.outer.depth, dec)} ${u}`;
    dom.resizeNewDim.textContent =
      `${fmtUnit(newW, dec)} × ${fmtUnit(newD, dec)} ${u}`;

    // Update live cell size readouts inside schematic
    const cells = dom.resizeGridShell.querySelectorAll('.resize-cell-box');
    cells.forEach(cell => {
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);
      cell.textContent = `${fmtUnit(draftColWidthsMm[c], dec)} × ${fmtUnit(draftRowDepthsMm[r], dec)}`;
    });

    // Update proportional CSS grid column/row sizes
    const gridEl = dom.resizeGridShell.querySelector('.resize-matrix');
    if (gridEl) {
      const colFrs = draftColWidthsMm.map(w => `${Math.max(0.4, w)}fr`).join(' ');
      gridEl.style.gridTemplateColumns = `112px ${colFrs}`;
    }
  }

  function renderResizeGrid() {
    const cols = draftColWidthsMm.length;
    const rows = draftRowDepthsMm.length;
    const u = state.unit;
    const dec = decimalsForUnit();
    const step = u === 'in' ? '0.05' : '1';

    const matrix = document.createElement('div');
    matrix.className = 'resize-matrix';
    const colFrs = draftColWidthsMm.map(w => `${Math.max(0.4, w)}fr`).join(' ');
    matrix.style.gridTemplateColumns = `112px ${colFrs}`;

    // Top-left corner spacer
    const corner = document.createElement('div');
    corner.className = 'resize-corner-label';
    corner.textContent = `${tr('dyn.rowColHeader')} (${u})`;
    matrix.appendChild(corner);

    // Column width inputs (header row)
    for (let c = 0; c < cols; c++) {
      const wrap = document.createElement('label');
      wrap.className = 'resize-axis-input';
      wrap.innerHTML = `<span>${tr('dyn.colShort')} ${c + 1}</span>`;
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = step;
      inp.min = String(mmToUnit(4));
      inp.value = fmtUnit(draftColWidthsMm[c], dec);
      inp.setAttribute('aria-label', `Largura da coluna ${c + 1}`);
      inp.addEventListener('input', () => {
        const val = parseFloat(inp.value);
        if (Number.isFinite(val) && val > 0) {
          draftColWidthsMm[c] = Math.max(4, unitToMm(val));
          updateResizeSummary();
        }
      });
      wrap.appendChild(inp);
      matrix.appendChild(wrap);
    }

    // Rows (row input + cell previews)
    for (let r = 0; r < rows; r++) {
      const rowWrap = document.createElement('label');
      rowWrap.className = 'resize-axis-input resize-row-input';
      rowWrap.innerHTML = `<span>${tr('dyn.rowShort')} ${r + 1}</span>`;
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = step;
      inp.min = String(mmToUnit(4));
      inp.value = fmtUnit(draftRowDepthsMm[r], dec);
      inp.setAttribute('aria-label', `Profundidade da linha ${r + 1}`);
      inp.addEventListener('input', () => {
        const val = parseFloat(inp.value);
        if (Number.isFinite(val) && val > 0) {
          draftRowDepthsMm[r] = Math.max(4, unitToMm(val));
          updateResizeSummary();
        }
      });
      rowWrap.appendChild(inp);
      matrix.appendChild(rowWrap);

      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'resize-cell-box';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        matrix.appendChild(cell);
      }
    }

    dom.resizeGridShell.innerHTML = '';
    dom.resizeGridShell.appendChild(matrix);
    updateResizeSummary();
  }

  function applyResizeModal() {
    const T = state.thicknessMm;
    const newInnerW = draftColWidthsMm.reduce((s, v) => s + v, 0) + (draftColWidthsMm.length - 1) * T;
    const newInnerD = draftRowDepthsMm.reduce((s, v) => s + v, 0) + (draftRowDepthsMm.length - 1) * T;
    const newOuterW = newInnerW + 2 * T;
    const newOuterD = newInnerD + 2 * T;

    state.colWidthsMm = draftColWidthsMm.slice();
    state.rowDepthsMm = draftRowDepthsMm.slice();

    if (state.dimRef === 'outside') {
      state.widthMm = newOuterW;
      state.depthMm = newOuterD;
    } else if (state.dimRef === 'inside') {
      state.widthMm = newInnerW;
      state.depthMm = newInnerD;
    } else {
      // Switch to outside when unequal custom cells are applied
      state.dimRef = 'outside';
      state.widthMm = newOuterW;
      state.depthMm = newOuterD;
      state.heightMm = currentModel.outer.height;
      setActiveSegment(dom.dimRefButtons, 'dimRef', state.dimRef);
    }

    dom.resizeModal.hidden = true;
    syncDimensionInputs();
    rebuildAll();
  }

  function bindColorPair(textInput, pickerInput, stateKey) {
    pickerInput.addEventListener('input', () => {
      state[stateKey] = pickerInput.value;
      textInput.value = pickerInput.value;
      updateModalPreview();
    });

    textInput.addEventListener('input', () => {
      const val = textInput.value.trim();
      if (isValidHexColor(val)) {
        state[stateKey] = val;
        pickerInput.value = val;
        updateModalPreview();
      }
    });

    textInput.addEventListener('blur', () => {
      if (!isValidHexColor(textInput.value.trim())) {
        textInput.value = state[stateKey];
      }
    });
  }

  function bindEvents() {
    dom.btnExplode.addEventListener('click', () => {
      state.exploded = !state.exploded;
      dom.btnExplode.classList.toggle('is-active', state.exploded);
      if (renderer) renderer.setExploded(state.exploded);
    });

    dom.btnResetView.addEventListener('click', () => {
      if (renderer) renderer.resetCamera();
    });

    dom.btnTogglePanel.addEventListener('click', () => {
      const collapsed = dom.panel.classList.toggle('is-collapsed');
      dom.btnTogglePanel.setAttribute('aria-expanded', String(!collapsed));
    });

    // Units toggle
    dom.unitButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextUnit = btn.dataset.unit;
        if (nextUnit === state.unit) return;
        state.unit = nextUnit;
        setActiveSegment(dom.unitButtons, 'unit', state.unit);
        syncDimensionInputs();
        rebuildAll();
      });
    });

    // Dimensions inputs
    function bindNumericDim(inputEl, stateKey, resetCustomKey) {
      inputEl.addEventListener('input', () => {
        const val = parseFloat(inputEl.value);
        if (!Number.isFinite(val) || val <= 0) return;
        state[stateKey] = unitToMm(val);
        if (resetCustomKey && state.dimRef === 'cell') {
          state[resetCustomKey] = null;
        }
        rebuildAll();
      });
      inputEl.addEventListener('blur', () => {
        inputEl.value = fmtUnit(state[stateKey]);
      });
    }

    bindNumericDim(dom.inputWidth, 'widthMm', 'colWidthsMm');
    bindNumericDim(dom.inputHeight, 'heightMm', null);
    bindNumericDim(dom.inputDepth, 'depthMm', 'rowDepthsMm');

    // Rows & Columns inputs
    dom.inputRows.addEventListener('input', () => {
      const val = parseInt(dom.inputRows.value, 10);
      if (!Number.isFinite(val)) return;
      const clamped = Math.max(1, Math.min(12, val));
      if (clamped !== state.rowCount) {
        state.rowCount = clamped;
        state.rowDepthsMm = null; // reset custom row sizes when count changes
        rebuildAll();
      }
    });
    dom.inputRows.addEventListener('blur', () => {
      dom.inputRows.value = String(state.rowCount);
    });

    dom.inputCols.addEventListener('input', () => {
      const val = parseInt(dom.inputCols.value, 10);
      if (!Number.isFinite(val)) return;
      const clamped = Math.max(1, Math.min(12, val));
      if (clamped !== state.colCount) {
        state.colCount = clamped;
        state.colWidthsMm = null; // reset custom column sizes when count changes
        rebuildAll();
      }
    });
    dom.inputCols.addEventListener('blur', () => {
      dom.inputCols.value = String(state.colCount);
    });

    // Resize dividers modal controls
    dom.btnResizeDividers.addEventListener('click', openResizeModal);
    dom.btnCloseResize.addEventListener('click', () => { dom.resizeModal.hidden = true; });
    dom.btnCancelResize.addEventListener('click', () => { dom.resizeModal.hidden = true; });
    dom.resizeModal.addEventListener('click', e => {
      if (e.target === dom.resizeModal) dom.resizeModal.hidden = true;
    });
    dom.btnEqualizeCells.addEventListener('click', () => {
      const avgW = draftColWidthsMm.reduce((s, v) => s + v, 0) / draftColWidthsMm.length;
      const avgD = draftRowDepthsMm.reduce((s, v) => s + v, 0) / draftRowDepthsMm.length;
      draftColWidthsMm = draftColWidthsMm.map(() => avgW);
      draftRowDepthsMm = draftRowDepthsMm.map(() => avgD);
      renderResizeGrid();
    });
    dom.btnApplyResize.addEventListener('click', applyResizeModal);

    // Custom thickness
    dom.inputThickness.addEventListener('input', () => {
      const val = parseFloat(dom.inputThickness.value);
      if (!Number.isFinite(val) || val <= 0) return;
      state.thicknessMm = Math.max(0.2, unitToMm(val));
      rebuildAll();
    });
    dom.inputThickness.addEventListener('blur', () => {
      dom.inputThickness.value = fmtUnit(state.thicknessMm);
    });
    dom.btnThicknessPresets.addEventListener('click', () => {
      state.customThickness = false;
      syncThicknessUI();
      dom.thicknessDetails.setAttribute('open', '');
    });

    // Lid Type dropdown
    dom.lidOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        state.lidType = opt.dataset.lid;
        dom.lidOptions.forEach(o => o.classList.toggle('selected', o === opt));
        dom.lidDisplay.textContent = state.lidType === 'flat' ? tr('Plana') : tr('Nenhuma');
        dom.lidDetails.removeAttribute('open');
        rebuildAll();
      });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
      if (dom.thicknessDetails.open && !dom.thicknessDetails.contains(e.target)) {
        dom.thicknessDetails.removeAttribute('open');
      }
      if (dom.lidDetails.open && !dom.lidDetails.contains(e.target)) {
        dom.lidDetails.removeAttribute('open');
      }
    });

    // Dimension reference (Interna / Externa / Célula) — smoothly converts current display values
    dom.dimRefButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextRef = btn.dataset.dimRef;
        if (nextRef === state.dimRef || !currentModel) return;

        if (nextRef === 'outside') {
          state.widthMm = currentModel.outer.width;
          state.heightMm = currentModel.outer.height;
          state.depthMm = currentModel.outer.depth;
        } else if (nextRef === 'inside') {
          state.widthMm = currentModel.inner.width;
          state.heightMm = currentModel.inner.height;
          state.depthMm = currentModel.inner.depth;
        } else if (nextRef === 'cell') {
          state.widthMm = currentModel.cellAvg.width;
          state.heightMm = currentModel.cellAvg.height;
          state.depthMm = currentModel.cellAvg.depth;
          state.colWidthsMm = null;
          state.rowDepthsMm = null;
        }

        state.dimRef = nextRef;
        setActiveSegment(dom.dimRefButtons, 'dimRef', state.dimRef);
        syncDimensionInputs();
        rebuildAll();
      });
    });

    // Joint type (Plano / Dedo)
    dom.jointButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.joint = btn.dataset.joint;
        setActiveSegment(dom.jointButtons, 'joint', state.joint);
        rebuildAll();
      });
    });

    // Finger size slider
    dom.inputFingerSize.addEventListener('input', () => {
      const val = parseFloat(dom.inputFingerSize.value);
      if (!Number.isFinite(val)) return;
      state.fingerSizeMm = val;
      rebuildAll();
    });

    dom.fingerMinBtn.addEventListener('click', () => {
      if (!currentModel) return;
      state.fingerSizeMm = currentModel.finger.limits.min;
      rebuildAll();
    });

    dom.fingerMaxBtn.addEventListener('click', () => {
      if (!currentModel) return;
      state.fingerSizeMm = currentModel.finger.limits.max;
      rebuildAll();
    });

    // Download modal
    dom.btnOpenDownload.addEventListener('click', () => {
      dom.downloadModal.hidden = false;
      updateModalPreview();
    });

    dom.btnCloseDownload.addEventListener('click', () => {
      dom.downloadModal.hidden = true;
    });

    dom.downloadModal.addEventListener('click', e => {
      if (e.target === dom.downloadModal) dom.downloadModal.hidden = true;
    });

    // Help modal
    dom.btnHelp.addEventListener('click', () => { dom.helpModal.hidden = false; });
    dom.btnCloseHelp.addEventListener('click', () => { dom.helpModal.hidden = true; });
    dom.helpModal.addEventListener('click', e => {
      if (e.target === dom.helpModal) dom.helpModal.hidden = true;
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dom.downloadModal.hidden = true;
        dom.resizeModal.hidden = true;
        dom.helpModal.hidden = true;
      }
    });

    // Modal tabs
    dom.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        dom.tabButtons.forEach(b => {
          const active = b.dataset.tab === target;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        dom.tabPanels.forEach(p => {
          const active = p.dataset.tabPanel === target;
          p.classList.toggle('active', active);
          p.hidden = !active;
        });
      });
    });

    dom.labelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.labelsEnabled = btn.dataset.labels === 'enabled';
        setActiveSegment(dom.labelButtons, 'labels', btn.dataset.labels);
        dom.labelColorField.style.opacity = state.labelsEnabled ? '1' : '0.45';
        updateModalPreview();
      });
    });
    bindColorPair(dom.inputLabelColor, dom.pickerLabelColor, 'labelColor');

    dom.inputLineWidth.addEventListener('input', () => {
      const val = parseFloat(dom.inputLineWidth.value);
      if (Number.isFinite(val) && val > 0) {
        state.lineWidthMm = unitToMm(val);
        updateModalPreview();
      }
    });
    bindColorPair(dom.inputOuterColor, dom.pickerOuterColor, 'outerLineColor');
    bindColorPair(dom.inputInnerColor, dom.pickerInnerColor, 'innerLineColor');

    dom.compButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.compType = btn.dataset.comp;
        setActiveSegment(dom.compButtons, 'comp', state.compType);
        dom.compKerfField.hidden = state.compType !== 'kerf';
        dom.compCornerField.hidden = state.compType !== 'corner';
        updateModalPreview();
      });
    });

    dom.inputKerf.addEventListener('input', () => {
      const val = parseFloat(dom.inputKerf.value);
      if (Number.isFinite(val) && val >= 0) {
        state.kerfMm = unitToMm(val);
        updateModalPreview();
      }
    });

    dom.inputBitDiameter.addEventListener('input', () => {
      const val = parseFloat(dom.inputBitDiameter.value);
      if (Number.isFinite(val) && val > 0) {
        state.bitDiameterMm = unitToMm(val);
        updateModalPreview();
      }
    });

    dom.layoutButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.layoutMode = btn.dataset.layout;
        setActiveSegment(dom.layoutButtons, 'layout', state.layoutMode);
        dom.panelSpacingField.hidden = state.layoutMode === 'combine';
        updateModalPreview();
      });
    });

    dom.inputPanelSpacing.addEventListener('input', () => {
      const val = parseFloat(dom.inputPanelSpacing.value);
      if (Number.isFinite(val) && val >= 0) {
        state.panelSpacingMm = unitToMm(val);
        updateModalPreview();
      }
    });

    dom.outputButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.fileOutput = btn.dataset.output;
        setActiveSegment(dom.outputButtons, 'output', state.fileOutput);
        updateModalPreview();
      });
    });

    dom.inputFilename.addEventListener('input', () => {
      state.filenameEdited = dom.inputFilename.value.trim().length > 0;
    });

    dom.btnDownloadSvg.addEventListener('click', () => {
      if (!currentModel) return;
      global.BoxExporter.downloadExport(currentModel, getExportOptions(), 'svg');
    });

    dom.btnDownloadDxf.addEventListener('click', () => {
      if (!currentModel) return;
      global.BoxExporter.downloadExport(currentModel, getExportOptions(), 'dxf');
    });
  }

  function init() {
    cacheDom();
    renderer = new global.BoxRenderer3D(dom.canvas);
    if (!renderer.available) {
      dom.webglFallback.hidden = false;
    }
    syncDimensionInputs();
    bindEvents();
    rebuildAll();
    global.addEventListener('cncbox:langchange', () => {
      syncThicknessUI();
      dom.lidDisplay.textContent = state.lidType === 'flat' ? tr('Plana') : tr('Nenhuma');
      if (!dom.resizeModal.hidden) renderResizeGrid();
      rebuildAll();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
