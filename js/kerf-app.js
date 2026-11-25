/**
 * CNC Box — Kerf Bent Box UI Controller (Caixa Curvada: Aberta, Fechada & Com Tampa Curva)
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

  const MODE_LABELS = {
    open: 'Aberta',
    closed: 'Fechada',
    lid: 'Com Tampa'
  };

  const state = {
    unit: 'mm',
    widthMm: 156,
    heightMm: 78,
    depthMm: 206,
    thicknessMm: 3,
    customThickness: false,
    bendRadiusMm: 53,
    dimRef: 'outside',      // 'outside' | 'inside'
    enclosureMode: 'open',  // 'open' | 'closed' | 'lid'
    lidHeightMm: 25,
    lidClearanceMm: 0.5,
    lidRaised: false,
    bends: 4,               // 1 | 2 | 4
    stretchPct: 0,          // -10..10
    fingerSizeMm: 6.0,
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
    dom.panel = document.getElementById('kerf-box-ui');
    dom.btnTogglePanel = document.getElementById('btn-toggle-panel');
    dom.btnExplode = document.getElementById('btn-explode');
    dom.btnResetView = document.getElementById('btn-reset-view');
    dom.btnHelp = document.getElementById('btn-help');

    dom.unitButtons = document.querySelectorAll('[data-unit]');
    dom.dimRefButtons = document.querySelectorAll('[data-dim-ref]');
    dom.modeButtons = document.querySelectorAll('[data-mode]');
    dom.lidPosButtons = document.querySelectorAll('[data-lid-pos]');
    dom.bendsButtons = document.querySelectorAll('[data-bends]');
    dom.unitSuffixes = document.querySelectorAll('[data-unit-label]');

    dom.inputWidth = document.getElementById('input-width');
    dom.inputHeight = document.getElementById('input-height');
    dom.inputDepth = document.getElementById('input-depth');
    dom.inputRadius = document.getElementById('input-radius');
    dom.suggestedMinRadius = document.getElementById('suggested-min-radius');
    dom.minRadiusRow = document.getElementById('min-radius-row');

    dom.curvedLidSection = document.getElementById('curved-lid-section');
    dom.inputLidHeight = document.getElementById('input-lid-height');
    dom.inputLidClearance = document.getElementById('input-lid-clearance');

    dom.thicknessDropdownWrap = document.getElementById('thickness-dropdown-wrap');
    dom.thicknessDetails = document.getElementById('thickness-details');
    dom.thicknessDisplay = document.getElementById('thickness-display');
    dom.thicknessMenu = document.getElementById('thickness-menu');
    dom.thicknessCustomWrap = document.getElementById('thickness-custom-wrap');
    dom.inputThickness = document.getElementById('input-thickness');
    dom.btnThicknessPresets = document.getElementById('btn-thickness-presets');

    dom.validationMsg = document.getElementById('validation-msg');
    dom.radiusWarnMsg = document.getElementById('radius-warn-msg');

    dom.stretchMinBtn = document.getElementById('stretch-min-btn');
    dom.stretchMaxBtn = document.getElementById('stretch-max-btn');
    dom.inputStretch = document.getElementById('input-stretch');
    dom.stretchSliderFill = document.getElementById('stretch-slider-fill');
    dom.stretchThumbPill = document.getElementById('stretch-thumb-pill');

    dom.fingerMinBtn = document.getElementById('finger-min-btn');
    dom.fingerMaxBtn = document.getElementById('finger-max-btn');
    dom.inputFingerSize = document.getElementById('input-finger-size');
    dom.fingerSliderFill = document.getElementById('finger-slider-fill');
    dom.fingerThumbPill = document.getElementById('finger-thumb-pill');

    dom.hudOuter = document.getElementById('hud-outer');
    dom.hudBends = document.getElementById('hud-bends');
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
      btn.classList.toggle('active', btn.dataset[attr] === String(value));
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
    dom.inputRadius.step = step;
    dom.inputLidHeight.step = step;
    dom.inputLidClearance.step = state.unit === 'in' ? '0.01' : '0.1';

    dom.inputWidth.value = fmtUnit(state.widthMm);
    dom.inputHeight.value = fmtUnit(state.heightMm);
    dom.inputDepth.value = fmtUnit(state.depthMm);
    dom.inputRadius.value = fmtUnit(state.bendRadiusMm);
    dom.inputLidHeight.value = fmtUnit(state.lidHeightMm);
    dom.inputLidClearance.value = fmtUnit(state.lidClearanceMm);

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

  function syncSliders(model) {
    // Stretch slider (-10..+10%)
    dom.inputStretch.value = String(state.stretchPct);
    const stretchFrac = ((state.stretchPct + 10) / 20) * 100;
    dom.stretchSliderFill.style.width = `${stretchFrac}%`;
    dom.stretchThumbPill.style.left = `${stretchFrac}%`;
    dom.stretchThumbPill.textContent = `${state.stretchPct > 0 ? '+' : ''}${state.stretchPct}%`;

    // Finger size slider
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
  }

  function defaultFilename(model) {
    const u = state.unit;
    const dec = u === 'in' ? 2 : 0;
    const w = Number(mmToUnit(model.inner.width).toFixed(dec));
    const d = Number(mmToUnit(model.inner.depth).toFixed(dec));
    const h = Number(mmToUnit(model.inner.height).toFixed(dec));
    const t = Number(mmToUnit(model.thickness).toFixed(u === 'in' ? 3 : 1));
    const modeTag = model.mode === 'lid' ? '-com-tampa' : (model.mode === 'closed' ? '-fechada' : '');
    return `caixa-curvada-${w}x${d}x${h}-${t}${u}${modeTag}`;
  }

  function syncHud(model) {
    const dec = state.unit === 'in' ? 2 : 1;
    const u = state.unit;
    const o = model.outer;

    dom.suggestedMinRadius.textContent = fmtUnit(model.suggestedMinRadius);
    dom.curvedLidSection.hidden = state.enclosureMode !== 'lid';

    dom.hudOuter.textContent =
      `${fmtUnit(o.boxWidth, dec)} × ${fmtUnit(o.boxHeight, dec)} × ${fmtUnit(o.boxDepth, dec)} ${u}`;
    dom.hudBends.textContent = `${model.bends} (R${fmtUnit(o.boxRadius, dec)})`;
    dom.hudPanels.textContent = `${model.panels.length} (${tr('dyn.' + model.mode, MODE_LABELS[model.mode])})`;

    if (!model.valid) {
      dom.validationMsg.textContent = 'Dimensões muito pequenas para a espessura selecionada.';
      dom.validationMsg.hidden = false;
    } else {
      dom.validationMsg.hidden = true;
    }

    dom.radiusWarnMsg.hidden = !model.radiusWarning;
    dom.minRadiusRow.classList.toggle('is-warn', model.radiusWarning);
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
    currentModel = global.BoxGeometry.buildKerfBoxModel({
      width: state.widthMm,
      height: state.heightMm,
      depth: state.depthMm,
      thickness: state.thicknessMm,
      bendRadius: state.bendRadiusMm,
      dimRef: state.dimRef,
      enclosureMode: state.enclosureMode,
      lidHeight: state.lidHeightMm,
      lidClearance: state.lidClearanceMm,
      lidRaised: state.lidRaised,
      bends: state.bends,
      stretch: state.stretchPct / 100,
      fingerSize: state.fingerSizeMm
    });

    syncSliders(currentModel);
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
    function bindNumericDim(inputEl, stateKey, allowZero) {
      inputEl.addEventListener('input', () => {
        const val = parseFloat(inputEl.value);
        if (!Number.isFinite(val)) return;
        if (!allowZero && val <= 0) return;
        if (allowZero && val < 0) return;
        state[stateKey] = unitToMm(val);
        rebuildAll();
      });
      inputEl.addEventListener('blur', () => {
        inputEl.value = fmtUnit(state[stateKey]);
      });
    }

    bindNumericDim(dom.inputWidth, 'widthMm', false);
    bindNumericDim(dom.inputHeight, 'heightMm', false);
    bindNumericDim(dom.inputDepth, 'depthMm', false);
    bindNumericDim(dom.inputRadius, 'bendRadiusMm', false);
    bindNumericDim(dom.inputLidHeight, 'lidHeightMm', false);
    bindNumericDim(dom.inputLidClearance, 'lidClearanceMm', true);

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

    // Dim ref (Externo / Interno)
    dom.dimRefButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextRef = btn.dataset.dimRef;
        if (nextRef === state.dimRef || !currentModel) return;
        if (nextRef === 'inside') {
          state.widthMm = currentModel.inner.width;
          state.heightMm = currentModel.inner.height;
          state.depthMm = currentModel.inner.depth;
          state.bendRadiusMm = currentModel.inner.radius;
        } else {
          state.widthMm = currentModel.outer.boxWidth;
          state.heightMm = currentModel.outer.boxHeight;
          state.depthMm = currentModel.outer.boxDepth;
          state.bendRadiusMm = currentModel.outer.boxRadius;
        }
        state.dimRef = nextRef;
        setActiveSegment(dom.dimRefButtons, 'dimRef', state.dimRef);
        syncDimensionInputs();
        rebuildAll();
      });
    });

    // 3-way Mode: Aberta / Fechada / Com Tampa
    dom.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextMode = btn.dataset.mode;
        if (nextMode === state.enclosureMode || !currentModel) return;
        const prevClosed = state.enclosureMode === 'closed';
        const nextClosed = nextMode === 'closed';
        state.enclosureMode = nextMode;
        setActiveSegment(dom.modeButtons, 'mode', state.enclosureMode);

        // Preserve internal height when switching between Fechada (2T) and Aberta/Com Tampa (1T) in Externo mode
        if (state.dimRef === 'outside' && prevClosed !== nextClosed) {
          state.heightMm = currentModel.inner.height + (nextClosed ? 2 * state.thicknessMm : state.thicknessMm);
          dom.inputHeight.value = fmtUnit(state.heightMm);
        }
        rebuildAll();
      });
    });

    // Curved Lid 3D position (Encaixada / Levantada)
    dom.lidPosButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.lidRaised = btn.dataset.lidPos === 'raised';
        setActiveSegment(dom.lidPosButtons, 'lidPos', btn.dataset.lidPos);
        rebuildAll();
      });
    });

    // Number of bends (1 / 2 / 4)
    dom.bendsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.bends = Number(btn.dataset.bends);
        setActiveSegment(dom.bendsButtons, 'bends', state.bends);
        rebuildAll();
      });
    });

    // Stretch slider (-10..+10%)
    dom.inputStretch.addEventListener('input', () => {
      const val = parseFloat(dom.inputStretch.value);
      if (Number.isFinite(val)) {
        state.stretchPct = val;
        rebuildAll();
      }
    });
    dom.stretchMinBtn.addEventListener('click', () => { state.stretchPct = -10; rebuildAll(); });
    dom.stretchMaxBtn.addEventListener('click', () => { state.stretchPct = 10; rebuildAll(); });

    // Finger size slider
    dom.inputFingerSize.addEventListener('input', () => {
      const val = parseFloat(dom.inputFingerSize.value);
      if (Number.isFinite(val)) {
        state.fingerSizeMm = val;
        rebuildAll();
      }
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
    dom.btnCloseDownload.addEventListener('click', () => { dom.downloadModal.hidden = true; });
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
