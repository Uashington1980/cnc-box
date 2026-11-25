/**
 * CNC Box Geometry Engine — Basic Box & Grid Divider Box (FLAT & FINGER only — no T-SLOT)
 * Pure JS, zero dependencies, exact millimeter coordinate math.
 */
(function (global) {
  'use strict';

  const EPS = 1e-6;

  /**
   * Remove duplicate consecutive points and collinear intermediate vertices
   * from a closed polygon array.
   */
  function cleanPolygon(rawPoints) {
    const pts = [];
    for (let i = 0; i < rawPoints.length; i++) {
      const p = rawPoints[i];
      if (pts.length === 0) {
        pts.push({ x: p.x, y: p.y });
      } else {
        const prev = pts[pts.length - 1];
        if (Math.hypot(p.x - prev.x, p.y - prev.y) > EPS) {
          pts.push({ x: p.x, y: p.y });
        }
      }
    }
    if (pts.length > 1) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (Math.hypot(first.x - last.x, first.y - last.y) <= EPS) {
        pts.pop();
      }
    }

    let changed = true;
    while (changed && pts.length >= 3) {
      changed = false;
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[(i - 1 + pts.length) % pts.length];
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;
        const cross = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(cross) <= EPS) {
          pts.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    return pts;
  }

  /**
   * Compute signed area of polygon (positive => CCW in Y-up coordinates).
   */
  function signedArea(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    return area * 0.5;
  }

  function ensureCCW(pts) {
    const cleaned = cleanPolygon(pts);
    if (signedArea(cleaned) < 0) cleaned.reverse();
    return cleaned;
  }

  function ensureCW(pts) {
    const cleaned = cleanPolygon(pts);
    if (signedArea(cleaned) > 0) cleaned.reverse();
    return cleaned;
  }

  function getBBox(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function calcOddFingerCount(span, targetSize) {
    if (span <= EPS || targetSize <= EPS) return 3;
    const ideal = span / targetSize;
    let n = Math.max(3, Math.round(ideal));
    if (n % 2 === 0) {
      n = ideal >= n ? n + 1 : Math.max(3, n - 1);
    }
    return n;
  }

  function computeFingerLimits(outerW, outerH, outerD, T, isClosed) {
    const innerW = Math.max(1, outerW - 2 * T);
    const innerD = Math.max(1, outerD - 2 * T);
    const innerH = Math.max(1, outerH - (isClosed ? 2 * T : T));
    const minSpan = Math.min(innerW, innerD, innerH);
    const min = Math.max(1.5, Math.min(2 * T, minSpan / 3));
    const max = Math.max(min + 0.5, minSpan / 2);
    return {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2))
    };
  }

  function buildRect(x0, y0, x1, y1) {
    return ensureCCW([
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 }
    ]);
  }

  function buildRectHoleCW(x0, y0, x1, y1) {
    return ensureCW([
      { x: x0, y: y0 },
      { x: x0, y: y1 },
      { x: x1, y: y1 },
      { x: x1, y: y0 }
    ]);
  }

  /**
   * Top / Bottom panel polygon in FINGER mode.
   */
  function buildFingerHorizontalPanel(W, D, T, nX, nZ) {
    const sX = (W - 2 * T) / nX;
    const sZ = (D - 2 * T) / nZ;
    const pts = [];

    pts.push({ x: 0, y: 0 });
    for (let i = 0; i < nX; i++) {
      const u0 = T + i * sX;
      const u1 = T + (i + 1) * sX;
      const v = (i % 2 === 0) ? 0 : T;
      pts.push({ x: u0, y: v }, { x: u1, y: v });
    }
    pts.push({ x: W, y: 0 });

    for (let i = 0; i < nZ; i++) {
      const v0 = T + i * sZ;
      const v1 = T + (i + 1) * sZ;
      const u = (i % 2 === 0) ? W : W - T;
      pts.push({ x: u, y: v0 }, { x: u, y: v1 });
    }
    pts.push({ x: W, y: D });

    for (let i = nX - 1; i >= 0; i--) {
      const u1 = T + (i + 1) * sX;
      const u0 = T + i * sX;
      const v = (i % 2 === 0) ? D : D - T;
      pts.push({ x: u1, y: v }, { x: u0, y: v });
    }
    pts.push({ x: 0, y: D });

    for (let i = nZ - 1; i >= 0; i--) {
      const v1 = T + (i + 1) * sZ;
      const v0 = T + i * sZ;
      const u = (i % 2 === 0) ? 0 : T;
      pts.push({ x: u, y: v1 }, { x: u, y: v0 });
    }

    return ensureCCW(pts);
  }

  /**
   * Append top-edge points moving right-to-left (from uRight -> uLeft at v = H),
   * optionally carving vertical U-slots down to vSlotBottom at each center in topSlotCenters.
   */
  function pushOpenTopEdge(pts, uRight, uLeft, H, T, topSlotCenters, vSlotBottom) {
    pts.push({ x: uRight, y: H });
    if (topSlotCenters && topSlotCenters.length > 0) {
      const sortedDesc = topSlotCenters.slice().sort((a, b) => b - a);
      for (let i = 0; i < sortedDesc.length; i++) {
        const c = sortedDesc[i];
        const uR = c + T * 0.5;
        const uL = c - T * 0.5;
        if (uL > uLeft + EPS && uR < uRight - EPS) {
          pts.push({ x: uR, y: H });
          pts.push({ x: uR, y: vSlotBottom });
          pts.push({ x: uL, y: vSlotBottom });
          pts.push({ x: uL, y: H });
        }
      }
    }
    pts.push({ x: uLeft, y: H });
  }

  /**
   * Front / Back panel polygon in FINGER mode.
   * Supports optional top-open U-slots (for open-top divider box).
   */
  function buildFingerFrontBackPanel(W, H, T, nX, nY, isClosed, topSlotCenters) {
    const sX = (W - 2 * T) / nX;
    const vTop = isClosed ? (H - T) : H;
    const sY = (vTop - T) / nY;
    const vMid = T + (H - T) * 0.5;
    const pts = [];

    // Bottom edge: u from T -> W - T
    pts.push({ x: T, y: T });
    for (let i = 0; i < nX; i++) {
      const u0 = T + i * sX;
      const u1 = T + (i + 1) * sX;
      const v = (i % 2 === 0) ? T : 0;
      pts.push({ x: u0, y: v }, { x: u1, y: v });
    }
    pts.push({ x: W - T, y: T });

    // Right edge: v from T -> vTop
    for (let i = 0; i < nY; i++) {
      const v0 = T + i * sY;
      const v1 = T + (i + 1) * sY;
      const u = (i % 2 === 0) ? W : W - T;
      pts.push({ x: u, y: v0 }, { x: u, y: v1 });
    }

    // Top edge: u from W -> 0
    if (isClosed) {
      pts.push({ x: W - T, y: H - T });
      for (let i = nX - 1; i >= 0; i--) {
        const u1 = T + (i + 1) * sX;
        const u0 = T + i * sX;
        const v = (i % 2 === 0) ? H - T : H;
        pts.push({ x: u1, y: v }, { x: u0, y: v });
      }
      pts.push({ x: T, y: H - T });
    } else {
      pushOpenTopEdge(pts, W, 0, H, T, topSlotCenters, vMid);
    }

    // Left edge: v from vTop -> T
    for (let i = nY - 1; i >= 0; i--) {
      const v1 = T + (i + 1) * sY;
      const v0 = T + i * sY;
      const u = (i % 2 === 0) ? 0 : T;
      pts.push({ x: u, y: v1 }, { x: u, y: v0 });
    }

    return ensureCCW(pts);
  }

  /**
   * Left / Right panel polygon in FINGER mode.
   * Supports optional top-open U-slots (for open-top divider box).
   */
  function buildFingerLeftRightPanel(D, H, T, nZ, nY, isClosed, topSlotCenters) {
    const sZ = (D - 2 * T) / nZ;
    const vTop = isClosed ? (H - T) : H;
    const sY = (vTop - T) / nY;
    const vMid = T + (H - T) * 0.5;
    const pts = [];

    // Bottom edge: u from T -> D - T
    pts.push({ x: T, y: T });
    for (let i = 0; i < nZ; i++) {
      const u0 = T + i * sZ;
      const u1 = T + (i + 1) * sZ;
      const v = (i % 2 === 0) ? T : 0;
      pts.push({ x: u0, y: v }, { x: u1, y: v });
    }
    pts.push({ x: D - T, y: T });

    // Right edge: v from T -> vTop
    for (let i = 0; i < nY; i++) {
      const v0 = T + i * sY;
      const v1 = T + (i + 1) * sY;
      const u = (i % 2 === 0) ? D - T : D;
      pts.push({ x: u, y: v0 }, { x: u, y: v1 });
    }

    // Top edge: u from D - T -> T
    if (isClosed) {
      pts.push({ x: D - T, y: H - T });
      for (let i = nZ - 1; i >= 0; i--) {
        const u1 = T + (i + 1) * sZ;
        const u0 = T + i * sZ;
        const v = (i % 2 === 0) ? H - T : H;
        pts.push({ x: u1, y: v }, { x: u0, y: v });
      }
      pts.push({ x: T, y: H - T });
    } else {
      pushOpenTopEdge(pts, D - T, T, H, T, topSlotCenters, vMid);
    }

    // Left edge: v from vTop -> T
    for (let i = nY - 1; i >= 0; i--) {
      const v1 = T + (i + 1) * sY;
      const v0 = T + i * sY;
      const u = (i % 2 === 0) ? T : 0;
      pts.push({ x: u, y: v1 }, { x: u, y: v0 });
    }

    return ensureCCW(pts);
  }

  /**
   * Build a Row Divider (runs along X, u in [0, W], v in [T, vTop])
   * or Column Divider (runs along Z, u in [0, D], v in [T, vTop]).
   *
   * - crossSlotCenters: positions along u where perpendicular dividers intersect.
   * - notchFrom: 'bottom' (row dividers: slots go [vBot -> vMid]) or
   *              'top' (column dividers: slots go [vTop -> vMid]).
   * - endTabMode:
   *     'none'   -> FLAT mode (butts at u = T and u = span - T)
   *     'top'    -> FINGER + open top (upper-half drop-in tab [vMid -> vTop] into outer wall U-slot)
   *     'center' -> FINGER + flat lid (centered tab [vBot + 0.25*hIn -> vBot + 0.75*hIn] into wall mortise)
   */
  function buildDividerPanel(span, H, T, isClosed, crossSlotCenters, notchFrom, endTabMode) {
    const vBot = T;
    const vTop = isClosed ? (H - T) : H;
    const hIn = vTop - vBot;
    const vMid = vBot + hIn * 0.5;
    const tabBot = vBot + hIn * 0.25;
    const tabTop = vBot + hIn * 0.75;

    const uInL = T;
    const uInR = span - T;
    const sortedAsc = (crossSlotCenters || []).slice().sort((a, b) => a - b);
    const sortedDesc = sortedAsc.slice().reverse();

    const pts = [];

    // 1. Bottom edge: left -> right (uInL -> uInR at vBot)
    pts.push({ x: uInL, y: vBot });
    if (notchFrom === 'bottom') {
      for (let i = 0; i < sortedAsc.length; i++) {
        const c = sortedAsc[i];
        const uL = c - T * 0.5;
        const uR = c + T * 0.5;
        if (uL > uInL + EPS && uR < uInR - EPS) {
          pts.push({ x: uL, y: vBot });
          pts.push({ x: uL, y: vMid });
          pts.push({ x: uR, y: vMid });
          pts.push({ x: uR, y: vBot });
        }
      }
    }
    pts.push({ x: uInR, y: vBot });

    // 2. Right end: bottom -> top (vBot -> vTop)
    if (endTabMode === 'top') {
      pts.push({ x: uInR, y: vMid });
      pts.push({ x: span, y: vMid });
      pts.push({ x: span, y: vTop });
    } else if (endTabMode === 'center') {
      pts.push({ x: uInR, y: tabBot });
      pts.push({ x: span, y: tabBot });
      pts.push({ x: span, y: tabTop });
      pts.push({ x: uInR, y: tabTop });
      pts.push({ x: uInR, y: vTop });
    } else {
      pts.push({ x: uInR, y: vTop });
    }

    // 3. Top edge: right -> left (vTop)
    const uTopL = endTabMode === 'top' ? 0 : uInL;
    if (notchFrom === 'top') {
      for (let i = 0; i < sortedDesc.length; i++) {
        const c = sortedDesc[i];
        const uR = c + T * 0.5;
        const uL = c - T * 0.5;
        if (uL > uInL + EPS && uR < uInR - EPS) {
          pts.push({ x: uR, y: vTop });
          pts.push({ x: uR, y: vMid });
          pts.push({ x: uL, y: vMid });
          pts.push({ x: uL, y: vTop });
        }
      }
    }
    pts.push({ x: uTopL, y: vTop });

    // 4. Left end: top -> bottom (vTop -> vBot)
    if (endTabMode === 'top') {
      pts.push({ x: 0, y: vMid });
      pts.push({ x: uInL, y: vMid });
    } else if (endTabMode === 'center') {
      pts.push({ x: uInL, y: tabTop });
      pts.push({ x: 0, y: tabTop });
      pts.push({ x: 0, y: tabBot });
      pts.push({ x: uInL, y: tabBot });
    }

    return ensureCCW(pts);
  }

  /**
   * Create a standardized panel object (supports optional CW interior holes).
   */
  function createPanelObject(id, label, category, localPts, localHoles, T, mapPoint3D, explodeDir) {
    const bbox = getBBox(localPts);
    const outline2D = localPts.map(p => ({
      x: p.x - bbox.minX,
      y: p.y - bbox.minY
    }));
    const holesLocal = (localHoles || []).map(h => ensureCW(h));
    const holes2D = holesLocal.map(h =>
      h.map(p => ({ x: p.x - bbox.minX, y: p.y - bbox.minY }))
    );

    return {
      id,
      label,
      category,
      localPts,
      localHoles: holesLocal,
      outline2D,
      holes2D,
      bbox,
      width: bbox.width,
      height: bbox.height,
      thickness: T,
      mapPoint3D,
      explodeDir
    };
  }

  /**
   * Build the Basic Box model (FLAT & FINGER).
   */
  function buildBoxModel(params) {
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const isClosed = params.enclosure === 'closed';
    const isOutside = params.dimRef !== 'inside';
    const joint = params.joint === 'flat' ? 'flat' : 'finger';

    const rawW = Math.max(1, Number(params.width) || 100);
    const rawH = Math.max(1, Number(params.height) || 50);
    const rawD = Math.max(1, Number(params.depth) || 100);

    const outerW = isOutside ? rawW : rawW + 2 * T;
    const outerD = isOutside ? rawD : rawD + 2 * T;
    const outerH = isOutside ? rawH : rawH + (isClosed ? 2 * T : T);

    const innerW = outerW - 2 * T;
    const innerD = outerD - 2 * T;
    const innerH = outerH - (isClosed ? 2 * T : T);

    const minInner = Math.max(3, T * 1.5);
    const valid = innerW >= minInner && innerD >= minInner && innerH >= minInner;

    const W = Math.max(outerW, 2 * T + minInner);
    const D = Math.max(outerD, 2 * T + minInner);
    const H = Math.max(outerH, (isClosed ? 2 * T : T) + minInner);

    const fingerLimits = computeFingerLimits(W, H, D, T, isClosed);
    const clampedFinger = Math.min(
      fingerLimits.max,
      Math.max(fingerLimits.min, Number(params.fingerSize) || 9)
    );

    const nX = calcOddFingerCount(W - 2 * T, clampedFinger);
    const nZ = calcOddFingerCount(D - 2 * T, clampedFinger);
    const nY = calcOddFingerCount(H - (isClosed ? 2 * T : T), clampedFinger);

    const horizPts = joint === 'flat'
      ? buildRect(0, 0, W, D)
      : buildFingerHorizontalPanel(W, D, T, nX, nZ);

    const frontBackPts = joint === 'flat'
      ? buildRect(0, T, W, isClosed ? H - T : H)
      : buildFingerFrontBackPanel(W, H, T, nX, nY, isClosed, null);

    const leftRightPts = joint === 'flat'
      ? buildRect(T, T, D - T, isClosed ? H - T : H)
      : buildFingerLeftRightPanel(D, H, T, nZ, nY, isClosed, null);

    const panels = [];
    if (isClosed) {
      panels.push(createPanelObject(
        'superior', 'Superior', 'outer', horizPts, [], T,
        (u, v, w) => [u - W / 2, H / 2 - T / 2 + w, D / 2 - v],
        [0, 1, 0]
      ));
    }

    panels.push(createPanelObject(
      'fundo', 'Fundo', 'outer', horizPts, [], T,
      (u, v, w) => [u - W / 2, -H / 2 + T / 2 + w, D / 2 - v],
      [0, -1, 0]
    ));

    panels.push(createPanelObject(
      'frente', 'Frente', 'outer', frontBackPts, [], T,
      (u, v, w) => [u - W / 2, v - H / 2, D / 2 - T / 2 + w],
      [0, 0, 1]
    ));

    panels.push(createPanelObject(
      'traseira', 'Traseira', 'outer', frontBackPts, [], T,
      (u, v, w) => [W / 2 - u, v - H / 2, -D / 2 + T / 2 - w],
      [0, 0, -1]
    ));

    panels.push(createPanelObject(
      'esquerda', 'Esquerda', 'outer', leftRightPts, [], T,
      (u, v, w) => [-W / 2 + T / 2 - w, v - H / 2, u - D / 2],
      [-1, 0, 0]
    ));

    panels.push(createPanelObject(
      'direita', 'Direita', 'outer', leftRightPts, [], T,
      (u, v, w) => [W / 2 - T / 2 + w, v - H / 2, D / 2 - u],
      [1, 0, 0]
    ));

    return {
      type: 'basic',
      valid,
      joint,
      isClosed,
      thickness: T,
      outer: { width: W, height: H, depth: D },
      inner: {
        width: W - 2 * T,
        height: H - (isClosed ? 2 * T : T),
        depth: D - 2 * T
      },
      finger: {
        size: clampedFinger,
        limits: fingerLimits,
        counts: { x: nX, y: nY, z: nZ }
      },
      panels
    };
  }

  /**
   * Build a Slip-Over Box Lid model (Tampa de Caixa — FLAT & FINGER only).
   * Always dimensioned from the INSIDE (width = inner width, depth = inner length,
   * height = inner skirt height) and always closed on TOP with an open flush rim on BOTTOM.
   */
  function buildLidModel(params) {
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const joint = params.joint === 'flat' ? 'flat' : 'finger';

    const rawInW = Math.max(1, Number(params.width) || 100);
    const rawInD = Math.max(1, Number(params.depth) || 100);
    const rawInH = Math.max(1, Number(params.height) || 20);

    const minInnerWD = Math.max(4, T * 2);
    const minInnerH = Math.max(3, T * 1.5);
    const valid = rawInW >= minInnerWD && rawInD >= minInnerWD && rawInH >= minInnerH;

    const innerW = Math.max(rawInW, minInnerWD);
    const innerD = Math.max(rawInD, minInnerWD);
    const innerH = Math.max(rawInH, minInnerH);

    const W = innerW + 2 * T;
    const D = innerD + 2 * T;
    const H = innerH + T;

    const fingerLimits = computeFingerLimits(W, H, D, T, false);
    const clampedFinger = Math.min(
      fingerLimits.max,
      Math.max(fingerLimits.min, Number(params.fingerSize) || 9)
    );

    const nX = calcOddFingerCount(innerW, clampedFinger);
    const nZ = calcOddFingerCount(innerD, clampedFinger);
    const nY = calcOddFingerCount(innerH, clampedFinger);

    // Mirror vertical coordinate v -> H - v so the closed cap sits on TOP (v = H)
    // and the open flush rim sits at the BOTTOM (v = 0).
    function flipVertical(pts) {
      return ensureCCW(pts.map(p => ({ x: p.x, y: H - p.y })));
    }

    const topPts = joint === 'flat'
      ? buildRect(0, 0, W, D)
      : buildFingerHorizontalPanel(W, D, T, nX, nZ);

    const openFrontBack = joint === 'flat'
      ? buildRect(0, T, W, H)
      : buildFingerFrontBackPanel(W, H, T, nX, nY, false, null);

    const openLeftRight = joint === 'flat'
      ? buildRect(T, T, D - T, H)
      : buildFingerLeftRightPanel(D, H, T, nZ, nY, false, null);

    const frontBackPts = flipVertical(openFrontBack);
    const leftRightPts = flipVertical(openLeftRight);

    const panels = [
      createPanelObject(
        'superior', 'Superior', 'outer', topPts, [], T,
        (u, v, w) => [u - W / 2, H / 2 - T / 2 + w, D / 2 - v],
        [0, 1.15, 0]
      ),
      createPanelObject(
        'frente', 'Frente', 'outer', frontBackPts, [], T,
        (u, v, w) => [u - W / 2, v - H / 2, D / 2 - T / 2 + w],
        [0, 0, 1]
      ),
      createPanelObject(
        'traseira', 'Traseira', 'outer', frontBackPts, [], T,
        (u, v, w) => [W / 2 - u, v - H / 2, -D / 2 + T / 2 - w],
        [0, 0, -1]
      ),
      createPanelObject(
        'esquerda', 'Esquerda', 'outer', leftRightPts, [], T,
        (u, v, w) => [-W / 2 + T / 2 - w, v - H / 2, u - D / 2],
        [-1, 0, 0]
      ),
      createPanelObject(
        'direita', 'Direita', 'outer', leftRightPts, [], T,
        (u, v, w) => [W / 2 - T / 2 + w, v - H / 2, D / 2 - u],
        [1, 0, 0]
      )
    ];

    return {
      type: 'lid',
      valid,
      joint,
      isClosed: false,
      thickness: T,
      outer: { width: W, height: H, depth: D },
      inner: { width: innerW, height: innerH, depth: innerD },
      finger: {
        size: clampedFinger,
        limits: fingerLimits,
        counts: { x: nX, y: nY, z: nZ }
      },
      panels
    };
  }

  /**
   * Build the Grid Divider Box model (Caixa Divisória em Grade — FLAT & FINGER only).
   * Supports:
   * - rowCount (1..12) and colCount (1..12)
   * - custom unequal colWidths / rowDepths arrays (in mm)
   * - dimRef: 'outside' | 'inside' | 'cell'
   * - lidType: 'none' | 'flat'
   * - joint: 'flat' | 'finger'
   */
  function buildDividerBoxModel(params) {
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const isClosed = params.lidType === 'flat';
    const joint = params.joint === 'flat' ? 'flat' : 'finger';
    const dimRef = params.dimRef || 'outside';

    const rows = Math.max(1, Math.min(12, Math.round(Number(params.rowCount) || 3)));
    const cols = Math.max(1, Math.min(12, Math.round(Number(params.colCount) || 3)));

    const rawW = Math.max(1, Number(params.width) || 150);
    const rawH = Math.max(1, Number(params.height) || 50);
    const rawD = Math.max(1, Number(params.depth) || 100);

    let outerW, outerH, outerD;
    if (dimRef === 'inside') {
      outerW = rawW + 2 * T;
      outerD = rawD + 2 * T;
      outerH = rawH + (isClosed ? 2 * T : T);
    } else if (dimRef === 'cell') {
      outerW = cols * rawW + (cols + 1) * T;
      outerD = rows * rawD + (rows + 1) * T;
      outerH = rawH + (isClosed ? 2 * T : T);
    } else {
      outerW = rawW;
      outerD = rawD;
      outerH = rawH;
    }

    const minCell = Math.max(4, T * 2);
    const minOuterW = cols * minCell + (cols + 1) * T;
    const minOuterD = rows * minCell + (rows + 1) * T;
    const minOuterH = (isClosed ? 2 * T : T) + Math.max(6, T * 2.5);

    const valid = outerW >= minOuterW && outerD >= minOuterD && outerH >= minOuterH;

    const W = Math.max(outerW, minOuterW);
    const D = Math.max(outerD, minOuterD);
    const H = Math.max(outerH, minOuterH);

    const innerW = W - 2 * T;
    const innerD = D - 2 * T;
    const innerH = H - (isClosed ? 2 * T : T);

    // Resolve individual column widths and row depths (equal or custom-resized)
    const availW = innerW - (cols - 1) * T;
    const availD = innerD - (rows - 1) * T;

    let colWidths;
    if (Array.isArray(params.colWidths) && params.colWidths.length === cols) {
      const sum = params.colWidths.reduce((s, v) => s + Math.max(minCell, Number(v) || minCell), 0);
      const scale = availW / Math.max(EPS, sum);
      colWidths = params.colWidths.map(v => Math.max(minCell, Number(v) || minCell) * scale);
    } else {
      colWidths = new Array(cols).fill(availW / cols);
    }

    let rowDepths;
    if (Array.isArray(params.rowDepths) && params.rowDepths.length === rows) {
      const sum = params.rowDepths.reduce((s, v) => s + Math.max(minCell, Number(v) || minCell), 0);
      const scale = availD / Math.max(EPS, sum);
      rowDepths = params.rowDepths.map(v => Math.max(minCell, Number(v) || minCell) * scale);
    } else {
      rowDepths = new Array(rows).fill(availD / rows);
    }

    // Divider center coordinates in box local space X in [0, W], Z in [0, D]
    const colCenters = [];
    let accX = T;
    for (let c = 0; c < cols - 1; c++) {
      accX += colWidths[c];
      colCenters.push(accX + T * 0.5);
      accX += T;
    }

    const rowCenters = [];
    let accZ = T;
    for (let r = 0; r < rows - 1; r++) {
      accZ += rowDepths[r];
      rowCenters.push(accZ + T * 0.5);
      accZ += T;
    }

    // Finger counts & limits
    const fingerLimits = computeFingerLimits(W, H, D, T, isClosed);
    const clampedFinger = Math.min(
      fingerLimits.max,
      Math.max(fingerLimits.min, Number(params.fingerSize) || 9)
    );
    const nX = calcOddFingerCount(innerW, clampedFinger);
    const nZ = calcOddFingerCount(innerD, clampedFinger);
    const nY = calcOddFingerCount(innerH, clampedFinger);

    // Wall connection geometry for dividers:
    // - FLAT: no wall slots/mortises
    // - FINGER + Open (lidType === 'none'): top-open U-slots in outer walls
    // - FINGER + Closed (lidType === 'flat'): centered rectangular through-mortises in outer walls
    const useOpenUSlots = joint === 'finger' && !isClosed;
    const useClosedMortises = joint === 'finger' && isClosed;
    const endTabMode = joint === 'flat' ? 'none' : (isClosed ? 'center' : 'top');

    const frontCenters = colCenters;
    const backCenters = colCenters.map(x => W - x);
    const leftCenters = rowCenters;
    const rightCenters = rowCenters.map(z => D - z);

    const vBot = T;
    const tabBot = vBot + innerH * 0.25;
    const tabTop = vBot + innerH * 0.75;

    function buildWallMortises(centers) {
      if (!useClosedMortises) return [];
      return centers.map(c => buildRectHoleCW(c - T * 0.5, tabBot, c + T * 0.5, tabTop));
    }

    const horizPts = joint === 'flat'
      ? buildRect(0, 0, W, D)
      : buildFingerHorizontalPanel(W, D, T, nX, nZ);

    const frontPts = joint === 'flat'
      ? buildRect(0, T, W, isClosed ? H - T : H)
      : buildFingerFrontBackPanel(W, H, T, nX, nY, isClosed, useOpenUSlots ? frontCenters : null);

    const backPts = joint === 'flat'
      ? buildRect(0, T, W, isClosed ? H - T : H)
      : buildFingerFrontBackPanel(W, H, T, nX, nY, isClosed, useOpenUSlots ? backCenters : null);

    const leftPts = joint === 'flat'
      ? buildRect(T, T, D - T, isClosed ? H - T : H)
      : buildFingerLeftRightPanel(D, H, T, nZ, nY, isClosed, useOpenUSlots ? leftCenters : null);

    const rightPts = joint === 'flat'
      ? buildRect(T, T, D - T, isClosed ? H - T : H)
      : buildFingerLeftRightPanel(D, H, T, nZ, nY, isClosed, useOpenUSlots ? rightCenters : null);

    const panels = [];

    if (isClosed) {
      panels.push(createPanelObject(
        'superior', 'Superior', 'outer', horizPts, [], T,
        (u, v, w) => [u - W / 2, H / 2 - T / 2 + w, D / 2 - v],
        [0, 1.35, 0]
      ));
    }

    panels.push(createPanelObject(
      'fundo', 'Fundo', 'outer', horizPts, [], T,
      (u, v, w) => [u - W / 2, -H / 2 + T / 2 + w, D / 2 - v],
      [0, -1, 0]
    ));

    panels.push(createPanelObject(
      'frente', 'Frente', 'outer', frontPts, buildWallMortises(frontCenters), T,
      (u, v, w) => [u - W / 2, v - H / 2, D / 2 - T / 2 + w],
      [0, 0, 1]
    ));

    panels.push(createPanelObject(
      'traseira', 'Traseira', 'outer', backPts, buildWallMortises(backCenters), T,
      (u, v, w) => [W / 2 - u, v - H / 2, -D / 2 + T / 2 - w],
      [0, 0, -1]
    ));

    panels.push(createPanelObject(
      'esquerda', 'Esquerda', 'outer', leftPts, buildWallMortises(leftCenters), T,
      (u, v, w) => [-W / 2 + T / 2 - w, v - H / 2, u - D / 2],
      [-1, 0, 0]
    ));

    panels.push(createPanelObject(
      'direita', 'Direita', 'outer', rightPts, buildWallMortises(rightCenters), T,
      (u, v, w) => [W / 2 - T / 2 + w, v - H / 2, D / 2 - u],
      [1, 0, 0]
    ));

    // Row Dividers (parallel to X / Front-Back; bottom-up cross-lap notches at colCenters)
    const rowDivPts = buildDividerPanel(W, H, T, isClosed, colCenters, 'bottom', endTabMode);
    for (let r = 0; r < rowCenters.length; r++) {
      const zCenter = rowCenters[r];
      const yLift = 0.55 + r * 0.14;
      panels.push(createPanelObject(
        `div-linha-${r + 1}`,
        `Div. Linha ${r + 1}`,
        'divider-row',
        rowDivPts,
        [],
        T,
        (u, v, w) => [u - W / 2, v - H / 2, (zCenter - D / 2) + w],
        [0, yLift, 0]
      ));
    }

    // Column Dividers (parallel to Z / Left-Right; top-down cross-lap notches at rowCenters)
    const colDivPts = buildDividerPanel(D, H, T, isClosed, rowCenters, 'top', endTabMode);
    for (let c = 0; c < colCenters.length; c++) {
      const xCenter = colCenters[c];
      const yLift = 0.18 + c * 0.08;
      panels.push(createPanelObject(
        `div-coluna-${c + 1}`,
        `Div. Coluna ${c + 1}`,
        'divider-col',
        colDivPts,
        [],
        T,
        (u, v, w) => [(xCenter - W / 2) + w, v - H / 2, u - D / 2],
        [0, yLift, 0]
      ));
    }

    return {
      type: 'divider',
      valid,
      joint,
      isClosed,
      thickness: T,
      rows,
      cols,
      colWidths,
      rowDepths,
      colCenters,
      rowCenters,
      outer: { width: W, height: H, depth: D },
      inner: { width: innerW, height: innerH, depth: innerD },
      cellAvg: {
        width: availW / cols,
        height: innerH,
        depth: availD / rows
      },
      finger: {
        size: clampedFinger,
        limits: fingerLimits,
        counts: { x: nX, y: nY, z: nZ }
      },
      panels
    };
  }

  /**
   * Build regular N-gon base/top polygon (Fundo / Topo) in local 2D coordinates centered at (0, 0).
   * - In FLAT mode: plain regular N-gon of outer apothem aOut = aIn + T.
   * - In FINGER mode: regular N-gon with solid outer corners (apothem aOut) and inward slots
   *   (apothem aIn) along each edge matching Lado 1..N's top/bottom tabs.
   */
  function buildPolygonCap(N, aIn, T, joint, nH, activeSpan) {
    const aOut = aIn + T;
    const halfAngle = Math.PI / N;
    const rOut = aOut / Math.cos(halfAngle);
    const pts = [];

    for (let i = 0; i < N; i++) {
      // Edge i has outward normal angle phi_i = (2*pi*i)/N - pi/2
      const phi = (2 * Math.PI * i) / N - Math.PI / 2;
      const nx = Math.cos(phi);
      const ny = Math.sin(phi);
      // CCW tangent along edge i
      const tx = -ny;
      const ty = nx;

      // Start vertex of edge i on outer N-gon
      const vStartAngle = phi - halfAngle;
      pts.push({
        x: rOut * Math.cos(vStartAngle),
        y: rOut * Math.sin(vStartAngle)
      });

      if (joint === 'finger' && nH >= 3 && activeSpan > EPS) {
        const segLen = activeSpan / nH;
        const startU = -activeSpan * 0.5;
        for (let k = 0; k < nH; k++) {
          // Even segments stay OUT (at aOut), odd segments cut IN (to aIn)
          if (k % 2 === 1) {
            const u0 = startU + k * segLen;
            const u1 = startU + (k + 1) * segLen;
            pts.push({ x: aOut * nx + u0 * tx, y: aOut * ny + u0 * ty });
            pts.push({ x: aIn * nx + u0 * tx, y: aIn * ny + u0 * ty });
            pts.push({ x: aIn * nx + u1 * tx, y: aIn * ny + u1 * ty });
            pts.push({ x: aOut * nx + u1 * tx, y: aOut * ny + u1 * ty });
          }
        }
      }
    }

    return ensureCCW(pts);
  }

  /**
   * Build one vertical side wall (Lado 1..N) of a Polygon Box in local (u, v) coordinates
   * centered at (0, 0), with inner width sIn and inner height hIn.
   * - FLAT: simple rectangle [-sIn/2, +sIn/2] x [-hIn/2, +hIn/2].
   * - FINGER:
   *   - Bottom edge (and Top edge if closed): odd segments project OUT to ±(hIn/2 + T)
   *     within [-activeSpan/2, +activeSpan/2], interlocking with Fundo / Topo.
   *   - Left & Right vertical edges: complementary beveled-depth finger joints between
   *     uNotch and uTab matching dihedral turn angle theta = 2*pi/N.
   */
  function buildPolygonSidePanel(sIn, hIn, T, isClosed, joint, nH, activeSpan, nV, uNotch, uTab) {
    const halfH = hIn * 0.5;

    if (joint === 'flat') {
      return buildRect(-sIn * 0.5, -halfH, sIn * 0.5, halfH);
    }

    const pts = [];
    const segH = activeSpan / nH;
    const startU = -activeSpan * 0.5;
    const segV = hIn / nV;

    // 1. Bottom edge: left -> right (u from -uNotch to +uNotch at v = -halfH, odd segments OUT to -halfH - T)
    pts.push({ x: -uNotch, y: -halfH });
    for (let k = 0; k < nH; k++) {
      if (k % 2 === 1) {
        const u0 = startU + k * segH;
        const u1 = startU + (k + 1) * segH;
        pts.push({ x: u0, y: -halfH });
        pts.push({ x: u0, y: -halfH - T });
        pts.push({ x: u1, y: -halfH - T });
        pts.push({ x: u1, y: -halfH });
      }
    }
    pts.push({ x: uNotch, y: -halfH });

    // 2. Right edge: bottom -> top (even segments OUT to +uTab, odd segments IN at +uNotch)
    for (let j = 0; j < nV; j++) {
      const v0 = -halfH + j * segV;
      const v1 = -halfH + (j + 1) * segV;
      const u = (j % 2 === 0) ? uTab : uNotch;
      pts.push({ x: u, y: v0 });
      pts.push({ x: u, y: v1 });
    }

    // 3. Top edge: right -> left
    pts.push({ x: uNotch, y: halfH });
    if (isClosed) {
      for (let k = nH - 1; k >= 0; k--) {
        if (k % 2 === 1) {
          const u1 = startU + (k + 1) * segH;
          const u0 = startU + k * segH;
          pts.push({ x: u1, y: halfH });
          pts.push({ x: u1, y: halfH + T });
          pts.push({ x: u0, y: halfH + T });
          pts.push({ x: u0, y: halfH });
        }
      }
    }
    pts.push({ x: -uNotch, y: halfH });

    // 4. Left edge: top -> bottom (exact complement of Right edge: even IN at -uNotch, odd OUT to -uTab)
    for (let j = nV - 1; j >= 0; j--) {
      const v1 = -halfH + (j + 1) * segV;
      const v0 = -halfH + j * segV;
      const u = (j % 2 === 0) ? -uNotch : -uTab;
      pts.push({ x: u, y: v1 });
      pts.push({ x: u, y: v0 });
    }

    return ensureCCW(pts);
  }

  /**
   * Build the complete 3D + 2D Regular Polygon Box model (Caixa Poligonal — FLAT & FINGER only).
   * Supports N in [3, 18], sizeMode ('innerDiameter' | 'outerDiameter' | 'sideLength'),
   * enclosure ('open' | 'closed'), and joint ('flat' | 'finger').
   */
  function buildPolygonBoxModel(params) {
    const N = Math.max(3, Math.min(18, Math.round(Number(params.sides) || 6)));
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const isClosed = params.enclosure === 'closed';
    const joint = params.joint === 'flat' ? 'flat' : 'finger';
    const sizeMode = params.sizeMode || 'innerDiameter';

    const rawSize = Math.max(1, Number(params.size) || 100);
    const rawHeight = Math.max(1, Number(params.height) || 25);

    const halfAngle = Math.PI / N;
    const theta = (2 * Math.PI) / N;

    let rawAIn, rawHIn;
    if (sizeMode === 'outerDiameter') {
      rawAIn = (rawSize * 0.5) * Math.cos(halfAngle) - T;
      rawHIn = rawHeight - (isClosed ? 2 * T : T);
    } else if (sizeMode === 'sideLength') {
      rawAIn = rawSize / (2 * Math.tan(halfAngle));
      rawHIn = rawHeight - (isClosed ? 2 * T : T);
    } else {
      // 'innerDiameter' (flat-to-flat inside diameter)
      rawAIn = rawSize * 0.5;
      rawHIn = rawHeight;
    }

    // Ensure enough room along each side for valid non-intersecting vertical notches
    const notchOffset = T / Math.tan(theta); // positive for N >= 5, 0 for N = 4, negative for N = 3
    const minSideForNotches = Math.max(T * 3, (notchOffset > 0 ? notchOffset * 2 : 0) + T * 2.5);
    const minAIn = minSideForNotches / (2 * Math.tan(halfAngle));
    const minHIn = Math.max(4, T * 2);

    const valid = rawAIn >= minAIn && rawHIn >= minHIn;

    const aIn = Math.max(rawAIn, minAIn);
    const hIn = Math.max(rawHIn, minHIn);

    const sIn = 2 * aIn * Math.tan(halfAngle);
    const aOut = aIn + T;
    const rOut = aOut / Math.cos(halfAngle);
    const dIn = 2 * aIn;
    const dOutFlat = 2 * aOut;
    const dOutVertex = 2 * rOut;
    const hOut = hIn + (isClosed ? 2 * T : T);

    // Beveled vertical finger extents for exterior angle theta = 2*pi/N
    const uNotch = sIn * 0.5 - notchOffset;
    const uTab = sIn * 0.5 + Math.max(T / Math.sin(theta), T * Math.tan(halfAngle));

    // Active horizontal finger span along top/bottom of each side
    const maxSafeHalfSpan = Math.min(sIn * 0.5, uNotch);
    const activeSpan = Math.max(T * 1.5, maxSafeHalfSpan * 2);

    // Finger slider limits
    const minSpan = Math.min(activeSpan, hIn);
    const minFinger = Number(Math.max(1.5, Math.min(2 * T, minSpan / 3)).toFixed(2));
    const maxFinger = Number(Math.max(minFinger + 0.5, Math.min(sIn, hIn) * 0.5).toFixed(2));
    const clampedFinger = Math.min(maxFinger, Math.max(minFinger, Number(params.fingerSize) || 9));

    const nH = calcOddFingerCount(activeSpan, clampedFinger);
    const nV = calcOddFingerCount(hIn, clampedFinger);

    const capPts = buildPolygonCap(N, aIn, T, joint, nH, activeSpan);
    const sidePts = buildPolygonSidePanel(sIn, hIn, T, isClosed, joint, nH, activeSpan, nV, uNotch, uTab);

    const yShift = isClosed ? 0 : T * 0.5;
    const panels = [];

    // N vertical side walls (Lado 1..N)
    const rMid = aIn + T * 0.5;
    for (let i = 0; i < N; i++) {
      const phi = (2 * Math.PI * i) / N - Math.PI / 2;
      const nx = Math.cos(phi);
      const nz = -Math.sin(phi);
      const tx = -Math.sin(phi);
      const tz = -Math.cos(phi);
      const cx = rMid * nx;
      const cz = rMid * nz;

      panels.push(createPanelObject(
        `lado-${i + 1}`,
        `Lado ${i + 1}`,
        'poly-side',
        sidePts,
        [],
        T,
        (u, v, w) => [
          cx + u * tx + w * nx,
          yShift + v,
          cz + u * tz + w * nz
        ],
        [nx, 0, nz]
      ));
    }

    // Bottom N-gon cap (Fundo)
    panels.push(createPanelObject(
      'fundo',
      'Fundo',
      'poly-cap',
      capPts,
      [],
      T,
      (u, v, w) => [u, -hIn * 0.5 - T * 0.5 + yShift + w, -v],
      [0, -1.1, 0]
    ));

    // Top N-gon cap (Topo) when closed
    if (isClosed) {
      panels.push(createPanelObject(
        'topo',
        'Topo',
        'poly-cap',
        capPts,
        [],
        T,
        (u, v, w) => [u, hIn * 0.5 + T * 0.5 + yShift + w, -v],
        [0, 1.1, 0]
      ));
    }

    return {
      type: 'polygon',
      valid,
      sides: N,
      joint,
      isClosed,
      thickness: T,
      inner: {
        diameter: dIn,
        apothem: aIn,
        sideLength: sIn,
        height: hIn
      },
      outer: {
        width: dOutVertex,
        height: hOut,
        depth: dOutVertex,
        flatDiameter: dOutFlat,
        vertexDiameter: dOutVertex
      },
      finger: {
        size: clampedFinger,
        limits: { min: minFinger, max: maxFinger },
        counts: { h: nH, v: nV }
      },
      panels
    };
  }

  /**
   * Build a rotated rectangular CW hole centered at (cx, cy) with axis uDir (length L)
   * and perpendicular nDir (thickness W).
   */
  function buildOrientedRectHoleCW(cx, cy, uDir, nDir, lenU, thickN) {
    const hu = lenU * 0.5;
    const hn = thickN * 0.5;
    const p0 = { x: cx - uDir.x * hu - nDir.x * hn, y: cy - uDir.y * hu - nDir.y * hn };
    const p1 = { x: cx - uDir.x * hu + nDir.x * hn, y: cy - uDir.y * hu + nDir.y * hn };
    const p2 = { x: cx + uDir.x * hu + nDir.x * hn, y: cy + uDir.y * hu + nDir.y * hn };
    const p3 = { x: cx + uDir.x * hu - nDir.x * hn, y: cy + uDir.y * hu - nDir.y * hn };
    return ensureCW([p0, p1, p2, p3]);
  }

  /**
   * Build the complete 3D + 2D Stackable Parts Bin model (Caixa Empilhável para Peças).
   * Features:
   * - Polygonal sloped-front side walls with trapezoidal top stacking lugs & bottom registration notches
   * - Tilted outward front scoop lip with mortise-and-tenon tabs into side walls & recessed bottom floor
   * - Back wall with matching 3rd trapezoidal stacking lug/notch + mortise-and-tenon tabs
   * - Recessed floor plate clearing the stacking notch of the bin below
   * - Optional internal cross-lapped divider grid (rowCount x colCount)
   * - Batch quantity (quantity >= 1) showing stacked bins in 3D and repeating sets in 2D export
   */
  function buildStackableBinModel(params) {
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const isOutside = params.dimRef !== 'inside';

    const rawW = Math.max(1, Number(params.width) || 111);
    const rawH = Math.max(1, Number(params.height) || 83);
    const rawD = Math.max(1, Number(params.depth) || 111);
    const rawLipH = Math.max(1, Number(params.lipHeight) || 36);

    const rows = Math.max(1, Math.min(8, Math.round(Number(params.rowCount) || 1)));
    const cols = Math.max(1, Math.min(8, Math.round(Number(params.colCount) || 1)));
    const quantity = Math.max(1, Math.min(6, Math.round(Number(params.quantity) || 1)));

    const outerW = isOutside ? rawW : rawW + 2 * T;
    const outerD = isOutside ? rawD : rawD + 2 * T;
    const outerH = isOutside ? rawH : rawH + T;

    const minW = Math.max(40, cols * (T * 3 + 8) + 2 * T);
    const minD = Math.max(50, rows * (T * 3 + 8) + 6 * T);
    const minH = Math.max(36, T * 8);

    const valid = outerW >= minW && outerD >= minD && outerH >= minH;

    const W = Math.max(outerW, minW);
    const D = Math.max(outerD, minD);
    const H = Math.max(outerH, minH);

    // Stacking lug/notch dimensions
    const lugH = Math.max(3.5, Math.min(7, T * 1.9, H * 0.095));
    const yFloorBot = lugH + Math.max(1.5, T * 0.6);
    const yFloorTop = yFloorBot + T;

    // Clamp front lip height between floor + room for tabs and full height
    const minLipH = yFloorTop + Math.max(12, T * 3.5);
    const maxLipH = H - Math.max(8, T * 2);
    const lipH = Math.max(minLipH, Math.min(maxLipH, rawLipH));

    // Side-wall front geometry
    const frontTiltX = Math.min(D * 0.24, Math.max(6, lipH * 0.34));
    const zBottomFront = D - frontTiltX;
    const zTopEnd = Math.max(T * 8, Math.min(D - 14, D * 0.58));

    // Trapezoidal stacking lug/notch on Side walls (centered along rear plateau [0, zTopEnd])
    const sideLugCenter = zTopEnd * 0.5;
    const sideLugBaseW = Math.max(12, Math.min(zTopEnd * 0.44, D * 0.24));
    const sideLugSlope = Math.min(sideLugBaseW * 0.22, lugH * 0.72);
    const sideLugTopW = sideLugBaseW - 2 * sideLugSlope;

    // Back wall stacking lug/notch (centered along inner width [T, W - T])
    const innerW = W - 2 * T;
    const backLugCenter = W * 0.5;
    const backLugBaseW = Math.max(12, Math.min(innerW * 0.36, W * 0.24));
    const backLugSlope = Math.min(backLugBaseW * 0.22, lugH * 0.72);
    const backLugTopW = backLugBaseW - 2 * backLugSlope;

    // Back panel plane Z position (inset by T from rear edge so side wall mortises stay enclosed)
    const zBackCenter = T * 1.5;
    const zBackInner = zBackCenter + T * 0.5;

    // Tilted Front panel axis & plane
    const tiltDx = D - zBottomFront;
    const tiltDy = lipH;
    const tiltLen = Math.hypot(tiltDx, tiltDy);
    const uTilt = { x: tiltDx / tiltLen, y: tiltDy / tiltLen }; // upward-and-forward along tilted lip
    const nTilt = { x: -uTilt.y, y: uTilt.x };                 // inward normal into bin
    const frontInset = T * 1.5;

    // Point on Front panel center plane at parameter s along uTilt from bottom-front (zBottomFront, 0)
    // P(s) = (zBottomFront, 0) + nTilt * frontInset + uTilt * s
    const frontOriginZ = zBottomFront + nTilt.x * frontInset;
    const frontOriginY = 0 + nTilt.y * frontInset;

    // Where Front center plane intersects y = yFloorTop and y = lipH
    const sAtFloorBot = (yFloorBot - frontOriginY) / uTilt.y;
    const sAtFloorTop = (yFloorTop - frontOriginY) / uTilt.y;
    const sAtLipTop = (lipH - frontOriginY) / uTilt.y;
    const frontSpanS = Math.max(8, sAtLipTop - sAtFloorTop);

    // Intersection of Front panel's INNER face with floor top plane (for floor depth & divider span)
    const frontInnerOriginZ = zBottomFront + nTilt.x * (frontInset + T * 0.5);
    const frontInnerOriginY = nTilt.y * (frontInset + T * 0.5);
    const sInnerAtFloor = (yFloorTop - frontInnerOriginY) / uTilt.y;
    const zFloorFrontInner = frontInnerOriginZ + uTilt.x * sInnerAtFloor;

    // Front panel's center Z at floor level (where its bottom tabs pierce Fundo)
    const zFrontAtFloorMid = frontOriginZ + uTilt.x * ((yFloorBot + T * 0.5 - frontOriginY) / uTilt.y);
    const cosTilt = uTilt.y; // cos(angle from vertical)
    const frontSlotDepthZ = T / Math.max(0.5, cosTilt);
    const zFloorEnd = Math.min(zBottomFront - T * 0.6, zFrontAtFloorMid + frontSlotDepthZ * 0.5 + T * 1.2);

    // Helper: upper slope height of side wall at any z in [0, D]
    function sideTopY(z) {
      if (z <= zTopEnd) return H;
      const frac = Math.max(0, Math.min(1, (z - zTopEnd) / Math.max(EPS, D - zTopEnd)));
      return H + (lipH - H) * frac;
    }

    // ---- Tab coordinates for Mortise-and-Tenon joints ----
    // 1. Back wall vertical tabs into Side walls (2 tabs along [yFloorTop, H])
    const backSpanY = H - yFloorTop;
    const backTabLen = Math.max(6, Math.min(18, backSpanY * 0.24));
    const backTabY1 = yFloorTop + backSpanY * 0.26;
    const backTabY2 = yFloorTop + backSpanY * 0.74;

    // 2. Bottom floor horizontal tabs into Side walls (1 in rear foot, 1 in front foot)
    const rearFootStart = zBackInner + T * 0.6;
    const rearFootEnd = sideLugCenter - sideLugBaseW * 0.5 - T * 0.6;
    const frontFootStart = sideLugCenter + sideLugBaseW * 0.5 + T * 0.6;
    const frontFootEnd = Math.min(zFloorEnd - T * 0.8, zFrontAtFloorMid - frontSlotDepthZ * 0.5 - T * 0.8);

    const floorSideTabLen1 = Math.max(6, Math.min(16, (rearFootEnd - rearFootStart) * 0.65));
    const floorSideTabZ1 = (rearFootStart + rearFootEnd) * 0.5;
    const floorSideTabLen2 = Math.max(6, Math.min(16, (frontFootEnd - frontFootStart) * 0.65));
    const floorSideTabZ2 = (frontFootStart + frontFootEnd) * 0.5;

    // 3. Bottom floor rear tabs into Back wall (2 tabs along X)
    const floorBackTabLen = Math.max(8, Math.min(20, innerW * 0.22));
    const floorBackTabX1 = T + innerW * 0.25;
    const floorBackTabX2 = T + innerW * 0.75;

    // 4. Tilted Front panel tabs into Side walls (2 angled tabs along uTilt)
    const frontSideTabLen = Math.max(4.5, Math.min(12, frontSpanS * 0.25));
    const frontSideTabS1 = sAtFloorTop + frontSpanS * 0.28;
    const frontSideTabS2 = sAtFloorTop + frontSpanS * 0.72;

    // 5. Tilted Front panel bottom tabs into Bottom floor (2 tabs along X)
    const frontFloorTabLen = Math.max(8, Math.min(20, innerW * 0.22));
    const frontFloorTabX1 = T + innerW * 0.25;
    const frontFloorTabX2 = T + innerW * 0.75;

    // ---- Internal Divider Positions (if rows > 1 or cols > 1) ----
    const divAvailZ = Math.max(10, zFloorFrontInner - zBackInner - (rows - 1) * T);
    const rowStepZ = divAvailZ / rows;
    const rowCentersZ = [];
    for (let r = 0; r < rows - 1; r++) {
      rowCentersZ.push(zBackInner + (r + 1) * rowStepZ + r * T + T * 0.5);
    }

    const divAvailX = Math.max(10, innerW - (cols - 1) * T);
    const colStepX = divAvailX / cols;
    const colCentersX = [];
    for (let c = 0; c < cols - 1; c++) {
      colCentersX.push(T + (c + 1) * colStepX + c * T + T * 0.5);
    }

    // Divider tab dimensions
    const rowDivTabFracBot = 0.28;
    const rowDivTabFracTop = 0.72;

    // =========================================================================
    // 1. SIDE WALLS (Esquerda & Direita) in local (u = z in [0, D], v = y in [0, H + lugH])
    // =========================================================================
    const sideOuterPts = ensureCCW([
      { x: 0, y: 0 },
      { x: sideLugCenter - sideLugBaseW * 0.5, y: 0 },
      { x: sideLugCenter - sideLugTopW * 0.5, y: lugH },
      { x: sideLugCenter + sideLugTopW * 0.5, y: lugH },
      { x: sideLugCenter + sideLugBaseW * 0.5, y: 0 },
      { x: zBottomFront, y: 0 },
      { x: D, y: lipH },
      { x: zTopEnd, y: H },
      { x: sideLugCenter + sideLugBaseW * 0.5, y: H },
      { x: sideLugCenter + sideLugTopW * 0.5, y: H + lugH },
      { x: sideLugCenter - sideLugTopW * 0.5, y: H + lugH },
      { x: sideLugCenter - sideLugBaseW * 0.5, y: H },
      { x: 0, y: H }
    ]);

    const sideHoles = [];
    // 2 rear vertical mortises (for Traseira)
    sideHoles.push(buildRectHoleCW(
      zBackCenter - T * 0.5, backTabY1 - backTabLen * 0.5,
      zBackCenter + T * 0.5, backTabY1 + backTabLen * 0.5
    ));
    sideHoles.push(buildRectHoleCW(
      zBackCenter - T * 0.5, backTabY2 - backTabLen * 0.5,
      zBackCenter + T * 0.5, backTabY2 + backTabLen * 0.5
    ));
    // 2 bottom horizontal mortises (for Fundo)
    if (rearFootEnd - rearFootStart > 4) {
      sideHoles.push(buildRectHoleCW(
        floorSideTabZ1 - floorSideTabLen1 * 0.5, yFloorBot,
        floorSideTabZ1 + floorSideTabLen1 * 0.5, yFloorTop
      ));
    }
    if (frontFootEnd - frontFootStart > 4) {
      sideHoles.push(buildRectHoleCW(
        floorSideTabZ2 - floorSideTabLen2 * 0.5, yFloorBot,
        floorSideTabZ2 + floorSideTabLen2 * 0.5, yFloorTop
      ));
    }
    // 2 tilted front mortises (for Frente)
    const fC1z = frontOriginZ + uTilt.x * frontSideTabS1;
    const fC1y = frontOriginY + uTilt.y * frontSideTabS1;
    const fC2z = frontOriginZ + uTilt.x * frontSideTabS2;
    const fC2y = frontOriginY + uTilt.y * frontSideTabS2;
    sideHoles.push(buildOrientedRectHoleCW(fC1z, fC1y, uTilt, nTilt, frontSideTabLen, T));
    sideHoles.push(buildOrientedRectHoleCW(fC2z, fC2y, uTilt, nTilt, frontSideTabLen, T));

    // Row divider vertical mortises in Side walls
    for (let r = 0; r < rowCentersZ.length; r++) {
      const zDiv = rowCentersZ[r];
      const topY = sideTopY(zDiv);
      const hDiv = Math.max(8, topY - yFloorTop);
      sideHoles.push(buildRectHoleCW(
        zDiv - T * 0.5, yFloorTop + hDiv * rowDivTabFracBot,
        zDiv + T * 0.5, yFloorTop + hDiv * rowDivTabFracTop
      ));
    }

    // =========================================================================
    // 2. BACK WALL (Traseira) in local (u = x in [0, W], v = y in [0, H + lugH])
    // =========================================================================
    const backPts = ensureCCW([
      // Bottom edge with trapezoidal stacking notch
      { x: T, y: 0 },
      { x: backLugCenter - backLugBaseW * 0.5, y: 0 },
      { x: backLugCenter - backLugTopW * 0.5, y: lugH },
      { x: backLugCenter + backLugTopW * 0.5, y: lugH },
      { x: backLugCenter + backLugBaseW * 0.5, y: 0 },
      { x: W - T, y: 0 },
      // Right edge with 2 protruding tabs into Right side wall
      { x: W - T, y: backTabY1 - backTabLen * 0.5 },
      { x: W, y: backTabY1 - backTabLen * 0.5 },
      { x: W, y: backTabY1 + backTabLen * 0.5 },
      { x: W - T, y: backTabY1 + backTabLen * 0.5 },
      { x: W - T, y: backTabY2 - backTabLen * 0.5 },
      { x: W, y: backTabY2 - backTabLen * 0.5 },
      { x: W, y: backTabY2 + backTabLen * 0.5 },
      { x: W - T, y: backTabY2 + backTabLen * 0.5 },
      { x: W - T, y: H },
      // Top edge with trapezoidal stacking lug
      { x: backLugCenter + backLugBaseW * 0.5, y: H },
      { x: backLugCenter + backLugTopW * 0.5, y: H + lugH },
      { x: backLugCenter - backLugTopW * 0.5, y: H + lugH },
      { x: backLugCenter - backLugBaseW * 0.5, y: H },
      { x: T, y: H },
      // Left edge with 2 protruding tabs into Left side wall
      { x: T, y: backTabY2 + backTabLen * 0.5 },
      { x: 0, y: backTabY2 + backTabLen * 0.5 },
      { x: 0, y: backTabY2 - backTabLen * 0.5 },
      { x: T, y: backTabY2 - backTabLen * 0.5 },
      { x: T, y: backTabY1 + backTabLen * 0.5 },
      { x: 0, y: backTabY1 + backTabLen * 0.5 },
      { x: 0, y: backTabY1 - backTabLen * 0.5 },
      { x: T, y: backTabY1 - backTabLen * 0.5 }
    ]);

    const backHoles = [
      // 2 horizontal mortises for Fundo rear tabs
      buildRectHoleCW(
        floorBackTabX1 - floorBackTabLen * 0.5, yFloorBot,
        floorBackTabX1 + floorBackTabLen * 0.5, yFloorTop
      ),
      buildRectHoleCW(
        floorBackTabX2 - floorBackTabLen * 0.5, yFloorBot,
        floorBackTabX2 + floorBackTabLen * 0.5, yFloorTop
      )
    ];

    // Column divider rear mortises in Back wall
    const colBackTabBot = yFloorTop + (H - yFloorTop) * 0.28;
    const colBackTabTop = yFloorTop + (H - yFloorTop) * 0.72;
    for (let c = 0; c < colCentersX.length; c++) {
      const xDiv = colCentersX[c];
      backHoles.push(buildRectHoleCW(
        xDiv - T * 0.5, colBackTabBot,
        xDiv + T * 0.5, colBackTabTop
      ));
    }

    // =========================================================================
    // 3. BOTTOM FLOOR (Fundo) in local (u = x in [0, W], v = z in [zBackCenter - T/2, zFloorEnd])
    // =========================================================================
    const floorPtsRaw = [
      // Rear edge (v = zBackInner) with 2 tabs protruding back to zBackCenter - T/2
      { x: T, y: zBackInner },
      { x: floorBackTabX1 - floorBackTabLen * 0.5, y: zBackInner },
      { x: floorBackTabX1 - floorBackTabLen * 0.5, y: zBackCenter - T * 0.5 },
      { x: floorBackTabX1 + floorBackTabLen * 0.5, y: zBackCenter - T * 0.5 },
      { x: floorBackTabX1 + floorBackTabLen * 0.5, y: zBackInner },
      { x: floorBackTabX2 - floorBackTabLen * 0.5, y: zBackInner },
      { x: floorBackTabX2 - floorBackTabLen * 0.5, y: zBackCenter - T * 0.5 },
      { x: floorBackTabX2 + floorBackTabLen * 0.5, y: zBackCenter - T * 0.5 },
      { x: floorBackTabX2 + floorBackTabLen * 0.5, y: zBackInner },
      { x: W - T, y: zBackInner }
    ];

    // Right edge (u = W - T) with 2 tabs protruding to W
    if (rearFootEnd - rearFootStart > 4) {
      floorPtsRaw.push(
        { x: W - T, y: floorSideTabZ1 - floorSideTabLen1 * 0.5 },
        { x: W, y: floorSideTabZ1 - floorSideTabLen1 * 0.5 },
        { x: W, y: floorSideTabZ1 + floorSideTabLen1 * 0.5 },
        { x: W - T, y: floorSideTabZ1 + floorSideTabLen1 * 0.5 }
      );
    }
    if (frontFootEnd - frontFootStart > 4) {
      floorPtsRaw.push(
        { x: W - T, y: floorSideTabZ2 - floorSideTabLen2 * 0.5 },
        { x: W, y: floorSideTabZ2 - floorSideTabLen2 * 0.5 },
        { x: W, y: floorSideTabZ2 + floorSideTabLen2 * 0.5 },
        { x: W - T, y: floorSideTabZ2 + floorSideTabLen2 * 0.5 }
      );
    }
    floorPtsRaw.push(
      { x: W - T, y: zFloorEnd },
      { x: T, y: zFloorEnd }
    );

    // Left edge (u = T) moving back-ward with 2 tabs protruding to 0
    if (frontFootEnd - frontFootStart > 4) {
      floorPtsRaw.push(
        { x: T, y: floorSideTabZ2 + floorSideTabLen2 * 0.5 },
        { x: 0, y: floorSideTabZ2 + floorSideTabLen2 * 0.5 },
        { x: 0, y: floorSideTabZ2 - floorSideTabLen2 * 0.5 },
        { x: T, y: floorSideTabZ2 - floorSideTabLen2 * 0.5 }
      );
    }
    if (rearFootEnd - rearFootStart > 4) {
      floorPtsRaw.push(
        { x: T, y: floorSideTabZ1 + floorSideTabLen1 * 0.5 },
        { x: 0, y: floorSideTabZ1 + floorSideTabLen1 * 0.5 },
        { x: 0, y: floorSideTabZ1 - floorSideTabLen1 * 0.5 },
        { x: T, y: floorSideTabZ1 - floorSideTabLen1 * 0.5 }
      );
    }

    const floorPts = ensureCCW(floorPtsRaw);
    const floorHoles = [
      // 2 front mortises receiving tilted Frente panel's bottom tabs
      buildRectHoleCW(
        frontFloorTabX1 - frontFloorTabLen * 0.5, zFrontAtFloorMid - frontSlotDepthZ * 0.5,
        frontFloorTabX1 + frontFloorTabLen * 0.5, zFrontAtFloorMid + frontSlotDepthZ * 0.5
      ),
      buildRectHoleCW(
        frontFloorTabX2 - frontFloorTabLen * 0.5, zFrontAtFloorMid - frontSlotDepthZ * 0.5,
        frontFloorTabX2 + frontFloorTabLen * 0.5, zFrontAtFloorMid + frontSlotDepthZ * 0.5
      )
    ];

    // =========================================================================
    // 4. TILTED FRONT LIP (Frente) in local (u = x in [0, W], v = s along uTilt)
    // =========================================================================
    const frontPts = ensureCCW([
      // Bottom edge at s = sAtFloorTop with 2 tabs reaching down to sAtFloorBot
      { x: T, y: sAtFloorTop },
      { x: frontFloorTabX1 - frontFloorTabLen * 0.5, y: sAtFloorTop },
      { x: frontFloorTabX1 - frontFloorTabLen * 0.5, y: sAtFloorBot },
      { x: frontFloorTabX1 + frontFloorTabLen * 0.5, y: sAtFloorBot },
      { x: frontFloorTabX1 + frontFloorTabLen * 0.5, y: sAtFloorTop },
      { x: frontFloorTabX2 - frontFloorTabLen * 0.5, y: sAtFloorTop },
      { x: frontFloorTabX2 - frontFloorTabLen * 0.5, y: sAtFloorBot },
      { x: frontFloorTabX2 + frontFloorTabLen * 0.5, y: sAtFloorBot },
      { x: frontFloorTabX2 + frontFloorTabLen * 0.5, y: sAtFloorTop },
      { x: W - T, y: sAtFloorTop },
      // Right edge with 2 protruding tabs into Right side wall tilted mortises
      { x: W - T, y: frontSideTabS1 - frontSideTabLen * 0.5 },
      { x: W, y: frontSideTabS1 - frontSideTabLen * 0.5 },
      { x: W, y: frontSideTabS1 + frontSideTabLen * 0.5 },
      { x: W - T, y: frontSideTabS1 + frontSideTabLen * 0.5 },
      { x: W - T, y: frontSideTabS2 - frontSideTabLen * 0.5 },
      { x: W, y: frontSideTabS2 - frontSideTabLen * 0.5 },
      { x: W, y: frontSideTabS2 + frontSideTabLen * 0.5 },
      { x: W - T, y: frontSideTabS2 + frontSideTabLen * 0.5 },
      { x: W - T, y: sAtLipTop },
      // Straight top lip edge
      { x: T, y: sAtLipTop },
      // Left edge with 2 protruding tabs into Left side wall tilted mortises
      { x: T, y: frontSideTabS2 + frontSideTabLen * 0.5 },
      { x: 0, y: frontSideTabS2 + frontSideTabLen * 0.5 },
      { x: 0, y: frontSideTabS2 - frontSideTabLen * 0.5 },
      { x: T, y: frontSideTabS2 - frontSideTabLen * 0.5 },
      { x: T, y: frontSideTabS1 + frontSideTabLen * 0.5 },
      { x: 0, y: frontSideTabS1 + frontSideTabLen * 0.5 },
      { x: 0, y: frontSideTabS1 - frontSideTabLen * 0.5 },
      { x: T, y: frontSideTabS1 - frontSideTabLen * 0.5 }
    ]);

    // =========================================================================
    // 5. OPTIONAL INTERNAL DIVIDERS (Linhas & Colunas)
    // =========================================================================
    const rowDivInfos = [];
    for (let r = 0; r < rowCentersZ.length; r++) {
      const zDiv = rowCentersZ[r];
      const topY = sideTopY(zDiv);
      const hDiv = Math.max(8, topY - yFloorTop);
      const midY = yFloorTop + hDiv * 0.5;
      const tabB = yFloorTop + hDiv * rowDivTabFracBot;
      const tabT = yFloorTop + hDiv * rowDivTabFracTop;

      const pts = [{ x: T, y: yFloorTop }];
      // Bottom-up cross-lap slots at each colCenterX
      for (let c = 0; c < colCentersX.length; c++) {
        const cx = colCentersX[c];
        pts.push(
          { x: cx - T * 0.5, y: yFloorTop },
          { x: cx - T * 0.5, y: midY },
          { x: cx + T * 0.5, y: midY },
          { x: cx + T * 0.5, y: yFloorTop }
        );
      }
      pts.push(
        { x: W - T, y: yFloorTop },
        { x: W - T, y: tabB },
        { x: W, y: tabB },
        { x: W, y: tabT },
        { x: W - T, y: tabT },
        { x: W - T, y: topY },
        { x: T, y: topY },
        { x: T, y: tabT },
        { x: 0, y: tabT },
        { x: 0, y: tabB },
        { x: T, y: tabB }
      );
      rowDivInfos.push({
        index: r + 1,
        zDiv,
        pts: ensureCCW(pts)
      });
    }

    // Column dividers (parallel to Side walls, spanning z in [zBackInner, zFrontInner])
    // Front edge tilts cleanly parallel to Frente's inner face!
    const colFrontTopZ = frontInnerOriginZ + uTilt.x * ((lipH - frontInnerOriginY) / uTilt.y);
    const colPtsRaw = [
      { x: zBackInner, y: yFloorTop },
      { x: zFloorFrontInner, y: yFloorTop },
      { x: colFrontTopZ, y: lipH }
    ];

    // Walk top sloped/horizontal edge right-to-left (from colFrontTopZ -> zBackInner),
    // carving top-down cross-lap notches at every rowCenterZ!
    const topBreakpoints = [];
    if (zTopEnd < colFrontTopZ - EPS && zTopEnd > zBackInner + EPS) {
      topBreakpoints.push({ type: 'corner', z: zTopEnd, y: H });
    }
    for (let r = 0; r < rowCentersZ.length; r++) {
      topBreakpoints.push({ type: 'slot', z: rowCentersZ[r] });
    }
    topBreakpoints.sort((a, b) => b.z - a.z);

    for (let i = 0; i < topBreakpoints.length; i++) {
      const bp = topBreakpoints[i];
      if (bp.type === 'corner') {
        colPtsRaw.push({ x: bp.z, y: bp.y });
      } else {
        const zR = bp.z + T * 0.5;
        const zL = bp.z - T * 0.5;
        const hAtSlot = Math.max(8, sideTopY(bp.z) - yFloorTop);
        const midY = yFloorTop + hAtSlot * 0.5;
        colPtsRaw.push(
          { x: zR, y: sideTopY(zR) },
          { x: zR, y: midY },
          { x: zL, y: midY },
          { x: zL, y: sideTopY(zL) }
        );
      }
    }

    // Back edge (u = zBackInner) with centered tab reaching into Traseira (u = zBackCenter - T/2)
    colPtsRaw.push(
      { x: zBackInner, y: H },
      { x: zBackInner, y: colBackTabTop },
      { x: zBackCenter - T * 0.5, y: colBackTabTop },
      { x: zBackCenter - T * 0.5, y: colBackTabBot },
      { x: zBackInner, y: colBackTabBot }
    );
    const colDivPts = ensureCCW(colPtsRaw);

    // =========================================================================
    // Assemble 1 single bin's panels (for 2D export), and `quantity` stacked copies (for 3D preview)
    // =========================================================================
    const totalStackH = quantity * H + lugH;
    const baseYOffset = -totalStackH * 0.5;

    function buildSingleBinPanels(binIndex) {
      const yBase = baseYOffset + binIndex * H;
      const suffix = quantity > 1 ? `-${binIndex + 1}` : '';
      const labelSuffix = quantity > 1 ? ` #${binIndex + 1}` : '';
      const list = [];

      // Esquerda (Left side wall): u = z in [0, D], v = y
      // X = -W/2 + T/2 - w, Y = yBase + v, Z = u - D/2 (right-handed!)
      list.push(createPanelObject(
        `esquerda${suffix}`, `Esquerda${labelSuffix}`, 'bin-side', sideOuterPts, sideHoles, T,
        (u, v, w) => [-W * 0.5 + T * 0.5 - w, yBase + v, u - D * 0.5],
        [-1, 0, 0]
      ));

      // Direita (Right side wall): same local coords mirrored on X
      // X = +W/2 - T/2 + w, Y = yBase + v, Z = u - D/2 -> wait check handedness!
      // dP/du = (0,0,+1), dP/dv = (0,+1,0) -> dP/du x dP/dv = (-1,0,0), so w must go (-1,0,0) => X = +W/2 - T/2 - w!
      list.push(createPanelObject(
        `direita${suffix}`, `Direita${labelSuffix}`, 'bin-side', sideOuterPts, sideHoles, T,
        (u, v, w) => [W * 0.5 - T * 0.5 - w, yBase + v, u - D * 0.5],
        [1, 0, 0]
      ));

      // Traseira (Back wall): u = x in [0, W], v = y
      // X = u - W/2, Y = yBase + v, Z = (zBackCenter - D/2) + w (right-handed: +X x +Y = +Z!)
      list.push(createPanelObject(
        `traseira${suffix}`, `Traseira${labelSuffix}`, 'bin-back', backPts, backHoles, T,
        (u, v, w) => [u - W * 0.5, yBase + v, (zBackCenter - D * 0.5) + w],
        [0, 0, -1]
      ));

      // Fundo (Bottom floor): u = x in [0, W], v = z
      // dP/du = (+1,0,0), dP/dv = (0,0,+1) -> dP/du x dP/dv = (0,-1,0), so Y = yBase + yFloorBot + T/2 - w!
      list.push(createPanelObject(
        `fundo${suffix}`, `Fundo${labelSuffix}`, 'bin-floor', floorPts, floorHoles, T,
        (u, v, w) => [u - W * 0.5, yBase + yFloorBot + T * 0.5 - w, v - D * 0.5],
        [0, -1, 0]
      ));

      // Frente (Tilted front lip): u = x in [0, W], v = s along uTilt
      // dP/du = (+1, 0, 0), dP/dv = (0, uTilt.y, uTilt.x)
      // dP/du x dP/dv = (0, -uTilt.x, +uTilt.y) = (0, -nTilt.y, -nTilt.x) -> outward normal of tilted lip!
      // Verify: nTilt = (-uTilt.y, uTilt.x) in (z, y) => in 3D (Y, Z) is (uTilt.x, -uTilt.y),
      // so -nTilt in (Y, Z) is (-uTilt.x, +uTilt.y) => EXACT match to dP/du x dP/dv!
      list.push(createPanelObject(
        `frente${suffix}`, `Frente${labelSuffix}`, 'bin-front', frontPts, [], T,
        (u, v, w) => [
          u - W * 0.5,
          yBase + frontOriginY + uTilt.y * v - nTilt.y * w,
          (frontOriginZ - D * 0.5) + uTilt.x * v - nTilt.x * w
        ],
        [0, 0.25, 1]
      ));

      // Row dividers
      for (let r = 0; r < rowDivInfos.length; r++) {
        const rd = rowDivInfos[r];
        list.push(createPanelObject(
          `div-linha-${rd.index}${suffix}`, `Div. Linha ${rd.index}${labelSuffix}`, 'bin-div', rd.pts, [], T,
          (u, v, w) => [u - W * 0.5, yBase + v, (rd.zDiv - D * 0.5) + w],
          [0, 0.75 + r * 0.12, 0]
        ));
      }

      // Column dividers
      for (let c = 0; c < colCentersX.length; c++) {
        const xDiv = colCentersX[c];
        list.push(createPanelObject(
          `div-coluna-${c + 1}${suffix}`, `Div. Coluna ${c + 1}${labelSuffix}`, 'bin-div', colDivPts, [], T,
          (u, v, w) => [(xDiv - W * 0.5) - w, yBase + v, u - D * 0.5],
          [0, 0.45 + c * 0.08, 0]
        ));
      }

      return list;
    }

    const allPanels3D = [];
    for (let q = 0; q < quantity; q++) {
      allPanels3D.push(...buildSingleBinPanels(q));
    }

    // For 2D export, pack `quantity` full sets (identical parts labeled cleanly)
    return {
      type: 'stackableBin',
      valid,
      thickness: T,
      rows,
      cols,
      quantity,
      lipHeight: lipH,
      outer: { width: W, height: totalStackH, depth: D, singleHeight: H },
      inner: {
        width: innerW,
        height: H - yFloorTop,
        depth: Math.max(10, zFloorFrontInner - zBackInner)
      },
      panelsPerBin: allPanels3D.length / quantity,
      panels: allPanels3D
    };
  }

  /**
   * Generate alternating living-hinge kerf slit segments inside a bend zone
   * [xStart, xStart + width] x [yBot, yTop].
   */
  function generateKerfSlits(xStart, width, yBot, yTop, T) {
    const slits = [];
    const h = yTop - yBot;
    if (width <= EPS || h <= EPS) return slits;

    const colSpacing = Math.max(2.0, T);
    let numCols = Math.max(4, Math.round(width / colSpacing));
    if (numCols % 2 !== 0) numCols += 1;
    const dx = width / numCols;

    // For short skirts (e.g. shallow lids), use 2-slit / 1-slit pattern so bridges stay strong
    const compact = h < 18;

    for (let k = 0; k < numCols; k++) {
      const x = xStart + (k + 0.5) * dx;
      if (compact) {
        if (k % 2 === 0) {
          slits.push(
            { x1: x, y1: yBot, x2: x, y2: yBot + h * 0.34 },
            { x1: x, y1: yBot + h * 0.66, x2: x, y2: yTop }
          );
        } else {
          slits.push({ x1: x, y1: yBot + h * 0.18, x2: x, y2: yBot + h * 0.82 });
        }
      } else {
        if (k % 2 === 0) {
          slits.push(
            { x1: x, y1: yBot, x2: x, y2: yBot + h * (1 / 16) },
            { x1: x, y1: yBot + h * (3 / 16), x2: x, y2: yBot + h * (7 / 16) },
            { x1: x, y1: yBot + h * (9 / 16), x2: x, y2: yBot + h * (13 / 16) },
            { x1: x, y1: yBot + h * (15 / 16), x2: x, y2: yTop }
          );
        } else {
          slits.push(
            { x1: x, y1: yBot, x2: x, y2: yBot + h * 0.25 },
            { x1: x, y1: yBot + h * 0.375, x2: x, y2: yBot + h * 0.625 },
            { x1: x, y1: yBot + h * 0.75, x2: x, y2: yTop }
          );
        }
      }
    }
    return slits;
  }

  /**
   * Build one curved-box assembly (either the main Kerf Box or its matching Curved Slip-Over Lid).
   * - isLid = false: Bottom cap (`Fundo`) at bottom, optional `Superior` at top if isClosed.
   * - isLid = true:  Top cap (`Tampa Superior`) at top, completely open flush rim at bottom.
   * Supports 1, 2, or 4 rounded bends with radius rIn.
   */
  function buildKerfAssembly(cfg) {
    const W_in = cfg.innerW;
    const D_in = cfg.innerD;
    const H_in = cfg.innerH;
    const T = cfg.thickness;
    const bends = cfg.bends; // 1, 2, or 4
    const rIn = cfg.rIn;
    const stretch = cfg.stretch || 0;
    const fingerSize = cfg.fingerSize;
    const isClosed = cfg.isClosed;
    const isLid = cfg.isLid;
    const yBase = cfg.yBase; // 3D Y coordinate of the bottom-most face of this assembly
    const idPrefix = cfg.idPrefix || '';
    const labelPrefix = cfg.labelPrefix || '';
    const explodeLiftY = cfg.explodeLiftY || 0;

    // Corner rounding flags in CCW order around box footprint (x in [-W_in/2, W_in/2], y in [-D_in/2, D_in/2]):
    // Corner 0: Bottom-Right (+W_in/2, -D_in/2) -> front-right in 3D (Z = -y = +D_in/2)
    // Corner 1: Top-Right    (+W_in/2, +D_in/2) -> back-right in 3D
    // Corner 2: Top-Left     (-W_in/2, +D_in/2) -> back-left in 3D
    // Corner 3: Bottom-Left  (-W_in/2, -D_in/2) -> front-left in 3D
    const roundC = [
      bends >= 1, // Front-Right (Corner 0)
      bends === 4, // Back-Right (Corner 1)
      bends === 4, // Back-Left (Corner 2)
      bends >= 2  // Front-Left (Corner 3)
    ];

    const rC = roundC.map(isR => (isR ? rIn : 0));
    const hw = W_in * 0.5;
    const hd = D_in * 0.5;

    // Straight span lengths along the 4 edges of the inner footprint:
    // Edge 0 (Front, y = -hd, x: -hw+r3 -> +hw-r0)
    // Edge 1 (Right, x = +hw, y: -hd+r0 -> +hd-r1)
    // Edge 2 (Back,  y = +hd, x: +hw-r1 -> -hw+r2)
    // Edge 3 (Left,  x = -hw, y: +hd-r2 -> -hd+r3)
    const lenFront = Math.max(0, W_in - rC[3] - rC[0]);
    const lenRight = Math.max(0, D_in - rC[0] - rC[1]);
    const lenBack  = Math.max(0, W_in - rC[1] - rC[2]);
    const lenLeft  = Math.max(0, D_in - rC[2] - rC[3]);

    const edgeFingers = [lenFront, lenRight, lenBack, lenLeft].map(len => {
      if (len < Math.max(4, T * 1.5)) return 0;
      return calcOddFingerCount(len, fingerSize);
    });

    const nV = calcOddFingerCount(H_in, fingerSize);
    const hasBottomCap = !isLid;
    const hasTopCap = isLid || isClosed;
    const wallTotalH = H_in + (hasBottomCap ? T : 0) + (hasTopCap ? T : 0);
    // In wall strip local Y: [0, wallTotalH]
    // Bottom cap slab occupies [0, T] (if hasBottomCap); cavity occupies [yCavBot, yCavTop]; top cap slab [yCavTop, wallTotalH]
    const yCavBot = hasBottomCap ? T : 0;
    const yCavTop = yCavBot + H_in;

    // Helper: push horizontal finger teeth along a straight cap edge from P0 -> P1 with outward normal N
    // Even indices stay IN (at inner footprint, i.e. 0), odd indices project OUT by +T into wall strip!
    function pushCapStraightEdge(pts, x0, y0, x1, y1, nx, ny, nSeg) {
      pts.push({ x: x0, y: y0 });
      if (nSeg >= 3) {
        const dx = (x1 - x0) / nSeg;
        const dy = (y1 - y0) / nSeg;
        for (let i = 0; i < nSeg; i++) {
          if (i % 2 === 1) {
            const ax = x0 + i * dx, ay = y0 + i * dy;
            const bx = x0 + (i + 1) * dx, by = y0 + (i + 1) * dy;
            pts.push(
              { x: ax, y: ay },
              { x: ax + nx * T, y: ay + ny * T },
              { x: bx + nx * T, y: by + ny * T },
              { x: bx, y: by }
            );
          }
        }
      }
      pts.push({ x: x1, y: y1 });
    }

    // Helper: push 90° quarter-circle arc on cap (radius rIn, flat edge, 16 segments)
    function pushCapArc(pts, cx, cy, startAng, endAng, segs) {
      for (let i = 1; i < segs; i++) {
        const a = startAng + (endAng - startAng) * (i / segs);
        pts.push({ x: cx + rIn * Math.cos(a), y: cy + rIn * Math.sin(a) });
      }
    }

    // =========================================================================
    // 1. CAP POLYGON (Fundo / Superior / Tampa Superior) in local 2D (x, y)
    //    Straight edges have odd-index tabs projecting OUT by +T;
    //    Curved corners are smooth R = rIn arcs; square corners are flush inner corners!
    // =========================================================================
    const capPtsRaw = [];
    const ARC_SEGS = 16;

    // Edge 0: Front (y = -hd, outward normal (0, -1))
    pushCapStraightEdge(capPtsRaw, -hw + rC[3], -hd, hw - rC[0], -hd, 0, -1, edgeFingers[0]);
    if (roundC[0]) pushCapArc(capPtsRaw, hw - rIn, -hd + rIn, -Math.PI / 2, 0, ARC_SEGS);

    // Edge 1: Right (x = +hw, outward normal (+1, 0))
    pushCapStraightEdge(capPtsRaw, hw, -hd + rC[0], hw, hd - rC[1], 1, 0, edgeFingers[1]);
    if (roundC[1]) pushCapArc(capPtsRaw, hw - rIn, hd - rIn, 0, Math.PI / 2, ARC_SEGS);

    // Edge 2: Back (y = +hd, outward normal (0, +1))
    pushCapStraightEdge(capPtsRaw, hw - rC[1], hd, -hw + rC[2], hd, 0, 1, edgeFingers[2]);
    if (roundC[2]) pushCapArc(capPtsRaw, -hw + rIn, hd - rIn, Math.PI / 2, Math.PI, ARC_SEGS);

    // Edge 3: Left (x = -hw, outward normal (-1, 0))
    pushCapStraightEdge(capPtsRaw, -hw, hd - rC[2], -hw, -hd + rC[3], -1, 0, edgeFingers[3]);
    if (roundC[3]) pushCapArc(capPtsRaw, -hw + rIn, -hd + rIn, Math.PI, Math.PI * 1.5, ARC_SEGS);

    const capPts = ensureCCW(capPtsRaw);

    // =========================================================================
    // 2. BUILD WRAP-AROUND FLEXIBLE STRIP (`Lado`) + ANY STRAIGHT PANELS (for bends = 1 or 2)
    // =========================================================================
    const arcLen2D = (Math.PI * 0.5) * rIn * (1 + stretch);

    /**
     * Describe a continuous wall strip as an ordered list of path segments in 2D footprint (x, y)
     * plus flat unfolded X positions, so we can build BOTH:
     *   a) Exact 2D flat SVG/DXF outline + staggered living-hinge kerf slits
     *   b) Exact 3D curved ribbon mesh (bent along arcs!) for WebGL preview
     */
    function createCurvedStripPanel(panelId, panelLabel, segList, leftEndMode, rightEndMode) {
      // Compute total unfolded length & segment offsets
      let totalFlatW = 0;
      const flatSegs = [];
      for (let i = 0; i < segList.length; i++) {
        const seg = segList[i];
        const w = seg.type === 'arc' ? arcLen2D : seg.len;
        flatSegs.push(Object.assign({}, seg, { x0: totalFlatW, x1: totalFlatW + w, flatW: w }));
        totalFlatW += w;
      }

      // Build 2D flat outline (CCW):
      // - Bottom edge (x: 0 -> totalFlatW): if hasBottomCap, outer edge is y = 0 with INWARD slots to y = T
      //   matching the cap's odd-index protruding tabs! If noBottomCap (lid), flat straight rim y = 0!
      // - Top edge (x: totalFlatW -> 0): if hasTopCap, outer edge is y = wallTotalH with INWARD slots to y = wallTotalH - T!
      //   If noTopCap (open box), flat straight rim y = wallTotalH!
      // - Left/Right ends: 'butt' (straight vertical edge) or 'tab-even' (vertical finger joint for bends=1,2).
      const flatPts = [];

      // Bottom edge: left -> right
      flatPts.push({ x: 0, y: 0 });
      if (hasBottomCap) {
        for (let i = 0; i < flatSegs.length; i++) {
          const s = flatSegs[i];
          if (s.type === 'straight' && s.nSeg >= 3) {
            const step = s.flatW / s.nSeg;
            for (let k = 0; k < s.nSeg; k++) {
              const segIdx = s.subOffset ? (k + s.subOffset) : k;
              // Match cap's odd-index protruding tabs with INWARD slots (y = T)
              if (segIdx % 2 === 1) {
                const ux0 = s.x0 + k * step;
                const ux1 = s.x0 + (k + 1) * step;
                flatPts.push(
                  { x: ux0, y: 0 },
                  { x: ux0, y: T },
                  { x: ux1, y: T },
                  { x: ux1, y: 0 }
                );
              }
            }
          }
        }
      }
      flatPts.push({ x: totalFlatW, y: 0 });

      // Right vertical edge: bottom -> top
      if (rightEndMode === 'finger-out') {
        const stepV = H_in / nV;
        flatPts.push({ x: totalFlatW, y: yCavBot });
        for (let j = 0; j < nV; j++) {
          const v0 = yCavBot + j * stepV;
          const v1 = yCavBot + (j + 1) * stepV;
          const x = (j % 2 === 0) ? (totalFlatW + T) : totalFlatW;
          flatPts.push({ x, y: v0 }, { x, y: v1 });
        }
        flatPts.push({ x: totalFlatW, y: yCavTop });
      }
      flatPts.push({ x: totalFlatW, y: wallTotalH });

      // Top edge: right -> left
      if (hasTopCap) {
        for (let i = flatSegs.length - 1; i >= 0; i--) {
          const s = flatSegs[i];
          if (s.type === 'straight' && s.nSeg >= 3) {
            const step = s.flatW / s.nSeg;
            for (let k = s.nSeg - 1; k >= 0; k--) {
              const segIdx = s.subOffset ? (k + s.subOffset) : k;
              if (segIdx % 2 === 1) {
                const ux1 = s.x0 + (k + 1) * step;
                const ux0 = s.x0 + k * step;
                flatPts.push(
                  { x: ux1, y: wallTotalH },
                  { x: ux1, y: wallTotalH - T },
                  { x: ux0, y: wallTotalH - T },
                  { x: ux0, y: wallTotalH }
                );
              }
            }
          }
        }
      }
      flatPts.push({ x: 0, y: wallTotalH });

      // Left vertical edge: top -> bottom
      if (leftEndMode === 'finger-out') {
        const stepV = H_in / nV;
        flatPts.push({ x: 0, y: yCavTop });
        for (let j = nV - 1; j >= 0; j--) {
          const v1 = yCavBot + (j + 1) * stepV;
          const v0 = yCavBot + j * stepV;
          const x = (j % 2 === 0) ? -T : 0;
          flatPts.push({ x, y: v1 }, { x, y: v0 });
        }
        flatPts.push({ x: 0, y: yCavBot });
      }

      const outlineLocal = ensureCCW(flatPts);
      const bbox = getBBox(outlineLocal);
      const outline2D = outlineLocal.map(p => ({ x: p.x - bbox.minX, y: p.y - bbox.minY }));

      // Generate living-hinge kerf slits inside every arc bend zone
      const slits2D = [];
      for (let i = 0; i < flatSegs.length; i++) {
        const s = flatSegs[i];
        if (s.type === 'arc') {
          const rawSlits = generateKerfSlits(s.x0, s.flatW, 0, wallTotalH, T);
          for (let m = 0; m < rawSlits.length; m++) {
            const sl = rawSlits[m];
            slits2D.push({
              x1: sl.x1 - bbox.minX,
              y1: sl.y1 - bbox.minY,
              x2: sl.x2 - bbox.minX,
              y2: sl.y2 - bbox.minY
            });
          }
        }
      }

      // Build custom 3D curved extruded ribbon mesh directly along flatSegs!
      function buildCurvedMesh3D() {
        const positions = [];
        const normals = [];
        const linePositions = [];

        function pushTri(p0, p1, p2) {
          const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
          const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
          let nx = uy * vz - uz * vy;
          let ny = uz * vx - ux * vz;
          let nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          positions.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
          normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        }

        function pushQuad(a, b, c, d) {
          pushTri(a, b, c);
          pushTri(a, c, d);
        }

        function pushLine(a, b) {
          linePositions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }

        // Convert 2D footprint (fx, fy) + wall height yLocal to 3D (X = fx, Y = yBase + yLocal, Z = -fy)
        function to3D(fx, fy, yLocal) {
          return [fx, yBase + yLocal, -fy];
        }

        // Build each segment cleanly as solid extruded prisms (straight segments with exact finger notches,
        // arc segments as smooth 16-slice curved wall with decorative living-hinge slit lines on outer face!)
        for (let i = 0; i < flatSegs.length; i++) {
          const s = flatSegs[i];
          if (s.type === 'straight') {
            // Extrude straight wall piece along its exact 2D segment [x0, x1] (and finger ends if applicable)
            const xStartLocal = (i === 0 && leftEndMode === 'finger-out') ? -T : 0;
            const xEndLocal = (i === flatSegs.length - 1 && rightEndMode === 'finger-out') ? (s.flatW + T) : s.flatW;
            const segPolyPts = [{ x: 0, y: 0 }];
            if (hasBottomCap && s.nSeg >= 3) {
              const step = s.flatW / s.nSeg;
              for (let k = 0; k < s.nSeg; k++) {
                const segIdx = s.subOffset ? (k + s.subOffset) : k;
                if (segIdx % 2 === 1) {
                  segPolyPts.push(
                    { x: k * step, y: 0 }, { x: k * step, y: T },
                    { x: (k + 1) * step, y: T }, { x: (k + 1) * step, y: 0 }
                  );
                }
              }
            }
            segPolyPts.push({ x: s.flatW, y: 0 });
            if (i === flatSegs.length - 1 && rightEndMode === 'finger-out') {
              const stepV = H_in / nV;
              segPolyPts.push({ x: s.flatW, y: yCavBot });
              for (let j = 0; j < nV; j++) {
                const v0 = yCavBot + j * stepV, v1 = yCavBot + (j + 1) * stepV;
                const u = (j % 2 === 0) ? xEndLocal : s.flatW;
                segPolyPts.push({ x: u, y: v0 }, { x: u, y: v1 });
              }
              segPolyPts.push({ x: s.flatW, y: yCavTop });
            }
            segPolyPts.push({ x: s.flatW, y: wallTotalH });
            if (hasTopCap && s.nSeg >= 3) {
              const step = s.flatW / s.nSeg;
              for (let k = s.nSeg - 1; k >= 0; k--) {
                const segIdx = s.subOffset ? (k + s.subOffset) : k;
                if (segIdx % 2 === 1) {
                  segPolyPts.push(
                    { x: (k + 1) * step, y: wallTotalH }, { x: (k + 1) * step, y: wallTotalH - T },
                    { x: k * step, y: wallTotalH - T }, { x: k * step, y: wallTotalH }
                  );
                }
              }
            }
            segPolyPts.push({ x: 0, y: wallTotalH });
            if (i === 0 && leftEndMode === 'finger-out') {
              const stepV = H_in / nV;
              segPolyPts.push({ x: 0, y: yCavTop });
              for (let j = nV - 1; j >= 0; j--) {
                const v1 = yCavBot + (j + 1) * stepV, v0 = yCavBot + j * stepV;
                const u = (j % 2 === 0) ? xStartLocal : 0;
                segPolyPts.push({ x: u, y: v1 }, { x: u, y: v0 });
              }
              segPolyPts.push({ x: 0, y: yCavBot });
            }

            const cleanPts = ensureCCW(segPolyPts);
            const tris = triangulatePolygon(cleanPts);
            const dx = (s.p1.x - s.p0.x) / Math.max(EPS, s.len);
            const dy = (s.p1.y - s.p0.y) / Math.max(EPS, s.len);
            const nx = dy;
            const ny = -dx;

            // w = 0 is inner face, w = T is outer face
            function mapStraight(u, v, w) {
              return to3D(s.p0.x + dx * u + nx * w, s.p0.y + dy * u + ny * w, v);
            }

            // Outer face (w = T) and inner face (w = 0)
            for (let tIdx = 0; tIdx < tris.length; tIdx += 3) {
              const a = cleanPts[tris[tIdx]], b = cleanPts[tris[tIdx + 1]], c = cleanPts[tris[tIdx + 2]];
              pushTri(mapStraight(a.x, a.y, T), mapStraight(b.x, b.y, T), mapStraight(c.x, c.y, T));
              pushTri(mapStraight(a.x, a.y, 0), mapStraight(c.x, c.y, 0), mapStraight(b.x, b.y, 0));
            }
            for (let pIdx = 0; pIdx < cleanPts.length; pIdx++) {
              const a = cleanPts[pIdx], b = cleanPts[(pIdx + 1) % cleanPts.length];
              const aO = mapStraight(a.x, a.y, T), bO = mapStraight(b.x, b.y, T);
              const aI = mapStraight(a.x, a.y, 0), bI = mapStraight(b.x, b.y, 0);
              pushQuad(aO, aI, bI, bO);
              // Suppress artificial seam lines between continuous straight & arc transitions
              const isLeftSeam = Math.abs(a.x) < EPS && Math.abs(b.x) < EPS && i > 0;
              const isRightSeam = Math.abs(a.x - s.flatW) < EPS && Math.abs(b.x - s.flatW) < EPS && i < flatSegs.length - 1;
              if (!isLeftSeam && !isRightSeam) {
                pushLine(aO, bO);
                pushLine(aI, bI);
                if (Math.abs(a.x) > EPS && Math.abs(a.x - s.flatW) > EPS) {
                  pushLine(aO, aI);
                }
              }
            }
          } else if (s.type === 'arc') {
            // Smooth 16-segment curved quarter-cylinder wall (radius rIn -> rIn + T)
            const rOut = rIn + T;
            for (let k = 0; k < ARC_SEGS; k++) {
              const a0 = s.startAng + (s.endAng - s.startAng) * (k / ARC_SEGS);
              const a1 = s.startAng + (s.endAng - s.startAng) * ((k + 1) / ARC_SEGS);
              const c0 = Math.cos(a0), s0 = Math.sin(a0);
              const c1 = Math.cos(a1), s1 = Math.sin(a1);

              const inB0 = to3D(s.cx + rIn * c0, s.cy + rIn * s0, 0);
              const inB1 = to3D(s.cx + rIn * c1, s.cy + rIn * s1, 0);
              const inT0 = to3D(s.cx + rIn * c0, s.cy + rIn * s0, wallTotalH);
              const inT1 = to3D(s.cx + rIn * c1, s.cy + rIn * s1, wallTotalH);

              const outB0 = to3D(s.cx + rOut * c0, s.cy + rOut * s0, 0);
              const outB1 = to3D(s.cx + rOut * c1, s.cy + rOut * s1, 0);
              const outT0 = to3D(s.cx + rOut * c0, s.cy + rOut * s0, wallTotalH);
              const outT1 = to3D(s.cx + rOut * c1, s.cy + rOut * s1, wallTotalH);

              // Outer curved surface
              pushQuad(outB0, outB1, outT1, outT0);
              // Inner curved surface
              pushQuad(inB1, inB0, inT0, inT1);
              // Top rim
              pushQuad(outT0, outT1, inT1, inT0);
              // Bottom rim
              pushQuad(inB0, inB1, outB1, outB0);

              // Clean top & bottom arc outlines
              pushLine(outT0, outT1);
              pushLine(inT0, inT1);
              pushLine(outB0, outB1);
              pushLine(inB0, inB1);
            }

            // Draw crisp visual living-hinge slit ticks on the curved 3D exterior surface!
            const rawSlits = generateKerfSlits(0, arcLen2D, 0, wallTotalH, T);
            const rVis = rOut + 0.08;
            for (let m = 0; m < rawSlits.length; m++) {
              const sl = rawSlits[m];
              const frac = sl.x1 / Math.max(EPS, arcLen2D);
              const ang = s.startAng + (s.endAng - s.startAng) * frac;
              const fx = s.cx + rVis * Math.cos(ang);
              const fy = s.cy + rVis * Math.sin(ang);
              pushLine(to3D(fx, fy, sl.y1), to3D(fx, fy, sl.y2));
            }
          }
        }

        return {
          positions: new Float32Array(positions),
          normals: new Float32Array(normals),
          linePositions: new Float32Array(linePositions),
          explodeDir: [0, explodeLiftY, 0.35]
        };
      }

      return {
        id: panelId,
        label: panelLabel,
        category: isLid ? 'kerf-lid-wrap' : 'kerf-wrap',
        localPts: outlineLocal,
        localHoles: [],
        outline2D,
        holes2D: [],
        slits2D,
        bbox,
        width: bbox.width,
        height: bbox.height,
        thickness: T,
        customMesh3D: buildCurvedMesh3D,
        explodeDir: [0, explodeLiftY, 0.35]
      };
    }

    // Helper: build straight square wall panel (used for Back / Left in 1-bend & 2-bend modes)
    function createSquareWallPanel(panelId, panelLabel, spanLen, nEdgeH, leftIn, rightIn, mapPoint3D, explodeDir) {
      const pts = [{ x: 0, y: 0 }];
      if (hasBottomCap && nEdgeH >= 3) {
        const step = spanLen / nEdgeH;
        for (let k = 0; k < nEdgeH; k++) {
          if (k % 2 === 1) {
            pts.push(
              { x: k * step, y: 0 }, { x: k * step, y: T },
              { x: (k + 1) * step, y: T }, { x: (k + 1) * step, y: 0 }
            );
          }
        }
      }
      pts.push({ x: spanLen, y: 0 });

      // Right vertical edge
      const stepV = H_in / nV;
      pts.push({ x: spanLen, y: yCavBot });
      for (let j = 0; j < nV; j++) {
        const v0 = yCavBot + j * stepV, v1 = yCavBot + (j + 1) * stepV;
        const isOut = rightIn ? (j % 2 === 1) : (j % 2 === 0);
        const x = isOut ? (spanLen + T) : spanLen;
        pts.push({ x, y: v0 }, { x, y: v1 });
      }
      pts.push({ x: spanLen, y: yCavTop }, { x: spanLen, y: wallTotalH });

      // Top edge
      if (hasTopCap && nEdgeH >= 3) {
        const step = spanLen / nEdgeH;
        for (let k = nEdgeH - 1; k >= 0; k--) {
          if (k % 2 === 1) {
            pts.push(
              { x: (k + 1) * step, y: wallTotalH }, { x: (k + 1) * step, y: wallTotalH - T },
              { x: k * step, y: wallTotalH - T }, { x: k * step, y: wallTotalH }
            );
          }
        }
      }
      pts.push({ x: 0, y: wallTotalH }, { x: 0, y: yCavTop });

      // Left vertical edge
      for (let j = nV - 1; j >= 0; j--) {
        const v1 = yCavBot + (j + 1) * stepV, v0 = yCavBot + j * stepV;
        const isOut = leftIn ? (j % 2 === 1) : (j % 2 === 0);
        const x = isOut ? -T : 0;
        pts.push({ x, y: v1 }, { x, y: v0 });
      }
      pts.push({ x: 0, y: yCavBot });

      return createPanelObject(
        panelId, panelLabel, isLid ? 'kerf-lid-wall' : 'kerf-wall',
        ensureCCW(pts), [], T, mapPoint3D, explodeDir
      );
    }

    const panels = [];

    // Cap panels
    if (hasBottomCap) {
      panels.push(createPanelObject(
        `${idPrefix}fundo`, `${labelPrefix}Fundo`, 'kerf-cap', capPts, [], T,
        (u, v, w) => [u, yBase + T * 0.5 + w, -v],
        [0, -1 + explodeLiftY, 0]
      ));
    }
    if (hasTopCap) {
      panels.push(createPanelObject(
        `${idPrefix}superior`, isLid ? 'Tampa Superior' : 'Superior',
        isLid ? 'kerf-lid-cap' : 'kerf-cap', capPts, [], T,
        (u, v, w) => [u, yBase + wallTotalH - T * 0.5 + w, -v],
        [0, 1 + explodeLiftY, 0]
      ));
    }

    // Wrap-around wall strip + any straight walls
    if (bends === 4) {
      // 1 continuous 4-bend wrap strip starting & ending at midpoint of Right edge (x = +hw, y = 0)
      // Wait: to keep exact finger alignment on split Right edge, split even/odd cleanly!
      const rightHalfLen = lenRight * 0.5;
      const rightMid = { x: hw, y: 0 };
      const segs = [
        // Second half of Right edge -> Corner 1 -> Back -> Corner 2 -> Left -> Corner 3 -> Front -> Corner 0 -> First half of Right edge
        { type: 'straight', p0: rightMid, p1: { x: hw, y: hd - rIn }, len: rightHalfLen, nSeg: Math.max(3, calcOddFingerCount(rightHalfLen, fingerSize)) },
        { type: 'arc', cx: hw - rIn, cy: hd - rIn, startAng: 0, endAng: Math.PI / 2 },
        { type: 'straight', p0: { x: hw - rIn, y: hd }, p1: { x: -hw + rIn, y: hd }, len: lenBack, nSeg: edgeFingers[2] },
        { type: 'arc', cx: -hw + rIn, cy: hd - rIn, startAng: Math.PI / 2, endAng: Math.PI },
        { type: 'straight', p0: { x: -hw, y: hd - rIn }, p1: { x: -hw, y: -hd + rIn }, len: lenLeft, nSeg: edgeFingers[3] },
        { type: 'arc', cx: -hw + rIn, cy: -hd + rIn, startAng: Math.PI, endAng: Math.PI * 1.5 },
        { type: 'straight', p0: { x: -hw + rIn, y: -hd }, p1: { x: hw - rIn, y: -hd }, len: lenFront, nSeg: edgeFingers[0] },
        { type: 'arc', cx: hw - rIn, cy: -hd + rIn, startAng: -Math.PI / 2, endAng: 0 },
        { type: 'straight', p0: { x: hw, y: -hd + rIn }, p1: rightMid, len: rightHalfLen, nSeg: Math.max(3, calcOddFingerCount(rightHalfLen, fingerSize)) }
      ];
      // Note: align cap's Right edge finger count with the two halves so tabs match 100%!
      const halfN = segs[0].nSeg;
      // Rebuild capPts with split right-edge fingers so cap tabs match the split wrap strip 100%
      const cap4 = [];
      pushCapStraightEdge(cap4, -hw + rIn, -hd, hw - rIn, -hd, 0, -1, edgeFingers[0]);
      pushCapArc(cap4, hw - rIn, -hd + rIn, -Math.PI / 2, 0, ARC_SEGS);
      pushCapStraightEdge(cap4, hw, -hd + rIn, hw, 0, 1, 0, halfN);
      pushCapStraightEdge(cap4, hw, 0, hw, hd - rIn, 1, 0, halfN);
      pushCapArc(cap4, hw - rIn, hd - rIn, 0, Math.PI / 2, ARC_SEGS);
      pushCapStraightEdge(cap4, hw - rIn, hd, -hw + rIn, hd, 0, 1, edgeFingers[2]);
      pushCapArc(cap4, -hw + rIn, hd - rIn, Math.PI / 2, Math.PI, ARC_SEGS);
      pushCapStraightEdge(cap4, -hw, hd - rIn, -hw, -hd + rIn, -1, 0, edgeFingers[3]);
      pushCapArc(cap4, -hw + rIn, -hd + rIn, Math.PI, Math.PI * 1.5, ARC_SEGS);
      const exactCap4 = ensureCCW(cap4);
      // Replace cap panels with exact-matched cap4
      panels.forEach(p => {
        p.localPts = exactCap4;
        p.bbox = getBBox(exactCap4);
        p.outline2D = exactCap4.map(pt => ({ x: pt.x - p.bbox.minX, y: pt.y - p.bbox.minY }));
        p.width = p.bbox.width;
        p.height = p.bbox.height;
      });

      panels.push(createCurvedStripPanel(
        `${idPrefix}lado`, isLid ? 'Tampa Lado' : 'Lado', segs, 'butt', 'butt'
      ));
    } else if (bends === 2) {
      // 2 curved front corners (Left -> Corner 3 -> Front -> Corner 0 -> Right) + straight Back panel
      const segs = [
        { type: 'straight', p0: { x: -hw, y: hd }, p1: { x: -hw, y: -hd + rIn }, len: lenLeft, nSeg: edgeFingers[3] },
        { type: 'arc', cx: -hw + rIn, cy: -hd + rIn, startAng: Math.PI, endAng: Math.PI * 1.5 },
        { type: 'straight', p0: { x: -hw + rIn, y: -hd }, p1: { x: hw - rIn, y: -hd }, len: lenFront, nSeg: edgeFingers[0] },
        { type: 'arc', cx: hw - rIn, cy: -hd + rIn, startAng: -Math.PI / 2, endAng: 0 },
        { type: 'straight', p0: { x: hw, y: -hd + rIn }, p1: { x: hw, y: hd }, len: lenRight, nSeg: edgeFingers[1] }
      ];
      panels.push(createCurvedStripPanel(
        `${idPrefix}lado-curvo`, isLid ? 'Tampa Lado Curvo' : 'Lado Curvo', segs, 'finger-out', 'finger-out'
      ));
      // Straight Back wall (y = +hd, Z = -hd - T/2)
      panels.push(createSquareWallPanel(
        `${idPrefix}traseira`, isLid ? 'Tampa Traseira' : 'Traseira',
        lenBack, edgeFingers[2], true, true,
        (u, v, w) => [hw - u, yBase + v, -hd - T * 0.5 - w],
        [0, explodeLiftY, -1]
      ));
    } else {
      // 1 curved corner (Front-Right: Front -> Corner 0 -> Right) + straight Back & Left walls
      const segs = [
        { type: 'straight', p0: { x: -hw, y: -hd }, p1: { x: hw - rIn, y: -hd }, len: lenFront, nSeg: edgeFingers[0] },
        { type: 'arc', cx: hw - rIn, cy: -hd + rIn, startAng: -Math.PI / 2, endAng: 0 },
        { type: 'straight', p0: { x: hw, y: -hd + rIn }, p1: { x: hw, y: hd }, len: lenRight, nSeg: edgeFingers[1] }
      ];
      panels.push(createCurvedStripPanel(
        `${idPrefix}lado-curvo`, isLid ? 'Tampa Lado Curvo' : 'Lado Curvo', segs, 'finger-out', 'finger-out'
      ));
      // Straight Back wall (left end meets Right curved strip -> complement true; right end meets Left wall -> false)
      panels.push(createSquareWallPanel(
        `${idPrefix}traseira`, isLid ? 'Tampa Traseira' : 'Traseira',
        lenBack, edgeFingers[2], true, false,
        (u, v, w) => [hw - u, yBase + v, -hd - T * 0.5 - w],
        [0, explodeLiftY, -1]
      ));
      // Straight Left wall (left end meets Back wall -> complement true; right end meets Front curved strip -> true)
      panels.push(createSquareWallPanel(
        `${idPrefix}esquerda`, isLid ? 'Tampa Esquerda' : 'Esquerda',
        lenLeft, edgeFingers[3], true, true,
        (u, v, w) => [-hw - T * 0.5 - w, yBase + v, -hd + u],
        [-1, explodeLiftY, 0]
      ));
    }

    return panels;
  }

  /**
   * Build the complete Kerf Bent Box model (Caixa Curvada) supporting:
   * - enclosureMode: 'open' (Aberta), 'closed' (Fechada), or 'lid' (Com Tampa curva!)
   * - bends: 1, 2, or 4 rounded living-hinge corners
   * - bendRadius, stretch (-0.1..+0.1), fingerSize
   * - lidHeight, lidClearance, lidRaised (for 'lid' mode)
   */
  function buildKerfBoxModel(params) {
    const T = Math.max(0.2, Number(params.thickness) || 3);
    const isOutside = params.dimRef !== 'inside';
    const mode = params.enclosureMode || 'open'; // 'open' | 'closed' | 'lid'
    const isClosed = mode === 'closed';
    const hasLid = mode === 'lid';
    const bends = [1, 2, 4].includes(Number(params.bends)) ? Number(params.bends) : 4;
    const stretch = Math.max(-0.1, Math.min(0.1, Number(params.stretch) || 0));

    const rawW = Math.max(10, Number(params.width) || 156);
    const rawH = Math.max(10, Number(params.height) || 78);
    const rawD = Math.max(10, Number(params.depth) || 206);
    const rawR = Math.max(4, Number(params.bendRadius) || 53);

    const rawInW = isOutside ? (rawW - 2 * T) : rawW;
    const rawInD = isOutside ? (rawD - 2 * T) : rawD;
    const rawInH = isOutside ? (rawH - (isClosed ? 2 * T : T)) : rawH;
    const rawInR = isOutside ? (rawR - T) : rawR;

    const minDim = Math.max(20, T * 6);
    const minH = Math.max(12, T * 3);
    const innerW = Math.max(rawInW, minDim);
    const innerD = Math.max(rawInD, minDim);
    const innerH = Math.max(rawInH, minH);

    // Maximum valid bend radius so rounded corners don't overlap each other
    const maxRIn = bends === 1
      ? Math.min(innerW - T * 2, innerD - T * 2)
      : bends === 2
        ? Math.min(innerW * 0.5, innerD - T * 2)
        : Math.min(innerW * 0.5, innerD * 0.5);
    const minRIn = Math.max(6, T * 2);
    const rIn = Math.max(minRIn, Math.min(maxRIn, rawInR));

    const outerW = innerW + 2 * T;
    const outerD = innerD + 2 * T;
    const outerH = innerH + (isClosed ? 2 * T : T);
    const outerR = rIn + T;

    // Suggested minimum bend radius based on material thickness (matches MakerCase ~45mm at 3mm)
    const suggestedMinRadiusIn = Number((5 * T * T).toFixed(2));
    const suggestedMinRadius = isOutside ? (suggestedMinRadiusIn + T) : suggestedMinRadiusIn;

    // Straight spans for finger size slider bounds
    const straightSpans = [];
    const sW = bends >= 2 ? (innerW - 2 * rIn) : (innerW - rIn);
    const sD = bends === 4 ? (innerD - 2 * rIn) : (innerD - rIn);
    if (sW >= T * 2) straightSpans.push(sW);
    if (sD >= T * 2) straightSpans.push(sD);
    if (bends === 4 && sD >= T * 4) straightSpans.push(sD * 0.5);
    straightSpans.push(innerH);

    const minSpan = Math.min(...straightSpans);
    const minFinger = Number(Math.max(1.5, Math.min(2 * T, minSpan / 2)).toFixed(2));
    const maxFinger = Number(Math.max(minFinger + 0.5, Math.min(25, minSpan * 0.5)).toFixed(2));
    const clampedFinger = Math.min(maxFinger, Math.max(minFinger, Number(params.fingerSize) || 6));

    const valid = rawInW >= minDim && rawInD >= minDim && rawInH >= minH;
    const radiusWarning = rIn < suggestedMinRadiusIn * 0.98;

    // Lid dimensions (when mode === 'lid')
    const lidClearance = Math.max(0, Math.min(5, Number(params.lidClearance) || 0.5));
    const lidInnerH = Math.max(Math.max(8, T * 2.5), Number(params.lidHeight) || 25);
    const lidRaised = Boolean(params.lidRaised);

    const totalDisplayH = hasLid
      ? (outerH + T + (lidRaised ? lidInnerH * 1.15 : 0))
      : outerH;
    const boxYBase = -totalDisplayH * 0.5;

    const panels = buildKerfAssembly({
      innerW,
      innerD,
      innerH,
      thickness: T,
      bends,
      rIn,
      stretch,
      fingerSize: clampedFinger,
      isClosed,
      isLid: false,
      yBase: boxYBase,
      idPrefix: '',
      labelPrefix: '',
      explodeLiftY: 0
    });

    let lidInfo = null;
    if (hasLid) {
      const lidInnerW = outerW + 2 * lidClearance;
      const lidInnerD = outerD + 2 * lidClearance;
      const lidRIn = outerR + lidClearance;
      const lidOuterH = lidInnerH + T;

      // Seat lid right over the top of the open box (top cap rests on box rim + 0.3mm),
      // or lift above the box if lidRaised is active!
      const lidYSeated = boxYBase + outerH + T - lidOuterH + 0.4;
      const lidYBase = lidRaised ? (boxYBase + outerH + lidInnerH * 0.85) : lidYSeated;

      const lidPanels = buildKerfAssembly({
        innerW: lidInnerW,
        innerD: lidInnerD,
        innerH: lidInnerH,
        thickness: T,
        bends,
        rIn: lidRIn,
        stretch,
        fingerSize: clampedFinger,
        isClosed: false,
        isLid: true,
        yBase: lidYBase,
        idPrefix: 'tampa-',
        labelPrefix: 'Tampa ',
        explodeLiftY: 1.4
      });

      panels.push(...lidPanels);
      lidInfo = {
        innerWidth: lidInnerW,
        innerDepth: lidInnerD,
        innerHeight: lidInnerH,
        innerRadius: lidRIn,
        outerWidth: lidInnerW + 2 * T,
        outerDepth: lidInnerD + 2 * T,
        outerHeight: lidOuterH
      };
    }

    return {
      type: 'kerf',
      valid,
      radiusWarning,
      mode,
      bends,
      stretch,
      thickness: T,
      suggestedMinRadius,
      inner: { width: innerW, height: innerH, depth: innerD, radius: rIn },
      outer: {
        width: lidInfo ? lidInfo.outerWidth : outerW,
        height: totalDisplayH,
        depth: lidInfo ? lidInfo.outerDepth : outerD,
        boxWidth: outerW,
        boxHeight: outerH,
        boxDepth: outerD,
        boxRadius: outerR
      },
      lid: lidInfo,
      finger: {
        size: clampedFinger,
        limits: { min: minFinger, max: maxFinger }
      },
      panels
    };
  }

  /**
   * Apply exact outward kerf offset to an orthogonal polygon.
   * Works automatically for BOTH CCW outer contours (expands outward)
   * AND CW interior holes (shrinks inward into the hole!).
   */
  function applyKerfOffset(pts, kerf) {
    const k = Number(kerf) || 0;
    if (Math.abs(k) <= EPS || pts.length < 3) {
      return pts.map(p => ({ x: p.x, y: p.y }));
    }

    let minEdge = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < minEdge) minEdge = len;
    }
    const safeK = Math.max(0, Math.min(k, minEdge * 0.42));
    if (safeK <= EPS) {
      return pts.map(p => ({ x: p.x, y: p.y }));
    }

    const n = pts.length;
    const shifted = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const nx = dy / len;
      const ny = -dx / len;
      shifted.push({
        x1: a.x + nx * safeK,
        y1: a.y + ny * safeK,
        dx: dx / len,
        dy: dy / len
      });
    }

    const out = [];
    for (let i = 0; i < n; i++) {
      const prev = shifted[(i - 1 + n) % n];
      const curr = shifted[i];
      const denom = prev.dx * curr.dy - prev.dy * curr.dx;
      if (Math.abs(denom) <= EPS) {
        out.push({ x: curr.x1, y: curr.y1 });
      } else {
        const t = ((curr.x1 - prev.x1) * curr.dy - (curr.y1 - prev.y1) * curr.dx) / denom;
        out.push({
          x: prev.x1 + prev.dx * t,
          y: prev.y1 + prev.dy * t
        });
      }
    }
    return out;
  }

  /**
   * Build exact geometric path primitives (lines + optional CNC dogbone arcs)
   * from a CCW outer polygon OR a CW interior hole polygon.
   */
  function buildPathSegments(rawPts, compType, compValue) {
    let pts = rawPts;
    if (compType === 'kerf') {
      pts = applyKerfOffset(rawPts, compValue);
    }

    const n = pts.length;
    const useDogbone = compType === 'corner' && Number(compValue) > 0;
    const nominalR = useDogbone ? Number(compValue) * 0.5 : 0;

    const edgeDirs = [];
    const edgeLens = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      edgeLens.push(len);
      edgeDirs.push({ x: dx / len, y: dy / len });
    }

    const corners = new Array(n).fill(null);
    if (useDogbone) {
      for (let i = 0; i < n; i++) {
        const prevIdx = (i - 1 + n) % n;
        const uIn = edgeDirs[prevIdx];
        const uOut = edgeDirs[i];
        const cross = uIn.x * uOut.y - uIn.y * uOut.x;
        if (cross < -0.5) {
          const maxTrim = Math.min(edgeLens[prevIdx], edgeLens[i]) * 0.46;
          const trim = Math.min(nominalR * Math.SQRT2, maxTrim);
          const r = trim / Math.SQRT2;
          if (r > 0.05) {
            const C = pts[i];
            const p1 = { x: C.x - uIn.x * trim, y: C.y - uIn.y * trim };
            const p2 = { x: C.x + uOut.x * trim, y: C.y + uOut.y * trim };
            const cx = (p1.x + p2.x) * 0.5;
            const cy = (p1.y + p2.y) * 0.5;
            const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
            const endAngle = Math.atan2(p2.y - cy, p2.x - cx);
            corners[i] = {
              trim,
              r,
              p1,
              p2,
              cx,
              cy,
              startAngle,
              endAngle,
              ccw: false
            };
          }
        }
      }
    }

    const segments = [];
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const cStart = corners[i];
      const cEnd = corners[nextIdx];
      const pStart = cStart ? cStart.p2 : pts[i];
      const pEnd = cEnd ? cEnd.p1 : pts[nextIdx];

      if (Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y) > EPS) {
        segments.push({
          type: 'line',
          x1: pStart.x,
          y1: pStart.y,
          x2: pEnd.x,
          y2: pEnd.y
        });
      }

      if (cEnd) {
        segments.push({
          type: 'arc',
          cx: cEnd.cx,
          cy: cEnd.cy,
          r: cEnd.r,
          x1: cEnd.p1.x,
          y1: cEnd.p1.y,
          x2: cEnd.p2.x,
          y2: cEnd.p2.y,
          startAngle: cEnd.startAngle,
          endAngle: cEnd.endAngle,
          ccw: false
        });
      }
    }

    return segments;
  }

  /**
   * Arrange outer panels (2-column compact grid) plus any internal divider panels
   * cleanly below in packed horizontal rows.
   */
  function layoutPanels(panels, layoutMode, spacingMm) {
    const gap = layoutMode === 'combine' ? 0 : Math.max(0, Number(spacingMm) || 0);

    // Single panel (used when exporting separate files)
    if (panels.length === 1) {
      const p = panels[0];
      return {
        width: p.width,
        height: p.height,
        items: [{ panel: p, x: 0, y: 0 }]
      };
    }

    // Polygon box layout: pack Lado 1..N in columns of 3 on top, Fundo/Topo side-by-side below
    if (panels.some(p => p.category === 'poly-side' || p.category === 'poly-cap')) {
      const sides = panels.filter(p => p.category === 'poly-side');
      const caps = panels.filter(p => p.category === 'poly-cap');

      const rowsPerCol = sides.length <= 4 ? 2 : 3;
      const numCols = Math.ceil(sides.length / rowsPerCol);
      const sideW = sides.reduce((m, p) => Math.max(m, p.width), 0);
      const sideH = sides.reduce((m, p) => Math.max(m, p.height), 0);

      const sidesBlockW = numCols > 0 ? numCols * sideW + Math.max(0, numCols - 1) * gap : 0;
      const usedRows = Math.min(rowsPerCol, sides.length);
      const sidesBlockH = usedRows > 0 ? usedRows * sideH + Math.max(0, usedRows - 1) * gap : 0;

      const capsW = caps.reduce((s, p) => s + p.width, 0) + Math.max(0, caps.length - 1) * gap;
      const capsH = caps.reduce((m, p) => Math.max(m, p.height), 0);

      const totalW = Math.max(sidesBlockW, capsW);
      const totalH = sidesBlockH + (capsH > 0 && sidesBlockH > 0 ? gap : 0) + capsH;
      const placed = [];

      // Place sides top-down by column
      for (let i = 0; i < sides.length; i++) {
        const col = Math.floor(i / rowsPerCol);
        const row = i % rowsPerCol;
        const p = sides[i];
        const x = col * (sideW + gap);
        const y = totalH - (row + 1) * sideH - row * gap;
        placed.push({ panel: p, x, y });
      }

      // Place polygon caps (Fundo, Topo) side-by-side at bottom
      let curX = 0;
      for (let i = 0; i < caps.length; i++) {
        const p = caps[i];
        placed.push({ panel: p, x: curX, y: 0 });
        curX += p.width + gap;
      }

      return {
        width: totalW,
        height: totalH,
        items: placed
      };
    }

    // Stackable bin layout: shelf-pack panels cleanly in rows by category (sides, back, floor, front, dividers)
    if (panels.some(p => p.category && p.category.startsWith('bin-'))) {
      const maxSingleW = panels.reduce((m, p) => Math.max(m, p.width), 0);
      const totalArea = panels.reduce((s, p) => s + p.width * p.height, 0);
      const targetW = Math.max(maxSingleW * 2 + gap, Math.sqrt(totalArea * 1.45));

      const rowsPacked = [];
      let curRow = [];
      let curW = 0;
      let curH = 0;

      for (let i = 0; i < panels.length; i++) {
        const p = panels[i];
        const nextW = curRow.length === 0 ? p.width : (curW + gap + p.width);
        if (curRow.length > 0 && nextW > targetW + EPS) {
          rowsPacked.push({ items: curRow, width: curW, height: curH });
          curRow = [p];
          curW = p.width;
          curH = p.height;
        } else {
          curRow.push(p);
          curW = nextW;
          curH = Math.max(curH, p.height);
        }
      }
      if (curRow.length > 0) {
        rowsPacked.push({ items: curRow, width: curW, height: curH });
      }

      const totalW = rowsPacked.reduce((m, r) => Math.max(m, r.width), 0);
      const totalH = rowsPacked.reduce((s, r) => s + r.height, 0) + gap * Math.max(0, rowsPacked.length - 1);

      const placed = [];
      let curY = totalH;
      for (let r = 0; r < rowsPacked.length; r++) {
        const row = rowsPacked[r];
        curY -= row.height;
        let curX = 0;
        for (let j = 0; j < row.items.length; j++) {
          const p = row.items[j];
          placed.push({ panel: p, x: curX, y: curY + (row.height - p.height) });
          curX += p.width + gap;
        }
        curY -= gap;
      }

      return {
        width: totalW,
        height: totalH,
        items: placed
      };
    }

    // Kerf Bent Box layout: caps & square walls on top, long flexible wrap strips below
    if (panels.some(p => p.category && p.category.startsWith('kerf-'))) {
      const caps = panels.filter(p => p.category === 'kerf-cap' || p.category === 'kerf-lid-cap');
      const walls = panels.filter(p => p.category === 'kerf-wall' || p.category === 'kerf-lid-wall');
      const wraps = panels.filter(p => p.category === 'kerf-wrap' || p.category === 'kerf-lid-wrap');

      const topRow = [...caps, ...walls];
      const topRowW = topRow.reduce((s, p) => s + p.width, 0) + gap * Math.max(0, topRow.length - 1);
      const topRowH = topRow.reduce((m, p) => Math.max(m, p.height), 0);

      const wrapsMaxW = wraps.reduce((m, p) => Math.max(m, p.width), 0);
      const wrapsTotalH = wraps.reduce((s, p) => s + p.height, 0) + gap * Math.max(0, wraps.length - 1);

      const totalW = Math.max(topRowW, wrapsMaxW);
      const totalH = topRowH + (topRowH > 0 && wrapsTotalH > 0 ? gap : 0) + wrapsTotalH;
      const placed = [];

      // Place caps & square walls side-by-side at top
      let curX = 0;
      for (let i = 0; i < topRow.length; i++) {
        const p = topRow[i];
        placed.push({ panel: p, x: curX, y: totalH - p.height });
        curX += p.width + gap;
      }

      // Stack long living-hinge wrap strips neatly below
      let curY = totalH - topRowH - (topRowH > 0 ? gap : 0);
      for (let i = 0; i < wraps.length; i++) {
        const p = wraps[i];
        curY -= p.height;
        placed.push({ panel: p, x: 0, y: curY });
        curY -= gap;
      }

      return {
        width: totalW,
        height: totalH,
        items: placed
      };
    }

    const byId = {};
    const dividers = [];
    panels.forEach(p => {
      if (p.category === 'divider-row' || p.category === 'divider-col') {
        dividers.push(p);
      } else {
        byId[p.id] = p;
      }
    });

    const leftIds = byId.superior
      ? ['superior', 'traseira', 'frente']
      : ['traseira', 'frente'];
    const rightIds = ['direita', 'esquerda', 'fundo'];

    const leftCol = leftIds.map(id => byId[id]).filter(Boolean);
    const rightCol = rightIds.map(id => byId[id]).filter(Boolean);

    const leftW = leftCol.reduce((m, p) => Math.max(m, p.width), 0);
    const rightW = rightCol.reduce((m, p) => Math.max(m, p.width), 0);

    const leftH = leftCol.reduce((s, p) => s + p.height, 0) + gap * Math.max(0, leftCol.length - 1);
    const rightH = rightCol.reduce((s, p) => s + p.height, 0) + gap * Math.max(0, rightCol.length - 1);
    const outerH = Math.max(leftH, rightH);
    const outerW = leftW + (rightCol.length > 0 ? gap + rightW : 0);

    // Pack dividers into rows constrained to target sheet width
    const targetRowW = Math.max(outerW, dividers.reduce((m, p) => Math.max(m, p.width), 0));
    const divRows = [];
    let curRow = [];
    let curRowW = 0;
    let curRowH = 0;

    for (let i = 0; i < dividers.length; i++) {
      const p = dividers[i];
      const nextW = curRow.length === 0 ? p.width : (curRowW + gap + p.width);
      if (curRow.length > 0 && nextW > targetRowW + EPS) {
        divRows.push({ items: curRow, width: curRowW, height: curRowH });
        curRow = [p];
        curRowW = p.width;
        curRowH = p.height;
      } else {
        curRow.push(p);
        curRowW = nextW;
        curRowH = Math.max(curRowH, p.height);
      }
    }
    if (curRow.length > 0) {
      divRows.push({ items: curRow, width: curRowW, height: curRowH });
    }

    const divTotalH = divRows.length > 0
      ? divRows.reduce((s, r) => s + r.height, 0) + gap * (divRows.length - 1)
      : 0;
    const divMaxW = divRows.reduce((m, r) => Math.max(m, r.width), 0);

    const totalW = Math.max(outerW, divMaxW);
    const totalH = outerH + (divTotalH > 0 ? gap + divTotalH : 0);

    const placed = [];

    // Place outer left column from top (y = totalH) down
    let curY = totalH;
    for (let i = 0; i < leftCol.length; i++) {
      const p = leftCol[i];
      curY -= p.height;
      placed.push({ panel: p, x: 0, y: curY });
      curY -= gap;
    }

    // Place outer right column from top (y = totalH) down
    curY = totalH;
    const rightX = leftW + gap;
    for (let i = 0; i < rightCol.length; i++) {
      const p = rightCol[i];
      curY -= p.height;
      placed.push({ panel: p, x: rightX, y: curY });
      curY -= gap;
    }

    // Place divider rows beneath the outer panels
    curY = totalH - outerH - gap;
    for (let r = 0; r < divRows.length; r++) {
      const row = divRows[r];
      curY -= row.height;
      let curX = 0;
      for (let j = 0; j < row.items.length; j++) {
        const p = row.items[j];
        placed.push({ panel: p, x: curX, y: curY + (row.height - p.height) });
        curX += p.width + gap;
      }
      curY -= gap;
    }

    return {
      width: totalW,
      height: totalH,
      items: placed
    };
  }

  /**
   * Merge CW interior holes into a CCW outer polygon via unobstructed +X horizontal bridges
   * (sorted rightmost hole first) so standard ear-clipping triangulates cleanly.
   */
  function eliminateHoles(outerCCW, holesCW) {
    let poly = outerCCW.map(p => ({ x: p.x, y: p.y }));
    if (!holesCW || holesCW.length === 0) return poly;

    const holesInfo = holesCW.map(hole => {
      let maxIdx = 0;
      for (let i = 1; i < hole.length; i++) {
        if (hole[i].x > hole[maxIdx].x ||
          (Math.abs(hole[i].x - hole[maxIdx].x) <= EPS && hole[i].y > hole[maxIdx].y)) {
          maxIdx = i;
        }
      }
      return {
        hole,
        maxIdx,
        maxX: hole[maxIdx].x
      };
    });

    // Rightmost hole first ensures +X ray never hits an unmerged hole
    holesInfo.sort((a, b) => b.maxX - a.maxX);

    for (let h = 0; h < holesInfo.length; h++) {
      const { hole, maxIdx } = holesInfo[h];
      const M = hole[maxIdx];

      // Cast horizontal ray +X from M to find closest intersection with current poly
      let bestX = Infinity;
      let bestEdgeIdx = -1;
      let bestAtVertex = -1;

      const n = poly.length;
      for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];

        // Check if segment crosses y = M.y (half-open or containing M.y)
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        if (M.y < minY - EPS || M.y > maxY + EPS) continue;

        if (Math.abs(b.y - a.y) <= EPS) {
          // Horizontal edge on same y
          const xCandidate = Math.min(a.x, b.x);
          if (xCandidate >= M.x - EPS && xCandidate < bestX - EPS) {
            bestX = xCandidate;
            bestEdgeIdx = i;
            bestAtVertex = a.x <= b.x ? i : (i + 1) % n;
          }
          continue;
        }

        const t = (M.y - a.y) / (b.y - a.y);
        if (t < -EPS || t > 1 + EPS) continue;
        const xInt = a.x + t * (b.x - a.x);
        if (xInt >= M.x - EPS && xInt < bestX - EPS) {
          bestX = xInt;
          bestEdgeIdx = i;
          if (t <= EPS) bestAtVertex = i;
          else if (t >= 1 - EPS) bestAtVertex = (i + 1) % n;
          else bestAtVertex = -1;
        }
      }

      if (bestEdgeIdx === -1) continue;

      const I = { x: bestX, y: M.y };
      let spliceIdx;
      if (bestAtVertex !== -1) {
        spliceIdx = bestAtVertex;
      } else {
        spliceIdx = bestEdgeIdx + 1;
        poly.splice(spliceIdx, 0, I);
      }

      // Build ordered hole loop starting & ending at M, followed by return to I
      const bridge = [];
      for (let k = 0; k < hole.length; k++) {
        const p = hole[(maxIdx + k) % hole.length];
        bridge.push({ x: p.x, y: p.y });
      }
      bridge.push({ x: M.x, y: M.y });
      bridge.push({ x: poly[spliceIdx].x, y: poly[spliceIdx].y });

      poly.splice(spliceIdx + 1, 0, ...bridge);
    }

    return poly;
  }

  /**
   * Robust Ear-Clipping triangulator for simple CCW 2D polygons
   * (including bridged hole-eliminated polygons with duplicate bridge vertices).
   */
  function triangulatePolygon(pts) {
    const n = pts.length;
    if (n < 3) return [];
    if (n === 3) return [0, 1, 2];

    const indices = [];
    for (let i = 0; i < n; i++) indices.push(i);

    const triangles = [];

    function cross2(a, b, c) {
      return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    function samePt(p, q) {
      return Math.abs(p.x - q.x) <= EPS && Math.abs(p.y - q.y) <= EPS;
    }

    function pointInTri(p, a, b, c) {
      if (samePt(p, a) || samePt(p, b) || samePt(p, c)) return false;
      const c1 = cross2(a, b, p);
      const c2 = cross2(b, c, p);
      const c3 = cross2(c, a, p);
      return c1 >= -EPS && c2 >= -EPS && c3 >= -EPS;
    }

    let guard = n * n + 20;
    while (indices.length > 3 && guard-- > 0) {
      let earFound = false;
      const len = indices.length;

      for (let i = 0; i < len; i++) {
        const iPrev = indices[(i - 1 + len) % len];
        const iCurr = indices[i];
        const iNext = indices[(i + 1) % len];

        const a = pts[iPrev];
        const b = pts[iCurr];
        const c = pts[iNext];

        if (cross2(a, b, c) <= EPS) continue;

        let containsOther = false;
        for (let j = 0; j < len; j++) {
          const idx = indices[j];
          if (idx === iPrev || idx === iCurr || idx === iNext) continue;
          if (pointInTri(pts[idx], a, b, c)) {
            containsOther = true;
            break;
          }
        }

        if (!containsOther) {
          triangles.push(iPrev, iCurr, iNext);
          indices.splice(i, 1);
          earFound = true;
          break;
        }
      }

      if (!earFound) {
        let bestIdx = 0;
        let bestArea = -Infinity;
        for (let i = 0; i < len; i++) {
          const a = pts[indices[(i - 1 + len) % len]];
          const b = pts[indices[i]];
          const c = pts[indices[(i + 1) % len]];
          const area = cross2(a, b, c);
          if (area > bestArea) {
            bestArea = area;
            bestIdx = i;
          }
        }
        const iPrev = indices[(bestIdx - 1 + len) % len];
        const iCurr = indices[bestIdx];
        const iNext = indices[(bestIdx + 1) % len];
        if (bestArea > EPS) {
          triangles.push(iPrev, iCurr, iNext);
        }
        indices.splice(bestIdx, 1);
      }
    }

    if (indices.length === 3) {
      const a = pts[indices[0]], b = pts[indices[1]], c = pts[indices[2]];
      if (cross2(a, b, c) > EPS) {
        triangles.push(indices[0], indices[1], indices[2]);
      }
    }

    return triangles;
  }

  /**
   * Build 3D extruded mesh data (shaded triangles + crisp edge lines) for a panel,
   * supporting interior rectangular mortise holes and custom curved 3D ribbons.
   */
  function buildPanelMesh3D(panel) {
    if (typeof panel.customMesh3D === 'function') {
      return panel.customMesh3D();
    }
    const outerPts = panel.localPts;
    const holes = panel.localHoles || [];
    const T = panel.thickness;
    const halfT = T * 0.5;
    const map3 = panel.mapPoint3D;

    const mergedPts = holes.length > 0 ? eliminateHoles(outerPts, holes) : outerPts;
    const tris = triangulatePolygon(mergedPts);

    const positions = [];
    const normals = [];
    const linePositions = [];

    function pushTri(p0, p1, p2) {
      const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
      const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      positions.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }

    // Front face (w = +halfT)
    for (let i = 0; i < tris.length; i += 3) {
      const a = mergedPts[tris[i]];
      const b = mergedPts[tris[i + 1]];
      const c = mergedPts[tris[i + 2]];
      pushTri(map3(a.x, a.y, +halfT), map3(b.x, b.y, +halfT), map3(c.x, c.y, +halfT));
    }

    // Back face (w = -halfT)
    for (let i = 0; i < tris.length; i += 3) {
      const a = mergedPts[tris[i]];
      const b = mergedPts[tris[i + 1]];
      const c = mergedPts[tris[i + 2]];
      pushTri(map3(a.x, a.y, -halfT), map3(c.x, c.y, -halfT), map3(b.x, b.y, -halfT));
    }

    // Extrude walls & crisp edges for outer contour AND every CW interior hole
    const loops = [outerPts, ...holes];
    for (let l = 0; l < loops.length; l++) {
      const loop = loops[l];
      const n = loop.length;
      for (let i = 0; i < n; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % n];

        const aTop = map3(a.x, a.y, +halfT);
        const bTop = map3(b.x, b.y, +halfT);
        const aBot = map3(a.x, a.y, -halfT);
        const bBot = map3(b.x, b.y, -halfT);

        pushTri(aTop, aBot, bBot);
        pushTri(aTop, bBot, bTop);

        linePositions.push(aTop[0], aTop[1], aTop[2], bTop[0], bTop[1], bTop[2]);
        linePositions.push(aBot[0], aBot[1], aBot[2], bBot[0], bBot[1], bBot[2]);
        linePositions.push(aTop[0], aTop[1], aTop[2], aBot[0], aBot[1], aBot[2]);
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      linePositions: new Float32Array(linePositions),
      explodeDir: panel.explodeDir
    };
  }

  global.BoxGeometry = {
    buildBoxModel,
    buildLidModel,
    buildDividerBoxModel,
    buildPolygonBoxModel,
    buildStackableBinModel,
    buildKerfBoxModel,
    computeFingerLimits,
    applyKerfOffset,
    buildPathSegments,
    layoutPanels,
    triangulatePolygon,
    buildPanelMesh3D
  };
})(window);
