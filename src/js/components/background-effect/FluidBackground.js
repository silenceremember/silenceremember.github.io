/*
MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

/**
 * WebGL Fluid Simulation Background Effect
 * Adapted from WebGL-Fluid-Simulation by Pavel Dobryakov
 */
export class FluidBackground {
  constructor(canvasSelector = '.fluid-background-canvas') {
    this.canvasSelector = canvasSelector;
    this.canvas = null;
    this.gl = null;
    this.ext = null;
    this.config = null;
    this.pointers = [];
    this.splatStack = [];
    this.animationFrameId = null;
    this.isInitialized = false;
    this.isPaused = false;
    this.lastUpdateTime = Date.now();
    this.colorUpdateTimer = 0.0;

    // WebGL resources
    this.dye = null;
    this.velocity = null;
    this.divergence = null;
    this.curl = null;
    this.pressure = null;
    this.bloom = null;
    this.bloomFramebuffers = [];
    this.sunrays = null;
    this.sunraysTemp = null;
    this.ditheringTexture = null;

    // Shaders and programs
    this.baseVertexShader = null;
    this.blurVertexShader = null;
    this.blurProgram = null;
    this.copyProgram = null;
    this.clearProgram = null;
    this.colorProgram = null;
    this.checkerboardProgram = null;
    this.bloomPrefilterProgram = null;
    this.bloomBlurProgram = null;
    this.bloomFinalProgram = null;
    this.sunraysMaskProgram = null;
    this.sunraysProgram = null;
    this.splatProgram = null;
    this.advectionProgram = null;
    this.divergenceProgram = null;
    this.curlProgram = null;
    this.vorticityProgram = null;
    this.pressureProgram = null;
    this.gradienSubtractProgram = null;
    this.displayMaterial = null;
    this.blit = null;
  }

  /**
   * Initialize the fluid background effect
   */
  init() {
    if (this.isInitialized) {
      console.log('FluidBackground: Already initialized');
      return;
    }

    this.canvas = document.querySelector(this.canvasSelector);
    if (!this.canvas) {
      console.warn(`FluidBackground: Canvas not found with selector "${this.canvasSelector}"`);
      return;
    }

    console.log('FluidBackground: Canvas found', this.canvas);

    try {
      const context = this.getWebGLContext(this.canvas);
      if (!context.gl || !context.ext.formatRGBA) {
        console.warn('FluidBackground: WebGL not supported', {
          gl: !!context.gl,
          formatRGBA: !!context.ext?.formatRGBA
        });
        return;
      }

      this.gl = context.gl;
      this.ext = context.ext;

      const webglVersion = this.gl.getParameter(this.gl.VERSION);
      console.log('FluidBackground: WebGL context created', {
        isWebGL2: webglVersion.includes('WebGL 2'),
        version: webglVersion,
        formatRGBA: this.ext.formatRGBA
      });

      // Set initial canvas size after WebGL context is created
      this.resizeCanvas();
      console.log('FluidBackground: Canvas resized', {
        width: this.canvas.width,
        height: this.canvas.height,
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        rect: this.canvas.getBoundingClientRect()
      });
      
      // Set viewport immediately
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      console.log('FluidBackground: Viewport set', {
        viewport: [0, 0, this.canvas.width, this.canvas.height]
      });

      this.config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 0.98, // Slightly lower for more visible effect
        VELOCITY_DISSIPATION: 0.2,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,
        SPLAT_RADIUS: 0.25,
        SPLAT_FORCE: 6000,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        TRANSPARENT: true,
        BLOOM: true,
        BLOOM_ITERATIONS: 8,
        BLOOM_RESOLUTION: 256,
        BLOOM_INTENSITY: 0.8,
        BLOOM_THRESHOLD: 0.6,
        BLOOM_SOFT_KNEE: 0.7,
        SUNRAYS: true,
        SUNRAYS_RESOLUTION: 196,
        SUNRAYS_WEIGHT: 1.0,
      };

      // Adjust for mobile devices
      if (this.isMobile()) {
        this.config.DYE_RESOLUTION = 512;
      }
      if (!this.ext.supportLinearFiltering) {
        this.config.DYE_RESOLUTION = 512;
        this.config.SHADING = false;
        this.config.BLOOM = false;
        this.config.SUNRAYS = false;
      }

      this.initPointers();
      console.log('FluidBackground: Pointers initialized');
      
      this.initShaders();
      console.log('FluidBackground: Shaders initialized');
      
      this.initPrograms();
      console.log('FluidBackground: Programs initialized');
      
      this.initBlit();
      console.log('FluidBackground: Blit initialized');
      
      this.initDitheringTexture();
      console.log('FluidBackground: Dithering texture initialized');
      
      this.initFramebuffers();
      console.log('FluidBackground: Framebuffers initialized');
      
      this.updateKeywords();
      console.log('FluidBackground: Keywords updated');
      
      // Create more initial splats for better visibility
      const initialSplats = parseInt(Math.random() * 20) + 10;
      this.multipleSplats(initialSplats);
      console.log('FluidBackground: Initial splats created', { count: initialSplats });
      
      this.setupEventListeners();
      console.log('FluidBackground: Event listeners setup');
      
      // Mark as initialized BEFORE starting animation
      this.isInitialized = true;
      console.log('FluidBackground: Marked as initialized');
      
      this.startAnimation();
      console.log('FluidBackground: Animation started');
    } catch (error) {
      console.error('FluidBackground: Initialization error', error);
    }
  }

  /**
   * Initialize pointers array
   */
  initPointers() {
    this.pointers = [];
    this.pointers.push(this.createPointer());
  }

  /**
   * Create a pointer prototype
   */
  createPointer() {
    return {
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: [30, 0, 300],
    };
  }

  /**
   * Get WebGL context
   */
  getWebGLContext(canvas) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
      gl =
        canvas.getContext('webgl', params) ||
        canvas.getContext('experimental-webgl', params);

    if (!gl) {
      return { gl: null, ext: null };
    }

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2
      ? gl.HALF_FLOAT
      : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
      formatRGBA = this.getSupportedFormat(
        gl,
        gl.RGBA16F,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = this.getSupportedFormat(
        gl,
        gl.RG16F,
        gl.RG,
        halfFloatTexType
      );
      formatR = this.getSupportedFormat(
        gl,
        gl.R16F,
        gl.RED,
        halfFloatTexType
      );
    } else {
      formatRGBA = this.getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = this.getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
      formatR = this.getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  }

  /**
   * Get supported format
   */
  getSupportedFormat(gl, internalFormat, format, type) {
    if (!this.supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F:
          return this.getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return this.getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default:
          return null;
      }
    }

    return {
      internalFormat,
      format,
    };
  }

  /**
   * Support render texture format
   */
  supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
  }

  /**
   * Check if mobile device
   */
  isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  /**
   * Initialize shaders
   */
  initShaders() {
    this.baseVertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      `
      precision highp float;

      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;

      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `
    );

    this.blurVertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      `
      precision highp float;

      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform vec2 texelSize;

      void main () {
          vUv = aPosition * 0.5 + 0.5;
          float offset = 1.33333333;
          vL = vUv - texelSize * offset;
          vR = vUv + texelSize * offset;
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `
    );
  }

  /**
   * Initialize programs
   */
  initPrograms() {
    const blurShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform sampler2D uTexture;

      void main () {
          vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
          sum += texture2D(uTexture, vL) * 0.35294117;
          sum += texture2D(uTexture, vR) * 0.35294117;
          gl_FragColor = sum;
      }
    `
    );

    const copyShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
          gl_FragColor = texture2D(uTexture, vUv);
      }
    `
    );

    const clearShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;

      void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `
    );

    const colorShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;

      uniform vec4 color;

      void main () {
          gl_FragColor = color;
      }
    `
    );

    const checkerboardShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float aspectRatio;

      #define SCALE 25.0

      void main () {
          vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
          float v = mod(uv.x + uv.y, 2.0);
          v = v * 0.1 + 0.8;
          gl_FragColor = vec4(vec3(v), 1.0);
      }
    `
    );

    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform sampler2D uBloom;
      uniform sampler2D uSunrays;
      uniform sampler2D uDithering;
      uniform vec2 ditherScale;
      uniform vec2 texelSize;

      vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
      }

      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;

      #ifdef SHADING
          vec3 lc = texture2D(uTexture, vL).rgb;
          vec3 rc = texture2D(uTexture, vR).rgb;
          vec3 tc = texture2D(uTexture, vT).rgb;
          vec3 bc = texture2D(uTexture, vB).rgb;

          float dx = length(rc) - length(lc);
          float dy = length(tc) - length(bc);

          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);

          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          c *= diffuse;
      #endif

      #ifdef BLOOM
          vec3 bloom = texture2D(uBloom, vUv).rgb;
      #endif

      #ifdef SUNRAYS
          float sunrays = texture2D(uSunrays, vUv).r;
          c *= sunrays;
      #ifdef BLOOM
          bloom *= sunrays;
      #endif
      #endif

      #ifdef BLOOM
          float noise = texture2D(uDithering, vUv * ditherScale).r;
          noise = noise * 2.0 - 1.0;
          bloom += noise / 255.0;
          bloom = linearToGamma(bloom);
          c += bloom;
      #endif

          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
      }
    `;

    const bloomPrefilterShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec3 curve;
      uniform float threshold;

      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          float br = max(c.r, max(c.g, c.b));
          float rq = clamp(br - curve.x, 0.0, curve.y);
          rq = curve.z * rq * rq;
          c *= max(rq, br - threshold) / max(br, 0.0001);
          gl_FragColor = vec4(c, 0.0);
      }
    `
    );

    const bloomBlurShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;

      void main () {
          vec4 sum = vec4(0.0);
          sum += texture2D(uTexture, vL);
          sum += texture2D(uTexture, vR);
          sum += texture2D(uTexture, vT);
          sum += texture2D(uTexture, vB);
          sum *= 0.25;
          gl_FragColor = sum;
      }
    `
    );

    const bloomFinalShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform float intensity;

      void main () {
          vec4 sum = vec4(0.0);
          sum += texture2D(uTexture, vL);
          sum += texture2D(uTexture, vR);
          sum += texture2D(uTexture, vT);
          sum += texture2D(uTexture, vB);
          sum *= 0.25;
          gl_FragColor = sum * intensity;
      }
    `
    );

    const sunraysMaskShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
          vec4 c = texture2D(uTexture, vUv);
          float br = max(c.r, max(c.g, c.b));
          c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
          gl_FragColor = c;
      }
    `
    );

    const sunraysShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float weight;

      #define ITERATIONS 16

      void main () {
          float Density = 0.3;
          float Decay = 0.95;
          float Exposure = 0.7;

          vec2 coord = vUv;
          vec2 dir = vUv - 0.5;

          dir *= 1.0 / float(ITERATIONS) * Density;
          float illuminationDecay = 1.0;

          float color = texture2D(uTexture, vUv).a;

          for (int i = 0; i < ITERATIONS; i++)
          {
              coord -= dir;
              float col = texture2D(uTexture, coord).a;
              color += col * illuminationDecay * weight;
              illuminationDecay *= Decay;
          }

          gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
      }
    `
    );

    const splatShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;

      void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
      }
    `
    );

    const advectionShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;

      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;

          vec2 iuv = floor(st);
          vec2 fuv = fract(st);

          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }

      void main () {
      #ifdef MANUAL_FILTERING
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          vec4 result = bilerp(uSource, coord, dyeTexelSize);
      #else
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          vec4 result = texture2D(uSource, coord);
      #endif
          float decay = 1.0 + dissipation * dt;
          gl_FragColor = result / decay;
      }`,
      this.ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
    );

    const divergenceShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;

          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }

          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `
    );

    const curlShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `
    );

    const vorticityShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;

      void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;

          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;

          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity += force * dt;
          velocity = min(max(velocity, -1000.0), 1000.0);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `
    );

    const pressureShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;

      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `
    );

    const gradientSubtractShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;

      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `
    );

    this.blurProgram = new Program(this.gl, this.blurVertexShader, blurShader);
    this.copyProgram = new Program(this.gl, this.baseVertexShader, copyShader);
    this.clearProgram = new Program(this.gl, this.baseVertexShader, clearShader);
    this.colorProgram = new Program(this.gl, this.baseVertexShader, colorShader);
    this.checkerboardProgram = new Program(
      this.gl,
      this.baseVertexShader,
      checkerboardShader
    );
    this.bloomPrefilterProgram = new Program(
      this.gl,
      this.baseVertexShader,
      bloomPrefilterShader
    );
    this.bloomBlurProgram = new Program(this.gl, this.baseVertexShader, bloomBlurShader);
    this.bloomFinalProgram = new Program(
      this.gl,
      this.baseVertexShader,
      bloomFinalShader
    );
    this.sunraysMaskProgram = new Program(
      this.gl,
      this.baseVertexShader,
      sunraysMaskShader
    );
    this.sunraysProgram = new Program(this.gl, this.baseVertexShader, sunraysShader);
    this.splatProgram = new Program(this.gl, this.baseVertexShader, splatShader);
    this.advectionProgram = new Program(
      this.gl,
      this.baseVertexShader,
      advectionShader
    );
    this.divergenceProgram = new Program(
      this.gl,
      this.baseVertexShader,
      divergenceShader
    );
    this.curlProgram = new Program(this.gl, this.baseVertexShader, curlShader);
    this.vorticityProgram = new Program(
      this.gl,
      this.baseVertexShader,
      vorticityShader
    );
    this.pressureProgram = new Program(this.gl, this.baseVertexShader, pressureShader);
    this.gradienSubtractProgram = new Program(
      this.gl,
      this.baseVertexShader,
      gradientSubtractShader
    );

    this.displayMaterial = new Material(this.gl, this.baseVertexShader, displayShaderSource);
  }

  /**
   * Initialize blit function
   */
  initBlit() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.blit = (target, clear = false) => {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  }

  /**
   * Initialize dithering texture
   */
  initDitheringTexture() {
    // Create a simple white texture as fallback if LDR_LLL1_0.png is not available
    const gl = this.gl;
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255])
    );

    const obj = {
      texture,
      width: 1,
      height: 1,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };

    // Try to load the dithering texture, fallback to white if not found
    const image = new Image();
    image.onload = () => {
      obj.width = image.width;
      obj.height = image.height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        image
      );
    };
    image.onerror = () => {
      // Keep the white texture fallback
    };
    image.src = '/assets/images/LDR_LLL1_0.png';

    this.ditheringTexture = obj;
  }

  /**
   * Initialize framebuffers
   */
  initFramebuffers() {
    let simRes = this.getResolution(this.config.SIM_RESOLUTION);
    let dyeRes = this.getResolution(this.config.DYE_RESOLUTION);

    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA;
    const rg = this.ext.formatRG;
    const r = this.ext.formatR;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

    this.gl.disable(this.gl.BLEND);

    if (this.dye == null)
      this.dye = this.createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    else
      this.dye = this.resizeDoubleFBO(
        this.dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );

    if (this.velocity == null)
      this.velocity = this.createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    else
      this.velocity = this.resizeDoubleFBO(
        this.velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );

    this.divergence = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );

    this.initBloomFramebuffers();
    this.initSunraysFramebuffers();
  }

  /**
   * Initialize bloom framebuffers
   */
  initBloomFramebuffers() {
    let res = this.getResolution(this.config.BLOOM_RESOLUTION);

    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

    this.bloom = this.createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    this.bloomFramebuffers.length = 0;
    for (let i = 0; i < this.config.BLOOM_ITERATIONS; i++) {
      let width = res.width >> (i + 1);
      let height = res.height >> (i + 1);

      if (width < 2 || height < 2) break;

      let fbo = this.createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      this.bloomFramebuffers.push(fbo);
    }
  }

  /**
   * Initialize sunrays framebuffers
   */
  initSunraysFramebuffers() {
    let res = this.getResolution(this.config.SUNRAYS_RESOLUTION);

    const texType = this.ext.halfFloatTexType;
    const r = this.ext.formatR;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

    this.sunrays = this.createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
    this.sunraysTemp = this.createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
  }

  /**
   * Create FBO
   */
  createFBO(w, h, internalFormat, format, type, param) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  /**
   * Create double FBO
   */
  createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = this.createFBO(w, h, internalFormat, format, type, param);

    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        let temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  /**
   * Resize FBO
   */
  resizeFBO(target, w, h, internalFormat, format, type, param) {
    let newFBO = this.createFBO(w, h, internalFormat, format, type, param);
    this.copyProgram.bind();
    this.gl.uniform1i(
      this.copyProgram.uniforms.uTexture,
      target.attach(0)
    );
    this.blit(newFBO);
    return newFBO;
  }

  /**
   * Resize double FBO
   */
  resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
    if (target.width == w && target.height == h) return target;
    target.read = this.resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = this.createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
  }

  /**
   * Get resolution
   */
  getResolution(resolution) {
    let aspectRatio =
      this.gl.drawingBufferWidth / this.gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (this.gl.drawingBufferWidth > this.gl.drawingBufferHeight)
      return { width: max, height: min };
    else return { width: min, height: max };
  }

  /**
   * Update keywords for display material
   */
  updateKeywords() {
    let displayKeywords = [];
    if (this.config.SHADING) displayKeywords.push('SHADING');
    if (this.config.BLOOM) displayKeywords.push('BLOOM');
    if (this.config.SUNRAYS) displayKeywords.push('SUNRAYS');
    this.displayMaterial.setKeywords(displayKeywords);
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    this.lastUpdateTime = Date.now();
    this.colorUpdateTimer = 0.0;
    this.update();
  }

  /**
   * Animation update loop
   */
  update() {
    if (!this.isInitialized || !this.gl) {
      console.warn('FluidBackground: Update called but not initialized', {
        isInitialized: this.isInitialized,
        hasGL: !!this.gl
      });
      return;
    }

    const dt = this.calcDeltaTime();
    if (this.resizeCanvas()) {
      console.log('FluidBackground: Canvas resized during update');
      this.initFramebuffers();
    }
    this.updateColors(dt);
    this.applyInputs();
    if (!this.config.PAUSED && !this.isPaused) this.step(dt);
    this.render(null);
    this.animationFrameId = requestAnimationFrame(() => this.update());
  }

  /**
   * Calculate delta time
   */
  calcDeltaTime() {
    let now = Date.now();
    let dt = (now - this.lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    this.lastUpdateTime = now;
    return dt;
  }

  /**
   * Resize canvas
   */
  resizeCanvas() {
    // Ensure canvas has dimensions from CSS
    const rect = this.canvas.getBoundingClientRect();
    let width = this.scaleByPixelRatio(rect.width || window.innerWidth);
    let height = this.scaleByPixelRatio(rect.height || window.innerHeight);
    
    if (this.canvas.width != width || this.canvas.height != height) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.gl) {
        this.gl.viewport(0, 0, width, height);
      }
      return true;
    }
    return false;
  }

  /**
   * Scale by pixel ratio
   */
  scaleByPixelRatio(input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
  }

  /**
   * Update colors
   */
  updateColors(dt) {
    if (!this.config.COLORFUL) return;

    this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = this.wrap(this.colorUpdateTimer, 0, 1);
      this.pointers.forEach((p) => {
        p.color = this.generateColor();
      });
    }
  }

  /**
   * Apply inputs
   */
  applyInputs() {
    if (this.splatStack.length > 0) this.multipleSplats(this.splatStack.pop());

    this.pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    });
  }

  /**
   * Simulation step
   */
  step(dt) {
    const gl = this.gl;
    gl.disable(gl.BLEND);

    this.curlProgram.bind();
    gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.curl);

    this.vorticityProgram.bind();
    gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    gl.uniform1i(
      this.vorticityProgram.uniforms.uCurl,
      this.curl.attach(1)
    );
    gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.CURL);
    gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.divergenceProgram.bind();
    gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.divergence);

    this.clearProgram.bind();
    gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.pressure.read.attach(0)
    );
    gl.uniform1f(this.clearProgram.uniforms.value, this.config.PRESSURE);
    this.blit(this.pressure.write);
    this.pressure.swap();

    this.pressureProgram.bind();
    gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.divergence.attach(0)
    );
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.pressure.read.attach(1)
      );
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    this.gradienSubtractProgram.bind();
    gl.uniform2f(
      this.gradienSubtractProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uPressure,
      this.pressure.read.attach(0)
    );
    gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uVelocity,
      this.velocity.read.attach(1)
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.advectionProgram.bind();
    gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    if (!this.ext.supportLinearFiltering)
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY
      );
    let velocityId = this.velocity.read.attach(0);
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.VELOCITY_DISSIPATION
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    if (!this.ext.supportLinearFiltering)
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.dye.texelSizeX,
        this.dye.texelSizeY
      );
    gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.dye.read.attach(1)
    );
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.DENSITY_DISSIPATION
    );
    this.blit(this.dye.write);
    this.dye.swap();
  }

  /**
   * Render
   */
  render(target) {
    if (this.config.BLOOM) this.applyBloom(this.dye.read, this.bloom);
    if (this.config.SUNRAYS) {
      this.applySunrays(this.dye.read, this.dye.write, this.sunrays);
      this.blur(this.sunrays, this.sunraysTemp, 1);
    }

    const gl = this.gl;
    // For background effect, always use blending for transparency when rendering to screen
    if (target == null) {
      // Render to screen - always enable blending for transparent background effect
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      // Render to framebuffer
      if (!this.config.TRANSPARENT) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
      }
    }

    // Don't draw background color for transparent mode (background effect)
    if (!this.config.TRANSPARENT && target != null)
      this.drawColor(target, this.normalizeColor(this.config.BACK_COLOR));
    
    // Don't draw checkerboard for background effect
    // if (target == null && this.config.TRANSPARENT)
    //   this.drawCheckerboard(target);
    
    this.drawDisplay(target);
  }

  /**
   * Draw color
   */
  drawColor(target, color) {
    this.colorProgram.bind();
    this.gl.uniform4f(
      this.colorProgram.uniforms.color,
      color.r,
      color.g,
      color.b,
      1
    );
    this.blit(target);
  }

  /**
   * Draw checkerboard
   */
  drawCheckerboard(target) {
    this.checkerboardProgram.bind();
    this.gl.uniform1f(
      this.checkerboardProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.blit(target);
  }

  /**
   * Draw display
   */
  drawDisplay(target) {
    let width =
      target == null
        ? this.gl.drawingBufferWidth
        : target.width;
    let height =
      target == null ? this.gl.drawingBufferHeight : target.height;

    this.displayMaterial.bind();
    if (this.config.SHADING)
      this.gl.uniform2f(
        this.displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height
      );
    this.gl.uniform1i(
      this.displayMaterial.uniforms.uTexture,
      this.dye.read.attach(0)
    );
    
    // Ensure viewport is set correctly
    if (target == null) {
      this.gl.viewport(0, 0, width, height);
    }
    if (this.config.BLOOM) {
      this.gl.uniform1i(
        this.displayMaterial.uniforms.uBloom,
        this.bloom.attach(1)
      );
      this.gl.uniform1i(
        this.displayMaterial.uniforms.uDithering,
        this.ditheringTexture.attach(2)
      );
      let scale = this.getTextureScale(
        this.ditheringTexture,
        width,
        height
      );
      this.gl.uniform2f(
        this.displayMaterial.uniforms.ditherScale,
        scale.x,
        scale.y
      );
    }
    if (this.config.SUNRAYS)
      this.gl.uniform1i(
        this.displayMaterial.uniforms.uSunrays,
        this.sunrays.attach(3)
      );
    this.blit(target);
  }

  /**
   * Apply bloom
   */
  applyBloom(source, destination) {
    if (this.bloomFramebuffers.length < 2) return;

    let last = destination;
    const gl = this.gl;

    gl.disable(gl.BLEND);
    this.bloomPrefilterProgram.bind();
    let knee =
      this.config.BLOOM_THRESHOLD * this.config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = this.config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    gl.uniform3f(
      this.bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2
    );
    gl.uniform1f(
      this.bloomPrefilterProgram.uniforms.threshold,
      this.config.BLOOM_THRESHOLD
    );
    gl.uniform1i(
      this.bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.blit(last);

    this.bloomBlurProgram.bind();
    for (let i = 0; i < this.bloomFramebuffers.length; i++) {
      let dest = this.bloomFramebuffers[i];
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.blit(dest);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = this.bloomFramebuffers[i];
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      this.blit(baseTex);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    this.bloomFinalProgram.bind();
    gl.uniform2f(
      this.bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY
    );
    gl.uniform1i(
      this.bloomFinalProgram.uniforms.uTexture,
      last.attach(0)
    );
    gl.uniform1f(
      this.bloomFinalProgram.uniforms.intensity,
      this.config.BLOOM_INTENSITY
    );
    this.blit(destination);
  }

  /**
   * Apply sunrays
   */
  applySunrays(source, mask, destination) {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    this.sunraysMaskProgram.bind();
    gl.uniform1i(
      this.sunraysMaskProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.blit(mask);

    this.sunraysProgram.bind();
    gl.uniform1f(
      this.sunraysProgram.uniforms.weight,
      this.config.SUNRAYS_WEIGHT
    );
    gl.uniform1i(
      this.sunraysProgram.uniforms.uTexture,
      mask.attach(0)
    );
    this.blit(destination);
  }

  /**
   * Blur
   */
  blur(target, temp, iterations) {
    this.blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
      this.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        target.texelSizeX,
        0.0
      );
      this.gl.uniform1i(
        this.blurProgram.uniforms.uTexture,
        target.attach(0)
      );
      this.blit(temp);

      this.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        0.0,
        target.texelSizeY
      );
      this.gl.uniform1i(
        this.blurProgram.uniforms.uTexture,
        temp.attach(0)
      );
      this.blit(target);
    }
  }

  /**
   * Splat pointer
   */
  splatPointer(pointer) {
    let dx = pointer.deltaX * this.config.SPLAT_FORCE;
    let dy = pointer.deltaY * this.config.SPLAT_FORCE;
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  /**
   * Multiple splats
   */
  multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const color = this.generateColor();
      // Increase intensity for better visibility
      color.r *= 15.0;
      color.g *= 15.0;
      color.b *= 15.0;
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  /**
   * Splat
   */
  splat(x, y, dx, dy, color) {
    this.splatProgram.bind();
    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.velocity.read.attach(0)
    );
    this.gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    this.gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
    this.gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.correctRadius(this.config.SPLAT_RADIUS / 100.0)
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.dye.read.attach(0)
    );
    this.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color.r,
      color.g,
      color.b
    );
    this.blit(this.dye.write);
    this.dye.swap();
  }

  /**
   * Correct radius
   */
  correctRadius(radius) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      let posX = this.scaleByPixelRatio(e.offsetX);
      let posY = this.scaleByPixelRatio(e.offsetY);
      let pointer = this.pointers.find((p) => p.id == -1);
      if (pointer == null) pointer = this.createPointer();
      this.updatePointerDownData(pointer, -1, posX, posY);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      let pointer = this.pointers[0];
      if (!pointer.down) return;
      let posX = this.scaleByPixelRatio(e.offsetX);
      let posY = this.scaleByPixelRatio(e.offsetY);
      this.updatePointerMoveData(pointer, posX, posY);
    });

    window.addEventListener('mouseup', () => {
      this.updatePointerUpData(this.pointers[0]);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      while (touches.length >= this.pointers.length)
        this.pointers.push(this.createPointer());
      for (let i = 0; i < touches.length; i++) {
        let posX = this.scaleByPixelRatio(touches[i].pageX);
        let posY = this.scaleByPixelRatio(touches[i].pageY);
        this.updatePointerDownData(
          this.pointers[i + 1],
          touches[i].identifier,
          posX,
          posY
        );
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        let pointer = this.pointers[i + 1];
        if (!pointer.down) continue;
        let posX = this.scaleByPixelRatio(touches[i].pageX);
        let posY = this.scaleByPixelRatio(touches[i].pageY);
        this.updatePointerMoveData(pointer, posX, posY);
      }
    }, false);

    window.addEventListener('touchend', (e) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        let pointer = this.pointers.find(
          (p) => p.id == touches[i].identifier
        );
        if (pointer == null) continue;
        this.updatePointerUpData(pointer);
      }
    });
  }

  /**
   * Update pointer down data
   */
  updatePointerDownData(pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / this.canvas.width;
    pointer.texcoordY = 1.0 - posY / this.canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = this.generateColor();
  }

  /**
   * Update pointer move data
   */
  updatePointerMoveData(pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / this.canvas.width;
    pointer.texcoordY = 1.0 - posY / this.canvas.height;
    pointer.deltaX = this.correctDeltaX(
      pointer.texcoordX - pointer.prevTexcoordX
    );
    pointer.deltaY = this.correctDeltaY(
      pointer.texcoordY - pointer.prevTexcoordY
    );
    pointer.moved =
      Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  }

  /**
   * Update pointer up data
   */
  updatePointerUpData(pointer) {
    pointer.down = false;
  }

  /**
   * Correct delta X
   */
  correctDeltaX(delta) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
  }

  /**
   * Correct delta Y
   */
  correctDeltaY(delta) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
  }

  /**
   * Generate color
   */
  generateColor() {
    let c = this.HSVtoRGB(Math.random(), 1.0, 1.0);
    // Increase brightness for background effect visibility
    c.r *= 0.25;
    c.g *= 0.25;
    c.b *= 0.25;
    return c;
  }

  /**
   * HSV to RGB
   */
  HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }

    return {
      r,
      g,
      b,
    };
  }

  /**
   * Normalize color
   */
  normalizeColor(input) {
    let output = {
      r: input.r / 255,
      g: input.g / 255,
      b: input.b / 255,
    };
    return output;
  }

  /**
   * Wrap value
   */
  wrap(value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return ((value - min) % range) + min;
  }

  /**
   * Get texture scale
   */
  getTextureScale(texture, width, height) {
    return {
      x: width / texture.width,
      y: height / texture.height,
    };
  }

  /**
   * Compile shader
   */
  compileShader(type, source, keywords) {
    source = this.addKeywords(source, keywords);

    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
      console.trace(this.gl.getShaderInfoLog(shader));

    return shader;
  }

  /**
   * Add keywords
   */
  addKeywords(source, keywords) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach((keyword) => {
      keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
  }

  /**
   * Pause animation
   */
  pause() {
    this.isPaused = true;
    this.config.PAUSED = true;
  }

  /**
   * Resume animation
   */
  resume() {
    this.isPaused = false;
    this.config.PAUSED = false;
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Material class
 */
class Material {
  constructor(gl, vertexShader, fragmentShaderSource) {
    this.gl = gl;
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
    this.programs = [];
    this.activeProgram = null;
    this.uniforms = [];
  }

  setKeywords(keywords) {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++)
      hash += this.hashCode(keywords[i]);

    let program = this.programs[hash];
    if (program == null) {
      let fragmentShader = this.compileShader(
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );
      program = this.createProgram(this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }

    if (program == this.activeProgram) return;

    this.uniforms = this.getUniforms(program);
    this.activeProgram = program;
  }

  bind() {
    this.gl.useProgram(this.activeProgram);
  }

  compileShader(type, source, keywords) {
    if (keywords) {
      let keywordsString = '';
      keywords.forEach((keyword) => {
        keywordsString += '#define ' + keyword + '\n';
      });
      source = keywordsString + source;
    }

    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
      console.trace(this.gl.getShaderInfoLog(shader));

    return shader;
  }

  createProgram(vertexShader, fragmentShader) {
    let program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
      console.trace(this.gl.getProgramInfoLog(program));

    return program;
  }

  getUniforms(program) {
    let uniforms = [];
    let uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      let uniformName = this.gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  hashCode(s) {
    if (s.length == 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

/**
 * Program class
 */
class Program {
  constructor(gl, vertexShader, fragmentShader) {
    this.gl = gl;
    this.uniforms = {};
    this.program = this.createProgram(vertexShader, fragmentShader);
    this.uniforms = this.getUniforms(this.program);
  }

  bind() {
    this.gl.useProgram(this.program);
  }

  createProgram(vertexShader, fragmentShader) {
    let program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
      console.trace(this.gl.getProgramInfoLog(program));

    return program;
  }

  getUniforms(program) {
    let uniforms = [];
    let uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      let uniformName = this.gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }
}

