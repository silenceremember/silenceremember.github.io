/**
 * NoiseRingsBackground Web Worker
 * Выполняет рендеринг колец в фоновом потоке с использованием OffscreenCanvas
 */

'use strict';

// ============================================================================
// SIMPLEX NOISE GENERATOR (копия из основного файла)
// ============================================================================

class SimplexNoise {
    constructor(seed = Math.random() * 65536) {
        this.p = this.buildPermutationTable(seed);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);

        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }

        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        this.F3 = 1.0 / 3.0;
        this.G3 = 1.0 / 6.0;
    }

    buildPermutationTable(seed) {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        let n = 256;
        while (n > 1) {
            seed = (seed * 16807) % 2147483647;
            const k = seed % n;
            n--;
            [p[n], p[k]] = [p[k], p[n]];
        }

        return p;
    }

    dot3(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }

    noise3D(x, y, z) {
        const { perm, permMod12, grad3, F3, G3 } = this;

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

        return 32.0 * (n0 + n1 + n2 + n3);
    }
}

// ============================================================================
// WORKER STATE
// ============================================================================

let canvas = null;
let ctx = null;
let config = null;
let noiseGenerator = null;

// Размеры
let width = 0;
let height = 0;
let centerX = 0;
let centerY = 0;
let maxVisibleRadius = 0;
let dpr = 1;

// Состояние анимации
let animationFrameId = null;
let lastFrameTime = 0;
let time = 0;
let isPaused = false;

// Динамическая амплитуда
let currentNoiseAmplitude = 30;
let targetNoiseAmplitude = 30;

// Цвета
let currentColors = {
    accent: '#d90429',
    background: '#121212'
};

// RGBA кэш
const rgbaCache = new Map();

// Temp point для избежания аллокаций
const tempPoint = { x: 0, y: 0 };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hexToRgba(hex, alpha = 1) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCachedRgba(hex, opacity) {
    const key = `${hex}_${opacity.toFixed(2)}`;
    if (!rgbaCache.has(key)) {
        rgbaCache.set(key, hexToRgba(hex, opacity));
    }
    return rgbaCache.get(key);
}

function calculateOpacity(radius) {
    const normalizedPosition = Math.min(radius / maxVisibleRadius, 1.0);
    return config.minOpacity + (config.maxOpacity - config.minOpacity) * normalizedPosition;
}

function calculatePointPosition(ringIndex, angle, time, cosAngle, sinAngle, outPoint) {
    const baseRadius = ringIndex * config.ringSpacing;

    const noiseX = cosAngle * config.noiseScale * baseRadius;
    const noiseY = sinAngle * config.noiseScale * baseRadius;
    const noiseValue = noiseGenerator.noise3D(
        noiseX,
        noiseY,
        time * config.noiseSpeed + ringIndex * 0.1
    );

    const distanceFactor = ringIndex / config.ringCount;
    const amplitude = currentNoiseAmplitude * (0.5 + distanceFactor * 0.5);
    const radius = baseRadius + noiseValue * amplitude;

    outPoint.x = centerX + cosAngle * radius;
    outPoint.y = centerY + sinAngle * radius;
}

function drawRing(ringIndex, time) {
    const baseRadius = ringIndex * config.ringSpacing;
    const maxDeformation = currentNoiseAmplitude;
    const ringMinRadius = baseRadius - maxDeformation;

    if (ringMinRadius > maxVisibleRadius) {
        return false;
    }

    const opacity = calculateOpacity(baseRadius);

    if (opacity < config.opacityThreshold) {
        return false;
    }

    const TWO_PI = Math.PI * 2;
    const circumference = TWO_PI * baseRadius;
    const calculatedSegments = Math.round(circumference / config.pixelsPerSegment);
    const segments = Math.max(
        config.minSegments,
        Math.min(calculatedSegments, config.maxSegments)
    );
    const segmentAngle = TWO_PI / segments;

    ctx.beginPath();
    ctx.strokeStyle = getCachedRgba(currentColors.accent, opacity);
    ctx.lineWidth = config.ringWidth;

    let firstX = 0;
    let firstY = 0;

    for (let i = 0; i <= segments; i++) {
        const angle = i * segmentAngle;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        calculatePointPosition(ringIndex, angle, time, cosAngle, sinAngle, tempPoint);

        if (i === 0) {
            ctx.moveTo(tempPoint.x, tempPoint.y);
            firstX = tempPoint.x;
            firstY = tempPoint.y;
        } else {
            ctx.lineTo(tempPoint.x, tempPoint.y);
        }
    }

    ctx.lineTo(firstX, firstY);
    ctx.stroke();
    return true;
}

function updateNoiseAmplitude(dt) {
    // Плавная интерполяция current к target
    const lerpFactor = 1 - Math.pow(1 - config.amplitudeLerpFactor, dt * 60);
    currentNoiseAmplitude += (targetNoiseAmplitude - currentNoiseAmplitude) * lerpFactor;

    // Медленное затухание target к base
    const decayFactor = 1 - Math.pow(1 - config.amplitudeDecayFactor, dt * 60);
    targetNoiseAmplitude += (config.baseNoiseAmplitude - targetNoiseAmplitude) * decayFactor;
}

function render() {
    if (isPaused || !ctx) {
        return;
    }

    const now = performance.now();
    const rawDeltaTime = now - lastFrameTime;

    if (lastFrameTime > 0 && rawDeltaTime > 1000) {
        lastFrameTime = now;
        animationFrameId = requestAnimationFrame(render);
        return;
    }

    const dt = Math.min(rawDeltaTime / 1000, 0.033);
    lastFrameTime = now;

    time += dt;
    updateNoiseAmplitude(dt);

    ctx.clearRect(0, 0, width, height);

    for (let i = config.ringCount; i >= 1; i--) {
        drawRing(i, time);
    }

    animationFrameId = requestAnimationFrame(render);
}

function startAnimation() {
    lastFrameTime = performance.now();
    isPaused = false;
    render();
}

function pause() {
    isPaused = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resume() {
    if (!ctx) return;
    isPaused = false;
    lastFrameTime = performance.now();
    if (!animationFrameId) {
        render();
    }
}

function updateDimensions(newWidth, newHeight, newDpr) {
    width = newWidth;
    height = newHeight;
    dpr = newDpr;
    centerX = width * 0.5;
    centerY = height * 0.5;
    maxVisibleRadius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));

    if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
    }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = function (e) {
    const { type, ...data } = e.data;

    switch (type) {
        case 'init':
            canvas = data.canvas;
            ctx = canvas.getContext('2d');
            config = data.config;
            noiseGenerator = new SimplexNoise();
            currentNoiseAmplitude = config.baseNoiseAmplitude;
            targetNoiseAmplitude = config.baseNoiseAmplitude;

            if (data.colors) {
                currentColors = data.colors;
            }

            updateDimensions(data.width, data.height, data.dpr);
            startAnimation();
            break;

        case 'resize':
            updateDimensions(data.width, data.height, data.dpr);
            break;

        case 'updateColors':
            currentColors = data.colors;
            rgbaCache.clear();
            break;

        case 'updateAmplitude':
            targetNoiseAmplitude = Math.min(
                targetNoiseAmplitude + data.boost,
                config.maxNoiseAmplitude
            );
            break;

        case 'pause':
            pause();
            break;

        case 'resume':
            resume();
            break;

        case 'destroy':
            pause();
            canvas = null;
            ctx = null;
            config = null;
            noiseGenerator = null;
            rgbaCache.clear();
            self.close();
            break;
    }
};
