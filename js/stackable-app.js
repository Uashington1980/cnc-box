/**
 * CNC Box — Stackable Parts Bin UI Controller (Caixa Empilhável para Peças)
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
    widthMm: 111,
    heightMm: 83,
    depthMm: 111,
    thicknessMm: 3,
    customThickness: false,
    lipHeightMm: 36,
    rowCount: 1,
    colCount: 1,
    quantity: 1,
    dimRef: 'outside',
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
    dom.panel = document.getElementById('stackable-bin-ui');
    dom.btnTogglePanel = document.getElementById('btn-toggle-panel');
    dom.btnExplode = document.getElementById('btn-explode');
    dom.btnResetView = document.getElementById('btn-reset-view');
    dom.btnHelp = document.getElementById('btn-help');

    dom.unitButtons = document.querySelectorAll('[data-unit]');
    dom.dimRefButtons = document.querySelectorAll('[data-dim-ref]');
    dom.unitSuffixes = document.querySelectorAll('[data-unit-label]');

    dom.inputWidth = document.getElementById('input-width');
    dom.inputHeight = document.getElementById('input-height');
    dom.inputDepth = document.getElementById('input-depth');
    dom.inputLipHeight = document.getElementById('input-lip-height');

    dom.inputRows = document.getElementById('input-rows');
    dom.btnRowsDec = document.getElementById('btn-rows-dec');
    dom.btnRowsInc = document.getElementById('btn-rows-inc');

    dom.inputCols = document.getElementById('input-cols');
    dom.btnColsDec = document.getElementById('btn-cols-dec');
    dom.btnColsInc = document.getElementById('btn-cols-inc');

    dom.inputQuantity = document.getElementById('input-quantity');
    dom.btnQtyDec = document.getElementById('btn-qty-dec');
    dom.btnQtyInc = document.getElementById('btn-qty-inc');

    dom.thicknessDropdownWrap = document.getElementById('thickness-dropdown-wrap');
    dom.thicknessDetails = document.getElementById('thickness-details');
    dom.thicknessDisplay = document.getElementById('thickness-display');
    dom.thicknessMenu = document.getElementById('thickness-menu');
    dom.thicknessCustomWrap = document.getElementById('thickness-custom-wrap');
    dom.inputThickness = document.getElementById('input-thickness');
    dom.btnThicknessPresets = document.getElementById('btn-thickness-presets');

    dom.validationMsg = document.getElementById('validation-msg');

    dom.hudOuter = document.getElementById('hud-outer');
    dom.hudBatch = document.getElementById('hud-batch');
    dom.hudPanels = document.getElementById('hud-panels');

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
    dom.inputLipHeight.step = step;

    dom.inputWidth.value = fmtUnit(state.widthMm);
    dom.inputHeight.value = fmtUnit(state.heightMm);
    dom.inputDepth.value = fmtUnit(state.depthMm);
    dom.inputLipHeight.value = fmtUnit(state.lipHeightMm);

    dom.inputRows.value = String(state.rowCount);
    dom.inputCols.value = String(state.colCount);
    dom.inputQuantity.value = String(state.quantity);

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

  function defaultFilename(model) {
    const u = state.unit;
    const dec = u === 'in' ? 2 : 0;
    const w = Number(mmToUnit(model.outer.width).toFixed(dec));
    const d = Number(mmToUnit(model.outer.depth).toFixed(dec));
    const h = Number(mmToUnit(model.outer.singleHeight).toFixed(dec));
    const t = Number(mmToUnit(model.thickness).toFixed(u === 'in' ? 3 : 1));
    const qtyTag = model.quantity > 1 ? `-x${model.quantity}` : '';
    return `caixa-empilhavel-${w}x${d}x${h}-${t}${u}${qtyTag}`;
  }

  function syncHud(model) {
    const dec = state.unit === 'in' ? 2 : 1;
    const u = state.unit;
    const o = model.outer;

    dom.hudOuter.textContent = `${fmtUnit(o.width, dec)} × ${fmtUnit(o.singleHeight, dec)} × ${fmtUnit(o.depth, dec)} ${u}`;
    dom.hudBatch.textContent = `${model.quantity} ${tr('dyn.units')} (${model.rows}×${model.cols})`;
    dom.hudPanels.textContent = `${model.panels.length}`;

    if (!model.valid) {
      dom.validationMsg.textContent = 'Dimensões muito pequenas para a espessura ou divisórias escolhidas.';
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

    dom.downloadCaption.textContent = state.fileOutput === 'separate'
      ? tr('dyn.captionSeparate')
      : tr('dyn.captionSingle');
  }

  function rebuildAll() {
    currentModel = global.BoxGeometry.buildStackableBinModel({
      width: state.widthMm,
      height: state.heightMm,
      depth: state.depthMm,
      thickness: state.thicknessMm,
      lipHeight: state.lipHeightMm,
      rowCount: state.rowCount,
      colCount: state.colCount,
      quantity: state.quantity,
      dimRef: state.dimRef
    });

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

  function bindStepper(inputEl, decBtn, incBtn, stateKey, minVal, maxVal) {
    function setVal(v) {
      const clamped = Math.max(minVal, Math.min(maxVal, Math.round(v)));
      state[stateKey] = clamped;
      inputEl.value = String(clamped);
      rebuildAll();
    }
    inputEl.addEventListener('input', () => {
      const v = parseInt(inputEl.value, 10);
      if (Number.isFinite(v) && v >= minVal && v <= maxVal) {
        state[stateKey] = v;
        rebuildAll();
      }
    });
    inputEl.addEventListener('blur', () => {
      const v = parseInt(inputEl.value, 10);
      setVal(Number.isFinite(v) ? v : state[stateKey]);
    });
    decBtn.addEventListener('click', () => setVal(state[stateKey] - 1));
    incBtn.addEventListener('click', () => setVal(state[stateKey] + 1));
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

    // Numeric dimension inputs
    function bindNumericDim(inputEl, stateKey) {
      inputEl.addEventListener('input', () => {
        const val = parseFloat(inputEl.value);
        if (!Number.isFinite(val) || val <= 0) return;
        state[stateKey] = unitToMm(val);
        rebuildAll();
      });
      inputEl.addEventListener('blur', () => {
        inputEl.value = fmtUnit(state[stateKey]);
      });
    }

    bindNumericDim(dom.inputWidth, 'widthMm');
    bindNumericDim(dom.inputHeight, 'heightMm');
    bindNumericDim(dom.inputDepth, 'depthMm');
    bindNumericDim(dom.inputLipHeight, 'lipHeightMm');

    // Steppers for Rows, Cols, Quantity
    bindStepper(dom.inputRows, dom.btnRowsDec, dom.btnRowsInc, 'rowCount', 1, 8);
    bindStepper(dom.inputCols, dom.btnColsDec, dom.btnColsInc, 'colCount', 1, 8);
    bindStepper(dom.inputQuantity, dom.btnQtyDec, dom.btnQtyInc, 'quantity', 1, 6);

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

    document.addEventListener('click', e => {
      if (dom.thicknessDetails.open && !dom.thicknessDetails.contains(e.target)) {
        dom.thicknessDetails.removeAttribute('open');
      }
    });

    // Dim ref (Externo / Interno) — converts W by ±2T, H by ±T, D by ±2T (lipHeight stays unchanged)
    dom.dimRefButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextRef = btn.dataset.dimRef;
        if (nextRef === state.dimRef || !currentModel) return;
        const T = state.thicknessMm;
        if (nextRef === 'inside') {
          state.widthMm = Math.max(10, state.widthMm - 2 * T);
          state.heightMm = Math.max(10, state.heightMm - T);
          state.depthMm = Math.max(10, state.depthMm - 2 * T);
        } else {
          state.widthMm = state.widthMm + 2 * T;
          state.heightMm = state.heightMm + T;
          state.depthMm = state.depthMm + 2 * T;
        }
        state.dimRef = nextRef;
        setActiveSegment(dom.dimRefButtons, 'dimRef', state.dimRef);
        syncDimensionInputs();
        rebuildAll();
      });
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
      rebuildAll();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
