/**
 * Zero-dependency WebGL 1.0 3D Renderer for CNC Box
 * Renders solid directional-lit plywood panels + crisp black outlines with smooth orbit/zoom/pan
 * and animated exploded view.
 */
(function (global) {
  'use strict';

  const FACE_VS = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uProjection;
    uniform mat4 uModelView;
    uniform vec3 uOffset;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    void main() {
      vec3 pos = aPosition + uOffset;
      vWorldPos = pos;
      vNormal = aNormal;
      gl_Position = uProjection * uModelView * vec4(pos, 1.0);
    }
  `;

  const FACE_FS = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    uniform vec3 uBaseColor;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 keyDir = normalize(vec3(0.55, 0.85, 0.65));
      vec3 fillDir = normalize(vec3(-0.70, -0.25, -0.55));
      float keyDiff = max(dot(n, keyDir), 0.0);
      float fillDiff = max(dot(n, fillDir), 0.0);
      float hemi = 0.5 + 0.5 * n.y;
      float light = 0.48 + 0.38 * keyDiff + 0.14 * fillDiff + 0.10 * hemi;
      vec3 color = uBaseColor * min(light, 1.08);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const LINE_VS = `
    attribute vec3 aPosition;
    uniform mat4 uProjection;
    uniform mat4 uModelView;
    uniform vec3 uOffset;
    void main() {
      gl_Position = uProjection * uModelView * vec4(aPosition + uOffset, 1.0);
    }
  `;

  const LINE_FS = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
      gl_FragColor = uColor;
    }
  `;

  // Minimal 4x4 column-major matrix math
  function mat4Perspective(fovy, aspect, near, far, xShiftNdc) {
    const f = 1.0 / Math.tan(fovy * 0.5);
    const nf = 1.0 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect;
    m[5] = f;
    m[8] = -(xShiftNdc || 0);
    m[10] = (far + near) * nf;
    m[11] = -1;
    m[14] = 2 * far * near * nf;
    return m;
  }

  function mat4LookAt(eye, target, up) {
    let zx = eye[0] - target[0];
    let zy = eye[1] - target[1];
    let zz = eye[2] - target[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    const m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx; m[3] = 0;
    m[4] = xy; m[5] = yy; m[6] = zy; m[7] = 0;
    m[8] = xz; m[9] = yz; m[10] = zz; m[11] = 0;
    m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    m[15] = 1;
    return m;
  }

  function compileShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('Shader compile error: ' + err);
    }
    return sh;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error('Program link error: ' + err);
    }
    return prog;
  }

  class BoxRenderer3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      }) || canvas.getContext('experimental-webgl', {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      });

      this.available = Boolean(this.gl);
      if (!this.available) return;

      this.panelsGpu = [];
      this.boxRadius = 90;

      // Camera orbit spherical coordinates
      this.yaw = -0.68;
      this.pitch = 0.46;
      this.targetYaw = this.yaw;
      this.targetPitch = this.pitch;
      this.zoom = 1.0;
      this.targetZoom = 1.0;
      this.pan = [0, 0, 0];
      this.targetPan = [0, 0, 0];

      // Exploded view interpolation
      this.explodeTarget = 0;
      this.explodeCurrent = 0;

      this.rafId = null;
      this.isDragging = false;
      this.dragMode = 'orbit';
      this.lastPointer = { x: 0, y: 0 };
      this.activeTouches = new Map();
      this.lastPinchDist = 0;

      this._initGL();
      this._bindEvents();
      this.resize();
    }

    _initGL() {
      const gl = this.gl;
      this.faceProg = createProgram(gl, FACE_VS, FACE_FS);
      this.lineProg = createProgram(gl, LINE_VS, LINE_FS);

      this.faceLoc = {
        aPosition: gl.getAttribLocation(this.faceProg, 'aPosition'),
        aNormal: gl.getAttribLocation(this.faceProg, 'aNormal'),
        uProjection: gl.getUniformLocation(this.faceProg, 'uProjection'),
        uModelView: gl.getUniformLocation(this.faceProg, 'uModelView'),
        uOffset: gl.getUniformLocation(this.faceProg, 'uOffset'),
        uBaseColor: gl.getUniformLocation(this.faceProg, 'uBaseColor')
      };

      this.lineLoc = {
        aPosition: gl.getAttribLocation(this.lineProg, 'aPosition'),
        uProjection: gl.getUniformLocation(this.lineProg, 'uProjection'),
        uModelView: gl.getUniformLocation(this.lineProg, 'uModelView'),
        uOffset: gl.getUniformLocation(this.lineProg, 'uOffset'),
        uColor: gl.getUniformLocation(this.lineProg, 'uColor')
      };

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.0, 1.5);
      gl.clearColor(0, 0, 0, 0);
    }

    _disposeMeshes() {
      const gl = this.gl;
      if (!gl) return;
      for (const item of this.panelsGpu) {
        gl.deleteBuffer(item.posBuf);
        gl.deleteBuffer(item.normBuf);
        gl.deleteBuffer(item.lineBuf);
      }
      this.panelsGpu = [];
    }

    setModel(boxModel) {
      if (!this.available) return;
      const gl = this.gl;
      this._disposeMeshes();

      const { width, height, depth } = boxModel.outer;
      this.boxRadius = Math.max(20, Math.hypot(width, height, depth) * 0.5);

      for (const panel of boxModel.panels) {
        const mesh = global.BoxGeometry.buildPanelMesh3D(panel);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

        const normBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);

        const lineBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.linePositions, gl.STATIC_DRAW);

        this.panelsGpu.push({
          posBuf,
          normBuf,
          lineBuf,
          triCount: mesh.positions.length / 3,
          lineCount: mesh.linePositions.length / 3,
          explodeDir: mesh.explodeDir
        });
      }

      this.requestRender();
    }

    setExploded(enabled) {
      this.explodeTarget = enabled ? 1 : 0;
      this.requestRender();
    }

    resetCamera() {
      this.targetYaw = -0.68;
      this.targetPitch = 0.46;
      this.targetZoom = 1.0;
      this.targetPan = [0, 0, 0];
      this.requestRender();
    }

    resize() {
      if (!this.available) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.gl.viewport(0, 0, w, h);
      this.requestRender();
    }

    _bindEvents() {
      const c = this.canvas;

      c.addEventListener('contextmenu', e => e.preventDefault());

      c.addEventListener('pointerdown', e => {
        c.setPointerCapture(e.pointerId);
        this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.activeTouches.size === 1) {
          this.isDragging = true;
          this.dragMode = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
          this.lastPointer = { x: e.clientX, y: e.clientY };
        } else if (this.activeTouches.size === 2) {
          this.isDragging = false;
          const pts = Array.from(this.activeTouches.values());
          this.lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        }
      });

      c.addEventListener('pointermove', e => {
        if (!this.activeTouches.has(e.pointerId)) return;
        this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.activeTouches.size === 2) {
          const pts = Array.from(this.activeTouches.values());
          const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          if (this.lastPinchDist > 0) {
            const scale = this.lastPinchDist / Math.max(10, dist);
            this.targetZoom = Math.min(3.5, Math.max(0.35, this.targetZoom * scale));
            this.requestRender();
          }
          this.lastPinchDist = dist;
          return;
        }

        if (!this.isDragging) return;
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer = { x: e.clientX, y: e.clientY };

        if (this.dragMode === 'orbit') {
          this.targetYaw -= dx * 0.0085;
          this.targetPitch = Math.max(-1.48, Math.min(1.48, this.targetPitch + dy * 0.0085));
        } else {
          const panSpeed = this.boxRadius * this.targetZoom * 0.0032;
          const cosY = Math.cos(this.yaw);
          const sinY = Math.sin(this.yaw);
          this.targetPan[0] -= dx * panSpeed * cosY;
          this.targetPan[2] += dx * panSpeed * sinY;
          this.targetPan[1] += dy * panSpeed;
        }
        this.requestRender();
      });

      const endPointer = e => {
        this.activeTouches.delete(e.pointerId);
        if (this.activeTouches.size === 0) {
          this.isDragging = false;
        }
      };

      c.addEventListener('pointerup', endPointer);
      c.addEventListener('pointercancel', endPointer);

      c.addEventListener('wheel', e => {
        e.preventDefault();
        const factor = Math.exp(e.deltaY * 0.0012);
        this.targetZoom = Math.min(3.5, Math.max(0.35, this.targetZoom * factor));
        this.requestRender();
      }, { passive: false });

      window.addEventListener('resize', () => this.resize());
    }

    requestRender() {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        const needsMore = this._stepAndDraw();
        if (needsMore) {
          this.requestRender();
        }
      });
    }

    _stepAndDraw() {
      const lerp = 0.22;
      this.yaw += (this.targetYaw - this.yaw) * lerp;
      this.pitch += (this.targetPitch - this.pitch) * lerp;
      this.zoom += (this.targetZoom - this.zoom) * lerp;
      this.pan[0] += (this.targetPan[0] - this.pan[0]) * lerp;
      this.pan[1] += (this.targetPan[1] - this.pan[1]) * lerp;
      this.pan[2] += (this.targetPan[2] - this.pan[2]) * lerp;
      this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * 0.18;

      this._draw();

      const stillMoving =
        Math.abs(this.targetYaw - this.yaw) > 0.0005 ||
        Math.abs(this.targetPitch - this.pitch) > 0.0005 ||
        Math.abs(this.targetZoom - this.zoom) > 0.0005 ||
        Math.abs(this.targetPan[0] - this.pan[0]) > 0.01 ||
        Math.abs(this.targetPan[1] - this.pan[1]) > 0.01 ||
        Math.abs(this.targetPan[2] - this.pan[2]) > 0.01 ||
        Math.abs(this.explodeTarget - this.explodeCurrent) > 0.001;

      return stillMoving;
    }

    _draw() {
      const gl = this.gl;
      if (!gl) return;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (this.panelsGpu.length === 0) return;

      const width = this.canvas.width;
      const height = this.canvas.height;
      const aspect = width / Math.max(1, height);

      // Shift optical center slightly right on desktop so floating left sidebar never obscures the box
      const cssWidth = this.canvas.clientWidth || width;
      const xShiftNdc = cssWidth > 860 ? Math.min(0.24, 155 / cssWidth) : 0;

      const dist = this.boxRadius * 2.85 * this.zoom;
      const near = Math.max(0.5, dist * 0.02);
      const far = Math.max(2000, dist * 12);

      const proj = mat4Perspective((36 * Math.PI) / 180, aspect, near, far, xShiftNdc);

      const cosP = Math.cos(this.pitch);
      const eye = [
        this.pan[0] + dist * cosP * Math.sin(this.yaw),
        this.pan[1] + dist * Math.sin(this.pitch),
        this.pan[2] + dist * cosP * Math.cos(this.yaw)
      ];
      const mv = mat4LookAt(eye, this.pan, [0, 1, 0]);
      const explodeDist = this.explodeCurrent * this.boxRadius * 0.34;

      // Pass 1: Solid shaded amber plywood panels
      gl.useProgram(this.faceProg);
      gl.uniformMatrix4fv(this.faceLoc.uProjection, false, proj);
      gl.uniformMatrix4fv(this.faceLoc.uModelView, false, mv);
      gl.uniform3f(this.faceLoc.uBaseColor, 0.957, 0.816, 0.435); // #f4d06f

      gl.enableVertexAttribArray(this.faceLoc.aPosition);
      gl.enableVertexAttribArray(this.faceLoc.aNormal);

      for (const item of this.panelsGpu) {
        gl.uniform3f(
          this.faceLoc.uOffset,
          item.explodeDir[0] * explodeDist,
          item.explodeDir[1] * explodeDist,
          item.explodeDir[2] * explodeDist
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, item.posBuf);
        gl.vertexAttribPointer(this.faceLoc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, item.normBuf);
        gl.vertexAttribPointer(this.faceLoc.aNormal, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, item.triCount);
      }

      gl.disableVertexAttribArray(this.faceLoc.aNormal);

      // Pass 2: Crisp dark edge outlines
      gl.useProgram(this.lineProg);
      gl.uniformMatrix4fv(this.lineLoc.uProjection, false, proj);
      gl.uniformMatrix4fv(this.lineLoc.uModelView, false, mv);
      gl.uniform4f(this.lineLoc.uColor, 0.08, 0.11, 0.18, 1.0);

      gl.enableVertexAttribArray(this.lineLoc.aPosition);
      for (const item of this.panelsGpu) {
        gl.uniform3f(
          this.lineLoc.uOffset,
          item.explodeDir[0] * explodeDist,
          item.explodeDir[1] * explodeDist,
          item.explodeDir[2] * explodeDist
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, item.lineBuf);
        gl.vertexAttribPointer(this.lineLoc.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, item.lineCount);
      }
    }
  }

  global.BoxRenderer3D = BoxRenderer3D;
})(window);
