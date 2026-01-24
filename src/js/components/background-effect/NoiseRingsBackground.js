/**
 * NoiseRingsBackground - Canvas 2D фоновый эффект
 * Концентрические кольца с noise-деформацией для создания эффекта глубины/воронки
 * 
 * Легковесная альтернатива WebGL FluidBackground
 * - Потребление памяти: низкое (один canvas)
 * - Нагрузка на GPU: низкая (простое 2D рисование)
 * - Совместимость: любой браузер с Canvas 2D API
 */

'use strict';

// ============================================================================
// SIMPLEX NOISE GENERATOR (встроенный)
// ============================================================================

/**
 * Simplex Noise генератор
 * Легковесная реализация для 2D/3D шума
 */
class SimplexNoise {
  constructor(seed = Math.random() * 65536) {
    this.p = this.buildPermutationTable(seed);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    
    // Градиенты для 3D noise
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    
    // Константы для 3D simplex
    this.F3 = 1.0 / 3.0;
    this.G3 = 1.0 / 6.0;
  }
  
  /**
   * Строит таблицу перестановок с заданным seed
   */
  buildPermutationTable(seed) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Fisher-Yates shuffle с seed
    let n = 256;
    while (n > 1) {
      seed = (seed * 16807) % 2147483647;
      const k = seed % n;
      n--;
      [p[n], p[k]] = [p[k], p[n]];
    }
    
    return p;
  }
  
  /**
   * Вычисляет скалярное произведение градиента и вектора
   */
  dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
  
  /**
   * 3D Simplex Noise (для анимации)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number} Значение от -1 до 1
   */
  noise3D(x, y, z) {
    const { perm, permMod12, grad3, F3, G3 } = this;
    
    // Skew input space to determine simplex cell
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;
    
    // Determine which simplex we are in
    let i1, j1, k1, i2, j2, k2;
    
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }
    
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    
    let n0, n1, n2, n3;
    
    // Calculate contribution from four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
      n0 = 0.0;
    } else {
      t0 *= t0;
      const gi0 = permMod12[ii + perm[jj + perm[kk]]];
      n0 = t0 * t0 * this.dot3(grad3[gi0], x0, y0, z0);
    }
    
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
      n1 = 0.0;
    } else {
      t1 *= t1;
      const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
      n1 = t1 * t1 * this.dot3(grad3[gi1], x1, y1, z1);
    }
    
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
      n2 = 0.0;
    } else {
      t2 *= t2;
      const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
      n2 = t2 * t2 * this.dot3(grad3[gi2], x2, y2, z2);
    }
    
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
      n3 = 0.0;
    } else {
      t3 *= t3;
      const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
      n3 = t3 * t3 * this.dot3(grad3[gi3], x3, y3, z3);
    }
    
    // Scale result to [-1, 1]
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// ============================================================================
// NOISE RINGS BACKGROUND
// ============================================================================

/**
 * Конфигурация по умолчанию
 */
const DEFAULT_CONFIG = {
  // Параметры колец
  ringCount: 100,              // 40-60 колец
  ringSpacing: 14,            // 15-20px между кольцами
  ringWidth: 1,             // Толщина линии 1-2px
  segments: 200,              // 100-120 сегментов на кольцо
  
  // Параметры шума
  noiseScale: 0.001,          // Масштаб шума
  noiseSpeed: 0.5,         // Скорость анимации шума
  
  // Динамическая амплитуда шума
  baseNoiseAmplitude: 30,     // Минимальная амплитуда в покое
  maxNoiseAmplitude: 150,     // Максимальная амплитуда при активности
  amplitudeLerpFactor: 0.05,  // Скорость интерполяции к target (быстрее реакция)
  amplitudeDecayFactor: 0.1, // Скорость затухания к base (медленнее)
  
  // Множители активности
  velocityMultiplier: 0.5,    // Множитель скорости мыши
  scrollMultiplier: 0.3,      // Множитель скролла
  pressBoost: 5,             // Boost при удержании кнопки/пальца
  scrollBoost: 10,            // Максимальный boost при прокрутке
  moveBoost: 0.25,             // Множитель для скорости мыши/пальца
  
  // Opacity градиент
  opacityCenter: 0,         // Opacity в центре
  opacityEdge: 0.25,           // Opacity на краях
  
  // Цвета (по умолчанию)
  accentColor: '#d90429',
  backgroundColor: '#121212'
};

/**
 * NoiseRingsBackground Class
 * Рендерит концентрические кольца с noise-деформацией
 */
export class NoiseRingsBackground {
  /**
   * @param {Object} config - Конфигурация компонента
   */
  constructor(config = {}) {
    // Merge конфигурации
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Canvas и контекст
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    
    // Состояние анимации
    this.animationFrameId = null;
    this.isInitialized = false;
    this.isPaused = false;
    this.lastFrameTime = 0;
    this.time = 0;
    
    // Генератор шума
    this.noiseGenerator = null;
    
    // Динамическая амплитуда шума
    this.currentNoiseAmplitude = this.config.baseNoiseAmplitude;
    this.targetNoiseAmplitude = this.config.baseNoiseAmplitude;
    
    // Отслеживание скорости мыши/touch
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastMouseTime = 0;
    
    // Состояние нажатия (press & hold)
    this.isPressed = false;
    this.pressStartTime = 0;
    
    // Система тем
    this.themeObserver = null;
    this.currentColors = {
      accent: this.config.accentColor,
      background: this.config.backgroundColor
    };
    
    // Доступность
    this.reducedMotion = false;
    
    // Event handlers (сохраняем для очистки)
    this.boundHandleMouseMove = null;
    this.boundHandleScroll = null;
    this.boundHandlePressStart = null;
    this.boundHandlePressEnd = null;
    this.boundHandleResize = null;
    this.boundHandleVisibilityChange = null;
    
    // Throttling
    this.lastMouseMoveTime = 0;
    this.mouseMoveThrottleDelay = 16; // ~60fps
    this.resizeTimeout = null;
    this.resizeDebounceDelay = 100;
  }
  
  /**
   * Инициализация компонента
   * @param {string} containerId - ID контейнера
   */
  init(containerId = 'background-container') {
    if (this.isInitialized) {
      console.warn('NoiseRingsBackground: Already initialized');
      return;
    }
    
    try {
      // Проверка reduced motion
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      
      // Находим контейнер
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`NoiseRingsBackground: Container not found with id "${containerId}"`);
        return;
      }
      
      // Создаем canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'noise-rings-background';
      this.container.appendChild(this.canvas);
      
      // Получаем контекст
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        console.error('NoiseRingsBackground: Failed to get 2D context');
        return;
      }
      
      // Инициализация генератора шума
      this.noiseGenerator = new SimplexNoise();
      
      // Установка размеров canvas
      this.resizeCanvas();
      
      // Инициализация цветов из CSS
      this.initColorManagement();
      
      // Настройка Visibility API
      this.setupVisibilityAPI();
      
      // Настройка обработчиков событий
      this.setupEventListeners();
      
      this.isInitialized = true;
      
      // Запуск анимации или статичный рендер
      if (this.reducedMotion) {
        this.renderStaticFrame();
      } else {
        this.startAnimation();
      }
      
    } catch (error) {
      console.error('NoiseRingsBackground: Initialization error', error);
      this.destroy();
    }
  }
  
  /**
   * Изменение размера canvas
   */
  resizeCanvas() {
    if (!this.canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    this.ctx.scale(dpr, dpr);
    
    // При reduced motion перерисовываем статичный кадр
    if (this.reducedMotion) {
      this.renderStaticFrame();
    }
  }
  
  /**
   * Инициализация управления цветами
   */
  initColorManagement() {
    this.updateColorsFromCSS();
    
    // Наблюдатель за изменением темы
    this.themeObserver = new MutationObserver(() => {
      this.updateColorsFromCSS();
    });
    
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
  
  /**
   * Обновление цветов из CSS переменных
   */
  updateColorsFromCSS() {
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Получаем accent цвет
    let accentColor = computedStyle.getPropertyValue('--color-accent').trim();
    if (!accentColor) {
      accentColor = this.config.accentColor;
    }
    
    // Получаем цвет фона
    let bgColor = computedStyle.getPropertyValue('--color-bg-primary').trim();
    if (!bgColor) {
      bgColor = this.config.backgroundColor;
    }
    
    this.currentColors = {
      accent: accentColor,
      background: bgColor
    };
  }
  
  /**
   * Ручное обновление цветов
   */
  updateColors() {
    this.updateColorsFromCSS();
    
    // Если reduced motion - перерисовать статичный кадр
    if (this.reducedMotion) {
      this.renderStaticFrame();
    }
  }
  
  /**
   * Настройка Visibility API
   */
  setupVisibilityAPI() {
    this.boundHandleVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);
  }
  
  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Throttled mouse/touch move для отслеживания скорости
    this.boundHandleMouseMove = (e) => {
      const now = performance.now();
      if (now - this.lastMouseMoveTime < this.mouseMoveThrottleDelay) return;
      this.lastMouseMoveTime = now;
      
      this.handleMouseMove(e, now);
    };
    
    // Обработчик скролла
    this.boundHandleScroll = (e) => {
      this.handleScroll(e);
    };
    
    // Обработчики нажатия (press & hold)
    this.boundHandlePressStart = (e) => {
      this.handlePressStart(e);
    };
    
    this.boundHandlePressEnd = () => {
      this.handlePressEnd();
    };
    
    // Debounced resize
    this.boundHandleResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
      }, this.resizeDebounceDelay);
    };
    
    // Mouse events
    window.addEventListener('mousemove', this.boundHandleMouseMove, { passive: true });
    window.addEventListener('mousedown', this.boundHandlePressStart, { passive: true });
    window.addEventListener('mouseup', this.boundHandlePressEnd, { passive: true });
    
    // Touch events
    window.addEventListener('touchmove', this.boundHandleMouseMove, { passive: true });
    window.addEventListener('touchstart', this.boundHandlePressStart, { passive: true });
    window.addEventListener('touchend', this.boundHandlePressEnd, { passive: true });
    
    // Scroll and resize
    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
    window.addEventListener('wheel', this.boundHandleScroll, { passive: true });
    window.addEventListener('resize', this.boundHandleResize, { passive: true });
  }
  
  /**
   * Обработчик движения мыши/touch - отслеживает скорость
   * @param {MouseEvent|TouchEvent} event
   * @param {number} now - Текущее время в ms
   */
  handleMouseMove(event, now) {
    // Поддержка touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // Вычисление скорости движения
    if (this.lastMouseTime > 0) {
      const dt = now - this.lastMouseTime;
      if (dt > 0) {
        const dx = clientX - this.lastMouseX;
        const dy = clientY - this.lastMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt * 16; // Нормализация к ~60fps
        
        // НАКОПЛЕНИЕ: добавляем к target amplitude на основе скорости
        // moveBoost - настраиваемый множитель для скорости мыши/пальца
        const velocityBoost = velocity * this.config.moveBoost;
        
        this.targetNoiseAmplitude = Math.min(
          this.targetNoiseAmplitude + velocityBoost,
          this.config.maxNoiseAmplitude
        );
      }
    }
    
    // Сохраняем текущую позицию для следующего кадра
    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
    this.lastMouseTime = now;
  }
  
  /**
   * Обработчик скролла/wheel - накапливает амплитуду
   * @param {Event|WheelEvent} event
   */
  handleScroll(event) {
    // Определяем величину скролла
    let scrollDelta = 50; // Значение по умолчанию для scroll event
    
    if (event && event.type === 'wheel') {
      // Для wheel event используем deltaY
      scrollDelta = Math.abs(event.deltaY) || 50;
    }
    
    // НАКОПЛЕНИЕ: добавляем к target amplitude при скролле
    // scrollBoost - максимальный boost при прокрутке (настраиваемый в config)
    const scrollBoost = Math.min(scrollDelta * 0.2, this.config.scrollBoost);
    
    this.targetNoiseAmplitude = Math.min(
      this.targetNoiseAmplitude + scrollBoost,
      this.config.maxNoiseAmplitude
    );
  }
  
  /**
   * Обработчик начала нажатия (mousedown/touchstart)
   * @param {MouseEvent|TouchEvent} event
   */
  handlePressStart(event) {
    this.isPressed = true;
    this.pressStartTime = performance.now();
    
    // Начальный импульс при нажатии
    this.targetNoiseAmplitude = Math.min(
      this.targetNoiseAmplitude + 20,
      this.config.maxNoiseAmplitude
    );
  }
  
  /**
   * Обработчик окончания нажатия (mouseup/touchend)
   */
  handlePressEnd() {
    this.isPressed = false;
  }
  
  /**
   * Обновление динамической амплитуды шума с системой накопления
   * @param {number} dt - Delta time в секундах
   */
  updateNoiseAmplitude(dt) {
    const now = performance.now();
    
    // Если зажата кнопка/палец - добавляем boost
    if (this.isPressed) {
      const pressDuration = now - this.pressStartTime;
      // Чем дольше держим, тем больше boost (до максимума pressBoost)
      const pressBoost = Math.min(pressDuration / 50, this.config.pressBoost);
      
      this.targetNoiseAmplitude = Math.min(
        this.targetNoiseAmplitude + pressBoost * 0.1,
        this.config.maxNoiseAmplitude
      );
    }
    
    // Плавная интерполяция current к target
    const lerpFactor = 1 - Math.pow(1 - this.config.amplitudeLerpFactor, dt * 60);
    this.currentNoiseAmplitude += (this.targetNoiseAmplitude - this.currentNoiseAmplitude) * lerpFactor;
    
    // Медленное затухание target к base (только когда нет активности - не нажато)
    if (!this.isPressed) {
      const decayFactor = 1 - Math.pow(1 - this.config.amplitudeDecayFactor, dt * 60);
      this.targetNoiseAmplitude += (this.config.baseNoiseAmplitude - this.targetNoiseAmplitude) * decayFactor;
    }
  }
  
  /**
   * Конвертация HEX в RGBA
   * @param {string} hex - HEX цвет
   * @param {number} alpha - Прозрачность
   * @returns {string} RGBA строка
   */
  hexToRgba(hex, alpha = 1) {
    // Удаляем # если есть
    hex = hex.replace('#', '');
    
    // Парсим компоненты
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Вычисляет opacity с градиентом от центра к краям
   * @param {number} ringIndex - Индекс кольца
   * @returns {number} Значение opacity
   */
  calculateOpacity(ringIndex) {
    const distanceFactor = ringIndex / this.config.ringCount;
    const { opacityCenter, opacityEdge } = this.config;
    
    // Линейная интерполяция с небольшим smoothstep эффектом
    const t = distanceFactor * distanceFactor * (3 - 2 * distanceFactor);
    return opacityCenter - (opacityCenter - opacityEdge) * t;
  }
  
  /**
   * Вычисляет позицию точки на кольце
   * @param {number} ringIndex - Индекс кольца
   * @param {number} angle - Угол в радианах
   * @param {number} time - Текущее время
   * @returns {Object} {x, y} координаты
   */
  calculatePointPosition(ringIndex, angle, time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Центр всегда в середине экрана
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    
    // Базовый радиус кольца
    const baseRadius = ringIndex * this.config.ringSpacing;
    
    // Шумовая деформация
    const noiseX = Math.cos(angle) * this.config.noiseScale * baseRadius;
    const noiseY = Math.sin(angle) * this.config.noiseScale * baseRadius;
    const noiseValue = this.noiseGenerator.noise3D(
      noiseX,
      noiseY,
      time * this.config.noiseSpeed + ringIndex * 0.1
    );
    
    // Амплитуда зависит от удаленности от центра и текущей динамической амплитуды
    const distanceFactor = ringIndex / this.config.ringCount;
    const amplitude = this.currentNoiseAmplitude * (0.5 + distanceFactor * 0.5);
    
    // Финальный радиус с деформацией
    const radius = baseRadius + noiseValue * amplitude;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }
  
  /**
   * Рисует одно кольцо
   * @param {number} ringIndex - Индекс кольца
   * @param {number} time - Текущее время
   */
  drawRing(ringIndex, time) {
    const segments = this.config.segments;
    const angleStep = (Math.PI * 2) / segments;
    
    // Вычисление opacity
    const opacity = this.calculateOpacity(ringIndex);
    if (opacity <= 0.01) return;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.hexToRgba(this.currentColors.accent, opacity);
    this.ctx.lineWidth = this.config.ringWidth;
    
    let firstPoint = null;
    
    for (let i = 0; i <= segments; i++) {
      const angle = i * angleStep;
      const point = this.calculatePointPosition(ringIndex, angle, time);
      
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y);
        firstPoint = point;
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }
    
    // Замыкаем кольцо
    if (firstPoint) {
      this.ctx.lineTo(firstPoint.x, firstPoint.y);
    }
    
    this.ctx.stroke();
  }
  
  /**
   * Основной цикл рендеринга
   */
  render() {
    if (!this.isInitialized || this.isPaused) {
      return;
    }
    
    // Пропуск рендеринга для скрытых вкладок
    if (document.hidden) {
      this.animationFrameId = requestAnimationFrame(() => this.render());
      return;
    }
    
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.033); // Cap at 30fps minimum
    this.lastFrameTime = now;
    this.time += dt;
    
    // Обновление динамической амплитуды шума
    this.updateNoiseAmplitude(dt);
    
    // Очистка canvas
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Рисование колец от внешних к внутренним
    for (let i = this.config.ringCount; i >= 1; i--) {
      this.drawRing(i, this.time);
    }
    
    // Следующий кадр
    this.animationFrameId = requestAnimationFrame(() => this.render());
  }
  
  /**
   * Рендеринг статичного кадра (для reduced motion)
   */
  renderStaticFrame() {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Рисуем кольца со статичным шумом (time = 0)
    for (let i = this.config.ringCount; i >= 1; i--) {
      this.drawRing(i, 0);
    }
  }
  
  /**
   * Запуск анимации
   */
  startAnimation() {
    if (this.reducedMotion) {
      this.renderStaticFrame();
      return;
    }
    
    this.lastFrameTime = performance.now();
    this.render();
  }
  
  /**
   * Пауза анимации
   */
  pause() {
    this.isPaused = true;
  }
  
  /**
   * Возобновление анимации
   */
  resume() {
    if (!this.isInitialized || this.reducedMotion) return;
    
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    
    // Перезапуск анимации если она была остановлена
    if (!this.animationFrameId) {
      this.render();
    }
  }
  
  /**
   * Уничтожение компонента и освобождение ресурсов
   */
  destroy() {
    // Остановка анимации
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Очистка таймеров
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Удаление обработчиков событий
    if (this.boundHandleMouseMove) {
      window.removeEventListener('mousemove', this.boundHandleMouseMove);
      window.removeEventListener('touchmove', this.boundHandleMouseMove);
    }
    if (this.boundHandleScroll) {
      window.removeEventListener('scroll', this.boundHandleScroll);
      window.removeEventListener('wheel', this.boundHandleScroll);
    }
    if (this.boundHandlePressStart) {
      window.removeEventListener('mousedown', this.boundHandlePressStart);
      window.removeEventListener('touchstart', this.boundHandlePressStart);
    }
    if (this.boundHandlePressEnd) {
      window.removeEventListener('mouseup', this.boundHandlePressEnd);
      window.removeEventListener('touchend', this.boundHandlePressEnd);
    }
    if (this.boundHandleResize) {
      window.removeEventListener('resize', this.boundHandleResize);
    }
    if (this.boundHandleVisibilityChange) {
      document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);
    }
    
    // Отключение observer
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    
    // Удаление canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // Очистка ссылок
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.noiseGenerator = null;
    this.isInitialized = false;
  }
}
