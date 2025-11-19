const P={LOW:{simRes:64,dyeRes:512,pressureIterations:10},MEDIUM:{simRes:96,dyeRes:768,pressureIterations:15},HIGH:{simRes:128,dyeRes:1024,pressureIterations:20},ULTRA:{simRes:192,dyeRes:1536,pressureIterations:30}},A=30,L=55,F=60,B=2,O=.016666,w=.15,C=100,U=4,N=.22,S=.32,T=.52,X=.55,b=.105,Y={DENSITY_DISSIPATION:.998,VELOCITY_DISSIPATION:.42,PRESSURE:.85,CURL:1.15,SPLAT_RADIUS:.95,SPLAT_FORCE:2400,SHADING:!1,COLORFUL:!1,COLOR_UPDATE_SPEED:5,PAUSED:!1,BACK_COLOR:{r:0,g:0,b:0},TRANSPARENT:!0,BLOOM:!1,BLOOM_ITERATIONS:8,BLOOM_RESOLUTION:256,BLOOM_INTENSITY:.8,BLOOM_THRESHOLD:.6,BLOOM_SOFT_KNEE:.7,SUNRAYS:!1,SUNRAYS_RESOLUTION:196,SUNRAYS_WEIGHT:1,CAPTURE_RESOLUTION:512};class G{constructor(t=".fluid-background-canvas"){this.canvasSelector=t,this.canvas=null,this.gl=null,this.ext=null,this.config=null,this.pointers=[],this.splatStack=[],this.animationFrameId=null,this.isInitialized=!1,this.isPaused=!1,this.lastUpdateTime=Date.now(),this.colorUpdateTimer=0,this.hasUserInteracted=!1,this.smoothCursorX=.5,this.smoothCursorY=.5,this.targetCursorX=.5,this.targetCursorY=.5,this.smoothFactor=.18,this.initialCursorX=null,this.initialCursorY=null,this.activationThreshold=.05,this.gpuTier=null,this.mouseMoveThrottleId=null,this.lastMouseMoveTime=0,this.mouseMoveThrottleDelay=16,this.isPageVisible=!0,this.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.currentQuality="HIGH",this.fpsHistory=[],this.lastFpsUpdate=performance.now(),this.qualityAdjustTimer=0,this.frameSkipCounter=0,this.frameSkipInterval=0,this.accentColorCache=null,this.targetAccentColor=null,this.currentAccentColor=null,this.colorInterpolationActive=!1,this.lastColorUpdate=0,this.themeObserver=null,this.styleObserver=null,this.performanceMetrics={fps:60,averageFps:60,frameTime:16.67,quality:"HIGH",lastUpdate:Date.now()},this.manualQualityOverride=null,this.dye=null,this.velocity=null,this.divergence=null,this.curl=null,this.pressure=null,this.bloom=null,this.bloomFramebuffers=[],this.sunrays=null,this.sunraysTemp=null,this.ditheringTexture=null,this.baseVertexShader=null,this.blurVertexShader=null,this.blurProgram=null,this.copyProgram=null,this.clearProgram=null,this.colorProgram=null,this.checkerboardProgram=null,this.bloomPrefilterProgram=null,this.bloomBlurProgram=null,this.bloomFinalProgram=null,this.sunraysMaskProgram=null,this.sunraysProgram=null,this.splatProgram=null,this.advectionProgram=null,this.divergenceProgram=null,this.curlProgram=null,this.vorticityProgram=null,this.pressureProgram=null,this.gradienSubtractProgram=null,this.displayMaterial=null,this.blit=null}init(){if(this.isInitialized){console.warn("FluidBackground: Already initialized");return}try{if(this.canvas=document.querySelector(this.canvasSelector),!this.canvas){console.error(`FluidBackground: Canvas not found with selector "${this.canvasSelector}"`);return}if(this.reducedMotion){console.log("FluidBackground: Reduced motion preference detected, skipping initialization");return}const t=this.getWebGLContext(this.canvas);if(!t.gl){console.error("FluidBackground: WebGL context creation failed");return}if(!t.ext||!t.ext.formatRGBA){console.error("FluidBackground: WebGL format support check failed");return}this.gl=t.gl,this.ext=t.ext;try{this.gpuTier=this.detectGPUTier()}catch(e){console.warn("FluidBackground: GPU tier detection failed, using default",e),this.gpuTier=2}this.resizeCanvas()||console.warn("FluidBackground: Canvas resize failed"),this.gl.viewport(0,0,this.canvas.width,this.canvas.height);try{this.initConfig()}catch(e){throw console.error("FluidBackground: Config initialization failed",e),e}try{this.initPointers(),this.initShaders(),this.initPrograms(),this.initBlit(),this.initDitheringTexture(),this.initFramebuffers(),this.updateKeywords()}catch(e){throw console.error("FluidBackground: WebGL resource initialization failed",e),this.destroy(),e}try{this.initColorManagement()}catch(e){console.warn("FluidBackground: Color management initialization failed, continuing without it",e)}try{this.setupVisibilityAPI()}catch(e){console.warn("FluidBackground: Visibility API setup failed",e)}try{this.setupEventListeners()}catch(e){console.warn("FluidBackground: Event listeners setup failed",e)}this.isInitialized=!0;try{this.startAnimation()}catch(e){throw console.error("FluidBackground: Animation start failed",e),this.isInitialized=!1,e}}catch(t){throw console.error("FluidBackground: Initialization error",t),this.isInitialized&&this.destroy(),t}}initPointers(){this.pointers=[],this.pointers.push(this.createPointer())}createPointer(){return{id:-1,texcoordX:0,texcoordY:0,prevTexcoordX:0,prevTexcoordY:0,deltaX:0,deltaY:0,down:!1,moved:!1,color:this.generateColor()}}getWebGLContext(t){const e={alpha:!0,depth:!1,stencil:!1,antialias:!1,preserveDrawingBuffer:!1};let i=t.getContext("webgl2",e);const r=!!i;if(r||(i=t.getContext("webgl",e)||t.getContext("experimental-webgl",e)),!i)return{gl:null,ext:null};let o,a;r?(i.getExtension("EXT_color_buffer_float"),a=i.getExtension("OES_texture_float_linear")):(o=i.getExtension("OES_texture_half_float"),a=i.getExtension("OES_texture_half_float_linear")),i.clearColor(0,0,0,1);const s=r?i.HALF_FLOAT:o.HALF_FLOAT_OES;let n,l,h;return r?(n=this.getSupportedFormat(i,i.RGBA16F,i.RGBA,s),l=this.getSupportedFormat(i,i.RG16F,i.RG,s),h=this.getSupportedFormat(i,i.R16F,i.RED,s)):(n=this.getSupportedFormat(i,i.RGBA,i.RGBA,s),l=this.getSupportedFormat(i,i.RGBA,i.RGBA,s),h=this.getSupportedFormat(i,i.RGBA,i.RGBA,s)),{gl:i,ext:{formatRGBA:n,formatRG:l,formatR:h,halfFloatTexType:s,supportLinearFiltering:a}}}getSupportedFormat(t,e,i,r){if(!this.supportRenderTextureFormat(t,e,i,r))switch(e){case t.R16F:return this.getSupportedFormat(t,t.RG16F,t.RG,r);case t.RG16F:return this.getSupportedFormat(t,t.RGBA16F,t.RGBA,r);default:return null}return{internalFormat:e,format:i}}supportRenderTextureFormat(t,e,i,r){let o=t.createTexture();t.bindTexture(t.TEXTURE_2D,o),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,e,4,4,0,i,r,null);let a=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,a),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,o,0),t.checkFramebufferStatus(t.FRAMEBUFFER)==t.FRAMEBUFFER_COMPLETE}isMobile(){return/Mobi|Android/i.test(navigator.userAgent)}detectGPUTier(){const t=this.gl;try{const e=t.getParameter(t.RENDERER).toLowerCase();return e.includes("nvidia")||e.includes("amd")||e.includes("radeon")||e.includes("geforce")||e.includes("intel")&&(e.includes("iris")||e.includes("uhd")&&e.includes("6"))?3:e.includes("adreno")||e.includes("mali")||e.includes("powervr")||e.includes("apple")?2:1}catch{return 2}}initConfig(t=null){const e=this.isMobile(),i=this.gpuTier||2,r=window.innerWidth,o=window.innerHeight,a=r*o;let s=t||this.manualQualityOverride||this.currentQuality;!t&&!this.manualQualityOverride&&(i===1?s="LOW":i===2?s="MEDIUM":s="HIGH",this.currentQuality=s);const n=P[s]||P.HIGH;let l=n.simRes,h=n.dyeRes,c=n.pressureIterations;e&&(h=Math.min(h,512),l=Math.min(l,96),c=Math.min(c,12)),a>1920*1080&&(h=Math.min(h,1024)),this.config={...Y,SIM_RESOLUTION:l,DYE_RESOLUTION:h,PRESSURE_ITERATIONS:c},this.ext.supportLinearFiltering||(this.config.DYE_RESOLUTION=Math.min(this.config.DYE_RESOLUTION,512),this.config.SHADING=!1,this.config.BLOOM=!1,this.config.SUNRAYS=!1)}initColorManagement(){const t=this.fetchAccentColor();this.accentColorCache=t,this.currentAccentColor={...t},this.targetAccentColor={...t},this.themeObserver=new MutationObserver(()=>{const i=Date.now();i-this.lastColorUpdate<C||(this.lastColorUpdate=i,this.startColorInterpolation())});const e=document.documentElement;this.themeObserver.observe(e,{attributes:!0,attributeFilter:["data-theme"]}),window.CSS&&CSS.supports&&CSS.supports("color","var(--test)")&&(this.styleObserver=new MutationObserver(()=>{const i=Date.now();i-this.lastColorUpdate<C||(this.lastColorUpdate=i,this.startColorInterpolation())}),this.styleObserver.observe(e,{attributes:!0,attributeFilter:["style","class"]}))}fetchAccentColor(){try{const t=getComputedStyle(document.documentElement);let e=t.getPropertyValue("--color-accent").trim();if(e.startsWith("var(")){const i=e.match(/var\(--([^)]+)\)/);i&&(e=t.getPropertyValue(`--${i[1]}`).trim())}if(e){if(e.startsWith("rgb")){const i=e.match(/\d+/g);if(i&&i.length>=3)return{r:parseInt(i[0])/255,g:parseInt(i[1])/255,b:parseInt(i[2])/255}}if(e.startsWith("#"))return this.hexToRgb(e)}}catch(t){console.warn("FluidBackground: Error fetching accent color",t)}return this.hexToRgb("#e0002a")}startColorInterpolation(){const t=this.fetchAccentColor();this.targetAccentColor&&Math.abs(this.targetAccentColor.r-t.r)<.001&&Math.abs(this.targetAccentColor.g-t.g)<.001&&Math.abs(this.targetAccentColor.b-t.b)<.001||(this.targetAccentColor=t,this.colorInterpolationActive=!0)}updateAccentColor(t=.016){if(!this.colorInterpolationActive&&this.currentAccentColor){this.accentColorCache=this.currentAccentColor;return}if(this.currentAccentColor&&this.targetAccentColor){const e=(o,a,s)=>o+(a-o)*s,i=Math.min(w*t*60,1);this.currentAccentColor.r=e(this.currentAccentColor.r,this.targetAccentColor.r,i),this.currentAccentColor.g=e(this.currentAccentColor.g,this.targetAccentColor.g,i),this.currentAccentColor.b=e(this.currentAccentColor.b,this.targetAccentColor.b,i),Math.abs(this.currentAccentColor.r-this.targetAccentColor.r)+Math.abs(this.currentAccentColor.g-this.targetAccentColor.g)+Math.abs(this.currentAccentColor.b-this.targetAccentColor.b)<.001&&(this.currentAccentColor={...this.targetAccentColor},this.colorInterpolationActive=!1),this.accentColorCache=this.currentAccentColor}else{const e=this.fetchAccentColor();this.accentColorCache=e,this.currentAccentColor={...e},this.targetAccentColor={...e}}}setupVisibilityAPI(){const t=()=>{if(this.isPageVisible=!document.hidden,this.isPageVisible){if(!this.isInitialized)return;this.resume()}else{if(!this.isInitialized)return;this.pause()}};document.addEventListener("visibilitychange",t),window.addEventListener("focus",()=>{this.isInitialized&&!document.hidden&&(this.isPageVisible=!0,this.isPaused&&this.resume())}),window.addEventListener("blur",()=>{this.isInitialized&&document.hidden&&!this.isPaused&&(this.isPageVisible=!1,this.pause())})}initShaders(){this.baseVertexShader=this.compileShader(this.gl.VERTEX_SHADER,`
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
    `),this.blurVertexShader=this.compileShader(this.gl.VERTEX_SHADER,`
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
    `)}initPrograms(){const t=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),e=this.compileShader(this.gl.FRAGMENT_SHADER,`
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
          gl_FragColor = texture2D(uTexture, vUv);
      }
    `),i=this.compileShader(this.gl.FRAGMENT_SHADER,`
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;

      void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `),r=this.compileShader(this.gl.FRAGMENT_SHADER,`
      precision mediump float;

      uniform vec4 color;

      void main () {
          gl_FragColor = color;
      }
    `),o=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),a=`
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

      // Enhanced saturation function
      vec3 enhanceSaturation(vec3 color, float saturation) {
          float gray = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(gray), color, saturation);
      }

      // Improved tone mapping with smooth curve - optimized for reduced brightness
      vec3 toneMap(vec3 color) {
          float brightness = max(color.r, max(color.g, color.b));
          
          // Enhanced tone mapping curve - slightly reduced for less brightness
          // Uses a smoother, more gradual curve that preserves mid-tones better
          float toneMappedBrightness = brightness / (brightness + 1.1);
          
          // Apply smooth rolloff for very bright areas (prevents overexposure)
          // Increased rolloff threshold for more natural dimming
          float rolloff = smoothstep(0.35, 1.1, brightness);
          toneMappedBrightness = mix(toneMappedBrightness, toneMappedBrightness * 0.8, rolloff);
          
          // Preserve color ratios while applying tone mapping
          if (brightness > 0.0) {
              return color * (toneMappedBrightness / brightness);
          }
          return color;
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

          // Enhanced saturation for more vibrant colors
          // Increase saturation by 20% for balanced visual impact
          c = enhanceSaturation(c, 1.20);
          
          // Improved tone mapping with smooth curve - reduced brightness
          c = toneMap(c);
          
          // Reduced brightness for more subtle effect
          c *= 0.85; // Reduce overall brightness by 15%
          
          // Gamma correction - slightly reduced for less brightness
          c = pow(c, vec3(0.95)); // Less aggressive gamma boost
          
          // Ensure minimum brightness for visibility (reduced threshold)
          float minBrightness = 0.015;
          float currentBrightness = max(c.r, max(c.g, c.b));
          if (currentBrightness > 0.0 && currentBrightness < minBrightness) {
              c *= (minBrightness / currentBrightness);
          }

          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
      }
    `,s=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),n=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),l=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),h=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),c=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),u=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),m=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
      }`,this.ext.supportLinearFiltering?null:["MANUAL_FILTERING"]),f=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),v=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),p=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),x=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `),d=this.compileShader(this.gl.FRAGMENT_SHADER,`
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
    `);this.blurProgram=new g(this.gl,this.blurVertexShader,t),this.copyProgram=new g(this.gl,this.baseVertexShader,e),this.clearProgram=new g(this.gl,this.baseVertexShader,i),this.colorProgram=new g(this.gl,this.baseVertexShader,r),this.checkerboardProgram=new g(this.gl,this.baseVertexShader,o),this.bloomPrefilterProgram=new g(this.gl,this.baseVertexShader,s),this.bloomBlurProgram=new g(this.gl,this.baseVertexShader,n),this.bloomFinalProgram=new g(this.gl,this.baseVertexShader,l),this.sunraysMaskProgram=new g(this.gl,this.baseVertexShader,h),this.sunraysProgram=new g(this.gl,this.baseVertexShader,c),this.splatProgram=new g(this.gl,this.baseVertexShader,u),this.advectionProgram=new g(this.gl,this.baseVertexShader,m),this.divergenceProgram=new g(this.gl,this.baseVertexShader,f),this.curlProgram=new g(this.gl,this.baseVertexShader,v),this.vorticityProgram=new g(this.gl,this.baseVertexShader,p),this.pressureProgram=new g(this.gl,this.baseVertexShader,x),this.gradienSubtractProgram=new g(this.gl,this.baseVertexShader,d),this.displayMaterial=new z(this.gl,this.baseVertexShader,a)}initBlit(){const t=this.gl;t.bindBuffer(t.ARRAY_BUFFER,t.createBuffer()),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),t.STATIC_DRAW),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,t.createBuffer()),t.bufferData(t.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),t.STATIC_DRAW),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.enableVertexAttribArray(0),this.blit=(e,i=!1)=>{e==null?(t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.bindFramebuffer(t.FRAMEBUFFER,null)):(t.viewport(0,0,e.width,e.height),t.bindFramebuffer(t.FRAMEBUFFER,e.fbo)),i&&(t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)),t.drawElements(t.TRIANGLES,6,t.UNSIGNED_SHORT,0)}}initDitheringTexture(){const t=this.gl;let e=t.createTexture();t.bindTexture(t.TEXTURE_2D,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.REPEAT),t.texImage2D(t.TEXTURE_2D,0,t.RGB,1,1,0,t.RGB,t.UNSIGNED_BYTE,new Uint8Array([255,255,255]));const i={texture:e,width:1,height:1,attach(r){return t.activeTexture(t.TEXTURE0+r),t.bindTexture(t.TEXTURE_2D,e),r}};this.ditheringTexture=i}initFramebuffers(){let t=this.getResolution(this.config.SIM_RESOLUTION),e=this.getResolution(this.config.DYE_RESOLUTION);const i=this.ext.halfFloatTexType,r=this.ext.formatRGBA,o=this.ext.formatRG,a=this.ext.formatR,s=this.ext.supportLinearFiltering?this.gl.LINEAR:this.gl.NEAREST;this.gl.disable(this.gl.BLEND),this.dye==null?this.dye=this.createDoubleFBO(e.width,e.height,r.internalFormat,r.format,i,s):this.dye=this.resizeDoubleFBO(this.dye,e.width,e.height,r.internalFormat,r.format,i,s),this.velocity==null?this.velocity=this.createDoubleFBO(t.width,t.height,o.internalFormat,o.format,i,s):this.velocity=this.resizeDoubleFBO(this.velocity,t.width,t.height,o.internalFormat,o.format,i,s),this.divergence=this.createFBO(t.width,t.height,a.internalFormat,a.format,i,this.gl.NEAREST),this.curl=this.createFBO(t.width,t.height,a.internalFormat,a.format,i,this.gl.NEAREST),this.pressure=this.createDoubleFBO(t.width,t.height,a.internalFormat,a.format,i,this.gl.NEAREST),this.initBloomFramebuffers(),this.initSunraysFramebuffers()}initBloomFramebuffers(){let t=this.getResolution(this.config.BLOOM_RESOLUTION);const e=this.ext.halfFloatTexType,i=this.ext.formatRGBA,r=this.ext.supportLinearFiltering?this.gl.LINEAR:this.gl.NEAREST;this.bloom=this.createFBO(t.width,t.height,i.internalFormat,i.format,e,r),this.bloomFramebuffers.length=0;for(let o=0;o<this.config.BLOOM_ITERATIONS;o++){let a=t.width>>o+1,s=t.height>>o+1;if(a<2||s<2)break;let n=this.createFBO(a,s,i.internalFormat,i.format,e,r);this.bloomFramebuffers.push(n)}}initSunraysFramebuffers(){let t=this.getResolution(this.config.SUNRAYS_RESOLUTION);const e=this.ext.halfFloatTexType,i=this.ext.formatR,r=this.ext.supportLinearFiltering?this.gl.LINEAR:this.gl.NEAREST;this.sunrays=this.createFBO(t.width,t.height,i.internalFormat,i.format,e,r),this.sunraysTemp=this.createFBO(t.width,t.height,i.internalFormat,i.format,e,r)}createFBO(t,e,i,r,o,a){const s=this.gl;s.activeTexture(s.TEXTURE0);let n=s.createTexture();s.bindTexture(s.TEXTURE_2D,n),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,a),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,a),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),s.texImage2D(s.TEXTURE_2D,0,i,t,e,0,r,o,null);let l=s.createFramebuffer();s.bindFramebuffer(s.FRAMEBUFFER,l),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,n,0),s.viewport(0,0,t,e),s.clear(s.COLOR_BUFFER_BIT);let h=1/t,c=1/e;return{texture:n,fbo:l,width:t,height:e,texelSizeX:h,texelSizeY:c,attach(u){return s.activeTexture(s.TEXTURE0+u),s.bindTexture(s.TEXTURE_2D,n),u}}}createDoubleFBO(t,e,i,r,o,a){let s=this.createFBO(t,e,i,r,o,a),n=this.createFBO(t,e,i,r,o,a);return{width:t,height:e,texelSizeX:s.texelSizeX,texelSizeY:s.texelSizeY,get read(){return s},set read(l){s=l},get write(){return n},set write(l){n=l},swap(){let l=s;s=n,n=l}}}resizeFBO(t,e,i,r,o,a,s){let n=this.createFBO(e,i,r,o,a,s);return this.copyProgram.bind(),this.gl.uniform1i(this.copyProgram.uniforms.uTexture,t.attach(0)),this.blit(n),n}resizeDoubleFBO(t,e,i,r,o,a,s){return t.width==e&&t.height==i||(t.read=this.resizeFBO(t.read,e,i,r,o,a,s),t.write=this.createFBO(e,i,r,o,a,s),t.width=e,t.height=i,t.texelSizeX=1/e,t.texelSizeY=1/i),t}getResolution(t){let e=this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;e<1&&(e=1/e);let i=Math.round(t),r=Math.round(t*e);return this.gl.drawingBufferWidth>this.gl.drawingBufferHeight?{width:r,height:i}:{width:i,height:r}}updateKeywords(){let t=[];this.config.SHADING&&t.push("SHADING"),this.config.BLOOM&&t.push("BLOOM"),this.config.SUNRAYS&&t.push("SUNRAYS"),this.displayMaterial.setKeywords(t)}startAnimation(){this.lastUpdateTime=performance.now(),this.colorUpdateTimer=0,this.update()}update(){if(!this.isInitialized||!this.gl)return;const t=!document.hidden;if(this.isPageVisible!==t&&(this.isPageVisible=t,t&&this.isPaused?this.resume():!t&&!this.isPaused&&this.pause()),!this.isPageVisible||this.isPaused){this.animationFrameId=requestAnimationFrame(()=>this.update());return}if(this.frameSkipInterval>0){if(this.frameSkipCounter++,this.frameSkipCounter<=this.frameSkipInterval){this.animationFrameId=requestAnimationFrame(()=>this.update());return}this.frameSkipCounter=0}const e=this.calcDeltaTime();if(this.resizeCanvas()&&this.initFramebuffers(),this.updateAccentColor(e),this.hasUserInteracted){const i=this.smoothCursorX,r=this.smoothCursorY;this.smoothCursorX+=(this.targetCursorX-this.smoothCursorX)*this.smoothFactor,this.smoothCursorY+=(this.targetCursorY-this.smoothCursorY)*this.smoothFactor;const o=this.smoothCursorX-i,a=this.smoothCursorY-r,s=Math.sqrt(o*o+a*a),n=Math.min(s*14,1),l=Math.min(s*9,1);if(Math.abs(o)>1e-4||Math.abs(a)>1e-4){const h=this.generateColor(),c=Math.max(n,.42);h.r*=T*c,h.g*=T*c,h.b*=T*c;const u=o*this.config.SPLAT_FORCE*(.18+l*.06),m=a*this.config.SPLAT_FORCE*(.18+l*.06);this.splat(this.smoothCursorX,this.smoothCursorY,u,m,h);for(let f=1;f<=U;f++){const v=N*f,p=this.smoothCursorX-o*v,x=this.smoothCursorY-a*v,d=this.generateColorWithVariation(f),R=1-f/(U+1)*.6,y=S*c*R;d.r*=y,d.g*=y,d.b*=y;const E=X*(1-f*.08);this.splat(p,x,u*E,m*E,d)}}}this.updateColors(e),this.applyInputs(),!this.config.PAUSED&&!this.isPaused&&this.step(e),this.render(null),this.animationFrameId=requestAnimationFrame(()=>this.update())}calcDeltaTime(){let t=performance.now(),e=(t-this.lastUpdateTime)/1e3;return e=Math.min(e,O),this.lastUpdateTime=t,this.updateFPS(e),e}updateFPS(t){performance.now();const e=t*1e3,i=Math.min(1e3/e,120);this.fpsHistory.push(i),this.fpsHistory.length>F&&this.fpsHistory.shift();const r=this.fpsHistory.reduce((o,a)=>o+a,0)/this.fpsHistory.length;this.performanceMetrics.fps=i,this.performanceMetrics.averageFps=r,this.performanceMetrics.frameTime=e,this.performanceMetrics.quality=this.currentQuality,this.performanceMetrics.lastUpdate=Date.now(),!this.manualQualityOverride&&this.fpsHistory.length>=F&&(this.qualityAdjustTimer+=t,this.qualityAdjustTimer>=B&&(this.qualityAdjustTimer=0,this.adjustQuality(r))),r<A?this.frameSkipInterval=Math.floor((A-r)/10):this.frameSkipInterval=0}adjustQuality(t){const e=["LOW","MEDIUM","HIGH","ULTRA"],i=e.indexOf(this.currentQuality);let r=this.currentQuality;t<A&&i>0?r=e[i-1]:t>L&&i<e.length-1&&(r=e[i+1]),r!==this.currentQuality&&(this.currentQuality=r,this.initConfig(r),this.initFramebuffers(),this.updateKeywords())}resizeCanvas(){const t=this.canvas.getBoundingClientRect();let e=this.scaleByPixelRatio(t.width||window.innerWidth),i=this.scaleByPixelRatio(t.height||window.innerHeight);return this.canvas.width!=e||this.canvas.height!=i?(this.canvas.width=e,this.canvas.height=i,this.gl&&this.gl.viewport(0,0,e,i),!0):!1}scaleByPixelRatio(t){let e=window.devicePixelRatio||1;return Math.floor(t*e)}updateColors(t){this.config.COLORFUL&&(this.colorUpdateTimer+=t*this.config.COLOR_UPDATE_SPEED,this.colorUpdateTimer>=1&&(this.colorUpdateTimer=this.wrap(this.colorUpdateTimer,0,1),this.pointers.forEach(e=>{e.color=this.generateColor()})))}applyInputs(){this.splatStack.length>0&&this.multipleSplats(this.splatStack.pop()),this.pointers.forEach(t=>{t.moved&&(t.moved=!1,this.splatPointer(t))})}step(t){const e=this.gl;e.disable(e.BLEND),this.curlProgram.bind(),e.uniform2f(this.curlProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),e.uniform1i(this.curlProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.curl),this.vorticityProgram.bind(),e.uniform2f(this.vorticityProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),e.uniform1i(this.vorticityProgram.uniforms.uVelocity,this.velocity.read.attach(0)),e.uniform1i(this.vorticityProgram.uniforms.uCurl,this.curl.attach(1)),e.uniform1f(this.vorticityProgram.uniforms.curl,this.config.CURL),e.uniform1f(this.vorticityProgram.uniforms.dt,t),this.blit(this.velocity.write),this.velocity.swap(),this.divergenceProgram.bind(),e.uniform2f(this.divergenceProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),e.uniform1i(this.divergenceProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.divergence),this.clearProgram.bind(),e.uniform1i(this.clearProgram.uniforms.uTexture,this.pressure.read.attach(0)),e.uniform1f(this.clearProgram.uniforms.value,this.config.PRESSURE),this.blit(this.pressure.write),this.pressure.swap(),this.pressureProgram.bind(),e.uniform2f(this.pressureProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),e.uniform1i(this.pressureProgram.uniforms.uDivergence,this.divergence.attach(0));for(let r=0;r<this.config.PRESSURE_ITERATIONS;r++)e.uniform1i(this.pressureProgram.uniforms.uPressure,this.pressure.read.attach(1)),this.blit(this.pressure.write),this.pressure.swap();this.gradienSubtractProgram.bind(),e.uniform2f(this.gradienSubtractProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),e.uniform1i(this.gradienSubtractProgram.uniforms.uPressure,this.pressure.read.attach(0)),e.uniform1i(this.gradienSubtractProgram.uniforms.uVelocity,this.velocity.read.attach(1)),this.blit(this.velocity.write),this.velocity.swap(),this.advectionProgram.bind(),e.uniform2f(this.advectionProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),this.ext.supportLinearFiltering||e.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.velocity.texelSizeX,this.velocity.texelSizeY);let i=this.velocity.read.attach(0);e.uniform1i(this.advectionProgram.uniforms.uVelocity,i),e.uniform1i(this.advectionProgram.uniforms.uSource,i),e.uniform1f(this.advectionProgram.uniforms.dt,t),e.uniform1f(this.advectionProgram.uniforms.dissipation,this.config.VELOCITY_DISSIPATION),this.blit(this.velocity.write),this.velocity.swap(),this.ext.supportLinearFiltering||e.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.dye.texelSizeX,this.dye.texelSizeY),e.uniform1i(this.advectionProgram.uniforms.uVelocity,this.velocity.read.attach(0)),e.uniform1i(this.advectionProgram.uniforms.uSource,this.dye.read.attach(1)),e.uniform1f(this.advectionProgram.uniforms.dissipation,this.config.DENSITY_DISSIPATION),this.blit(this.dye.write),this.dye.swap()}render(t){this.config.BLOOM&&this.applyBloom(this.dye.read,this.bloom),this.config.SUNRAYS&&(this.applySunrays(this.dye.read,this.dye.write,this.sunrays),this.blur(this.sunrays,this.sunraysTemp,1));const e=this.gl;t==null?(e.enable(e.BLEND),e.blendEquation(e.FUNC_ADD),e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA)):this.config.TRANSPARENT?e.disable(e.BLEND):(e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),e.blendEquation(e.FUNC_ADD)),!this.config.TRANSPARENT&&t!=null&&this.drawColor(t,this.normalizeColor(this.config.BACK_COLOR)),this.drawDisplay(t)}drawColor(t,e){this.colorProgram.bind(),this.gl.uniform4f(this.colorProgram.uniforms.color,e.r,e.g,e.b,1),this.blit(t)}drawCheckerboard(t){this.checkerboardProgram.bind(),this.gl.uniform1f(this.checkerboardProgram.uniforms.aspectRatio,this.canvas.width/this.canvas.height),this.blit(t)}drawDisplay(t){let e=t==null?this.gl.drawingBufferWidth:t.width,i=t==null?this.gl.drawingBufferHeight:t.height;if(this.displayMaterial.bind(),this.config.SHADING&&this.gl.uniform2f(this.displayMaterial.uniforms.texelSize,1/e,1/i),this.gl.uniform1i(this.displayMaterial.uniforms.uTexture,this.dye.read.attach(0)),t==null&&this.gl.viewport(0,0,e,i),this.config.BLOOM){this.gl.uniform1i(this.displayMaterial.uniforms.uBloom,this.bloom.attach(1)),this.gl.uniform1i(this.displayMaterial.uniforms.uDithering,this.ditheringTexture.attach(2));let r=this.getTextureScale(this.ditheringTexture,e,i);this.gl.uniform2f(this.displayMaterial.uniforms.ditherScale,r.x,r.y)}this.config.SUNRAYS&&this.gl.uniform1i(this.displayMaterial.uniforms.uSunrays,this.sunrays.attach(3)),this.blit(t)}applyBloom(t,e){if(this.bloomFramebuffers.length<2)return;let i=e;const r=this.gl;r.disable(r.BLEND),this.bloomPrefilterProgram.bind();let o=this.config.BLOOM_THRESHOLD*this.config.BLOOM_SOFT_KNEE+1e-4,a=this.config.BLOOM_THRESHOLD-o,s=o*2,n=.25/o;r.uniform3f(this.bloomPrefilterProgram.uniforms.curve,a,s,n),r.uniform1f(this.bloomPrefilterProgram.uniforms.threshold,this.config.BLOOM_THRESHOLD),r.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture,t.attach(0)),this.blit(i),this.bloomBlurProgram.bind();for(let l=0;l<this.bloomFramebuffers.length;l++){let h=this.bloomFramebuffers[l];r.uniform2f(this.bloomBlurProgram.uniforms.texelSize,i.texelSizeX,i.texelSizeY),r.uniform1i(this.bloomBlurProgram.uniforms.uTexture,i.attach(0)),this.blit(h),i=h}r.blendFunc(r.ONE,r.ONE),r.enable(r.BLEND);for(let l=this.bloomFramebuffers.length-2;l>=0;l--){let h=this.bloomFramebuffers[l];r.uniform2f(this.bloomBlurProgram.uniforms.texelSize,i.texelSizeX,i.texelSizeY),r.uniform1i(this.bloomBlurProgram.uniforms.uTexture,i.attach(0)),r.viewport(0,0,h.width,h.height),this.blit(h),i=h}r.disable(r.BLEND),this.bloomFinalProgram.bind(),r.uniform2f(this.bloomFinalProgram.uniforms.texelSize,i.texelSizeX,i.texelSizeY),r.uniform1i(this.bloomFinalProgram.uniforms.uTexture,i.attach(0)),r.uniform1f(this.bloomFinalProgram.uniforms.intensity,this.config.BLOOM_INTENSITY),this.blit(e)}applySunrays(t,e,i){const r=this.gl;r.disable(r.BLEND),this.sunraysMaskProgram.bind(),r.uniform1i(this.sunraysMaskProgram.uniforms.uTexture,t.attach(0)),this.blit(e),this.sunraysProgram.bind(),r.uniform1f(this.sunraysProgram.uniforms.weight,this.config.SUNRAYS_WEIGHT),r.uniform1i(this.sunraysProgram.uniforms.uTexture,e.attach(0)),this.blit(i)}blur(t,e,i){this.blurProgram.bind();for(let r=0;r<i;r++)this.gl.uniform2f(this.blurProgram.uniforms.texelSize,t.texelSizeX,0),this.gl.uniform1i(this.blurProgram.uniforms.uTexture,t.attach(0)),this.blit(e),this.gl.uniform2f(this.blurProgram.uniforms.texelSize,0,t.texelSizeY),this.gl.uniform1i(this.blurProgram.uniforms.uTexture,e.attach(0)),this.blit(t)}splatPointer(t){let e=t.deltaX*this.config.SPLAT_FORCE,i=t.deltaY*this.config.SPLAT_FORCE;this.splat(t.texcoordX,t.texcoordY,e,i,t.color)}multipleSplats(t){for(let e=0;e<t;e++){const i=this.generateColor();i.r*=1.1,i.g*=1.1,i.b*=1.1;const r=Math.random(),o=Math.random(),a=200*(Math.random()-.5),s=200*(Math.random()-.5);this.splat(r,o,a,s,i)}}splat(t,e,i,r,o){this.splatProgram.bind(),this.gl.uniform1i(this.splatProgram.uniforms.uTarget,this.velocity.read.attach(0)),this.gl.uniform1f(this.splatProgram.uniforms.aspectRatio,this.canvas.width/this.canvas.height),this.gl.uniform2f(this.splatProgram.uniforms.point,t,e),this.gl.uniform3f(this.splatProgram.uniforms.color,i,r,0),this.gl.uniform1f(this.splatProgram.uniforms.radius,this.correctRadius(this.config.SPLAT_RADIUS/100)),this.blit(this.velocity.write),this.velocity.swap(),this.gl.uniform1i(this.splatProgram.uniforms.uTarget,this.dye.read.attach(0)),this.gl.uniform3f(this.splatProgram.uniforms.color,o.r,o.g,o.b),this.blit(this.dye.write),this.dye.swap()}correctRadius(t){let e=this.canvas.width/this.canvas.height;return e>1&&(t*=e),t}setupEventListeners(){const t=s=>{const n=Date.now();if(n-this.lastMouseMoveTime<this.mouseMoveThrottleDelay)return;this.lastMouseMoveTime=n,this.pointers.length===0&&this.pointers.push(this.createPointer());const l=this.canvas.getBoundingClientRect();let h=this.scaleByPixelRatio(s.clientX-l.left),c=this.scaleByPixelRatio(s.clientY-l.top);const u=h/this.canvas.width,m=1-c/this.canvas.height;let f=this.pointers[0];if(this.hasUserInteracted)this.targetCursorX=u,this.targetCursorY=m;else{if(this.initialCursorX===null||this.initialCursorY===null){this.initialCursorX=u,this.initialCursorY=m;return}const v=Math.abs(u-this.initialCursorX),p=Math.abs(m-this.initialCursorY);if(Math.sqrt(v*v+p*p)<this.activationThreshold)return;this.hasUserInteracted=!0,this.smoothCursorX=u,this.smoothCursorY=m,this.targetCursorX=u,this.targetCursorY=m;const d=this.generateColor();d.r*=T*.92,d.g*=T*.92,d.b*=T*.92;const R=250*(Math.random()-.5),y=250*(Math.random()-.5);this.splat(u,m,R,y,d)}f.down&&this.updatePointerMoveData(f,h,c)};window.addEventListener("mousedown",s=>{const n=this.canvas.getBoundingClientRect();let l=this.scaleByPixelRatio(s.clientX-n.left),h=this.scaleByPixelRatio(s.clientY-n.top);if(!this.hasUserInteracted){this.hasUserInteracted=!0;const u=this.generateColor();u.r*=T*.8,u.g*=T*.8,u.b*=T*.8;const m=l/this.canvas.width,f=1-h/this.canvas.height,v=250*(Math.random()-.5),p=250*(Math.random()-.5);this.splat(m,f,v,p,u)}let c=this.pointers.find(u=>u.id==-1);c==null&&(c=this.createPointer()),this.updatePointerDownData(c,-1,l,h)}),window.addEventListener("mousemove",t,{passive:!0}),window.addEventListener("mouseup",()=>{this.updatePointerUpData(this.pointers[0])}),window.addEventListener("touchstart",s=>{if(!this.hasUserInteracted){this.hasUserInteracted=!0;const h=s.targetTouches[0],c=this.canvas.getBoundingClientRect();let u=this.scaleByPixelRatio(h.clientX-c.left),m=this.scaleByPixelRatio(h.clientY-c.top);const f=this.generateColor();f.r*=T*.8,f.g*=T*.8,f.b*=T*.8;const v=u/this.canvas.width,p=1-m/this.canvas.height,x=250*(Math.random()-.5),d=250*(Math.random()-.5);this.splat(v,p,x,d,f)}const n=s.targetTouches;for(;n.length>=this.pointers.length;)this.pointers.push(this.createPointer());const l=this.canvas.getBoundingClientRect();for(let h=0;h<n.length;h++){let c=this.scaleByPixelRatio(n[h].clientX-l.left),u=this.scaleByPixelRatio(n[h].clientY-l.top);this.updatePointerDownData(this.pointers[h+1],n[h].identifier,c,u)}},{passive:!0});let e=null,i=null,r=null;window.addEventListener("touchmove",s=>{const n=s.targetTouches,l=this.canvas.getBoundingClientRect();let h=!1;for(let c=0;c<n.length;c++){let u=this.pointers[c+1];if(u&&u.down){h=!0;break}}if(h)for(let c=0;c<n.length;c++){let u=this.pointers[c+1];if(!u||!u.down)continue;let m=this.scaleByPixelRatio(n[c].clientX-l.left),f=this.scaleByPixelRatio(n[c].clientY-l.top);this.updatePointerMoveData(u,m,f)}n.length>0&&!r&&(r=requestAnimationFrame(()=>{const c=n[0],u=c.clientY,m=c.clientX;if(e!==null&&i!==null){const f=Math.abs(u-e),v=Math.abs(m-i),p=Math.sqrt(v*v+f*f);if(p>3){this.hasUserInteracted||(this.hasUserInteracted=!0);const x=this.generateColor(),d=Math.min(p/30,1);x.r*=S*1.2*d,x.g*=S*1.2*d,x.b*=S*1.2*d;const R=this.scaleByPixelRatio(m-l.left),y=this.scaleByPixelRatio(u-l.top),E=R/this.canvas.width,_=1-y/this.canvas.height,I=(m-i)*2,M=(u-e)*2;this.splat(E,_,I,M,x)}}e=u,i=m,r=null}))},{passive:!0});let o=window.scrollY,a=null;window.addEventListener("scroll",()=>{a||(a=requestAnimationFrame(()=>{const s=window.scrollY;if(Math.abs(s-o)>5){this.hasUserInteracted||(this.hasUserInteracted=!0);const l=this.generateColor();l.r*=S*.75,l.g*=S*.75,l.b*=S*.75;const h=Math.random()*.3+.35,c=Math.random()*.3+.35,u=(Math.random()-.5)*140,m=(Math.random()-.5)*140;this.splat(h,c,u,m,l)}o=s,a=null}))},{passive:!0}),window.addEventListener("touchend",s=>{const n=s.changedTouches;for(let l=0;l<n.length;l++){let h=this.pointers.find(c=>c.id==n[l].identifier);h!=null&&this.updatePointerUpData(h)}s.touches.length===0&&(e=null,i=null)})}updatePointerDownData(t,e,i,r){t.id=e,t.down=!0,t.moved=!1,t.texcoordX=i/this.canvas.width,t.texcoordY=1-r/this.canvas.height,t.prevTexcoordX=t.texcoordX,t.prevTexcoordY=t.texcoordY,t.deltaX=0,t.deltaY=0,t.color=this.generateColor()}updatePointerMoveData(t,e,i){t.prevTexcoordX=t.texcoordX,t.prevTexcoordY=t.texcoordY,t.texcoordX=e/this.canvas.width,t.texcoordY=1-i/this.canvas.height,t.deltaX=this.correctDeltaX(t.texcoordX-t.prevTexcoordX),t.deltaY=this.correctDeltaY(t.texcoordY-t.prevTexcoordY),t.moved=Math.abs(t.deltaX)>0||Math.abs(t.deltaY)>0}updatePointerUpData(t){t.down=!1}correctDeltaX(t){let e=this.canvas.width/this.canvas.height;return e<1&&(t*=e),t}correctDeltaY(t){let e=this.canvas.width/this.canvas.height;return e>1&&(t/=e),t}getAccentColor(){return this.accentColorCache||this.updateAccentColor(),this.accentColorCache||this.hexToRgb("#e0002a")}hexToRgb(t){const e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e?{r:parseInt(e[1],16)/255,g:parseInt(e[2],16)/255,b:parseInt(e[3],16)/255}:{r:.85,g:.016,b:.161}}generateColor(){const t=this.getAccentColor(),e=Math.max(t.r,t.g,t.b),i=Math.min(t.r,t.g,t.b),r=e-i;let o=0,a=e===0?0:r/e,s=e;r!==0&&(e===t.r?o=(t.g-t.b)/r%6:e===t.g?o=(t.b-t.r)/r+2:o=(t.r-t.g)/r+4),o/=6,o<0&&(o+=1),a=Math.min(a*1.2,1),s=Math.min(s*1.15,1);const n=this.HSVtoRGB(o,a,s);return{r:n.r*b,g:n.g*b,b:n.b*b}}generateColorWithVariation(t=0){const e=this.getAccentColor(),i=Math.max(e.r,e.g,e.b),r=Math.min(e.r,e.g,e.b),o=i-r;let a=0,s=i===0?0:o/i,n=i;o!==0&&(i===e.r?a=(e.g-e.b)/o%6:i===e.g?a=(e.b-e.r)/o+2:a=(e.r-e.g)/o+4),a/=6,a<0&&(a+=1);const l=t*.05%1;a=(a+l*.02)%1,s=Math.min(s*1.2,1);const h=1+l*.12;n=Math.min(n*1.15*h,1);const c=this.HSVtoRGB(a,s,n);return{r:c.r*b,g:c.g*b,b:c.b*b}}HSVtoRGB(t,e,i){let r,o,a,s,n,l,h,c;switch(s=Math.floor(t*6),n=t*6-s,l=i*(1-e),h=i*(1-n*e),c=i*(1-(1-n)*e),s%6){case 0:r=i,o=c,a=l;break;case 1:r=h,o=i,a=l;break;case 2:r=l,o=i,a=c;break;case 3:r=l,o=h,a=i;break;case 4:r=c,o=l,a=i;break;case 5:r=i,o=l,a=h;break}return{r,g:o,b:a}}normalizeColor(t){return{r:t.r/255,g:t.g/255,b:t.b/255}}wrap(t,e,i){let r=i-e;return r==0?e:(t-e)%r+e}getTextureScale(t,e,i){return{x:e/t.width,y:i/t.height}}compileShader(t,e,i){e=this.addKeywords(e,i);const r=this.gl.createShader(t);return this.gl.shaderSource(r,e),this.gl.compileShader(r),this.gl.getShaderParameter(r,this.gl.COMPILE_STATUS)||console.trace(this.gl.getShaderInfoLog(r)),r}addKeywords(t,e){if(e==null)return t;let i="";return e.forEach(r=>{i+="#define "+r+`
`}),i+t}pause(){this.isPaused=!0,this.config.PAUSED=!0}resume(){this.isPaused=!1,this.config.PAUSED=!1}destroy(){if(this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null),this.themeObserver&&(this.themeObserver.disconnect(),this.themeObserver=null),this.styleObserver&&(this.styleObserver.disconnect(),this.styleObserver=null),this.mouseMoveThrottleId&&(cancelAnimationFrame(this.mouseMoveThrottleId),this.mouseMoveThrottleId=null),this.gl)try{const t=s=>{s&&s.texture&&this.gl.deleteTexture(s.texture)},e=s=>{s&&(s.texture&&this.gl.deleteTexture(s.texture),s.fbo&&this.gl.deleteFramebuffer(s.fbo))},i=s=>{s&&(e(s.read),e(s.write))};this.dye&&i(this.dye),this.velocity&&i(this.velocity),this.pressure&&i(this.pressure),this.divergence&&e(this.divergence),this.curl&&e(this.curl),this.bloom&&e(this.bloom),this.sunrays&&e(this.sunrays),this.sunraysTemp&&e(this.sunraysTemp),this.ditheringTexture&&t(this.ditheringTexture),this.bloomFramebuffers&&(this.bloomFramebuffers.forEach(s=>e(s)),this.bloomFramebuffers=[]);const r=s=>{s&&this.gl.deleteShader(s)};r(this.baseVertexShader),r(this.blurVertexShader);const o=s=>{s&&s.program&&this.gl.deleteProgram(s.program)};o(this.blurProgram),o(this.copyProgram),o(this.clearProgram),o(this.colorProgram),o(this.checkerboardProgram),o(this.bloomPrefilterProgram),o(this.bloomBlurProgram),o(this.bloomFinalProgram),o(this.sunraysMaskProgram),o(this.sunraysProgram),o(this.splatProgram),o(this.advectionProgram),o(this.divergenceProgram),o(this.curlProgram),o(this.vorticityProgram),o(this.pressureProgram),o(this.gradienSubtractProgram),this.displayMaterial&&this.displayMaterial.programs&&Object.values(this.displayMaterial.programs).forEach(s=>{s&&this.gl.deleteProgram(s)});const a=this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING)}catch(t){console.warn("FluidBackground: Error during WebGL cleanup",t)}this.gl=null,this.ext=null,this.canvas=null,this.isInitialized=!1}setQuality(t){if(t===null){this.manualQualityOverride=null;const e=this.gpuTier||2;e===1?this.currentQuality="LOW":e===2?this.currentQuality="MEDIUM":this.currentQuality="HIGH"}else if(P[t])this.manualQualityOverride=t,this.currentQuality=t;else{console.warn(`FluidBackground: Invalid quality level "${t}". Use 'LOW', 'MEDIUM', 'HIGH', 'ULTRA', or null.`);return}this.isInitialized&&(this.initConfig(this.currentQuality),this.initFramebuffers(),this.updateKeywords())}getPerformanceMetrics(){return{...this.performanceMetrics,fpsHistory:[...this.fpsHistory],qualityLevel:this.currentQuality,manualOverride:this.manualQualityOverride!==null}}updateConfig(t){if(!(!this.config||!t))try{Object.assign(this.config,t),(t.SIM_RESOLUTION||t.DYE_RESOLUTION)&&this.initFramebuffers(),(t.SHADING!==void 0||t.BLOOM!==void 0||t.SUNRAYS!==void 0)&&this.updateKeywords()}catch(e){console.error("FluidBackground: Error updating config",e)}}}class z{constructor(t,e,i){this.gl=t,this.vertexShader=e,this.fragmentShaderSource=i,this.programs=[],this.activeProgram=null,this.uniforms=[]}setKeywords(t){let e=0;for(let r=0;r<t.length;r++)e+=this.hashCode(t[r]);let i=this.programs[e];if(i==null){let r=this.compileShader(this.gl.FRAGMENT_SHADER,this.fragmentShaderSource,t);i=this.createProgram(this.vertexShader,r),this.programs[e]=i}i!=this.activeProgram&&(this.uniforms=this.getUniforms(i),this.activeProgram=i)}bind(){this.gl.useProgram(this.activeProgram)}compileShader(t,e,i){if(i){let o="";i.forEach(a=>{o+="#define "+a+`
`}),e=o+e}const r=this.gl.createShader(t);return this.gl.shaderSource(r,e),this.gl.compileShader(r),this.gl.getShaderParameter(r,this.gl.COMPILE_STATUS)||console.trace(this.gl.getShaderInfoLog(r)),r}createProgram(t,e){let i=this.gl.createProgram();return this.gl.attachShader(i,t),this.gl.attachShader(i,e),this.gl.linkProgram(i),this.gl.getProgramParameter(i,this.gl.LINK_STATUS)||console.trace(this.gl.getProgramInfoLog(i)),i}getUniforms(t){let e=[],i=this.gl.getProgramParameter(t,this.gl.ACTIVE_UNIFORMS);for(let r=0;r<i;r++){let o=this.gl.getActiveUniform(t,r).name;e[o]=this.gl.getUniformLocation(t,o)}return e}hashCode(t){if(t.length==0)return 0;let e=0;for(let i=0;i<t.length;i++)e=(e<<5)-e+t.charCodeAt(i),e|=0;return e}}class g{constructor(t,e,i){this.gl=t,this.uniforms={},this.program=this.createProgram(e,i),this.uniforms=this.getUniforms(this.program)}bind(){this.gl.useProgram(this.program)}createProgram(t,e){let i=this.gl.createProgram();return this.gl.attachShader(i,t),this.gl.attachShader(i,e),this.gl.linkProgram(i),this.gl.getProgramParameter(i,this.gl.LINK_STATUS)||console.trace(this.gl.getProgramInfoLog(i)),i}getUniforms(t){let e=[],i=this.gl.getProgramParameter(t,this.gl.ACTIVE_UNIFORMS);for(let r=0;r<i;r++){let o=this.gl.getActiveUniform(t,r).name;e[o]=this.gl.getUniformLocation(t,o)}return e}}export{G as F};
