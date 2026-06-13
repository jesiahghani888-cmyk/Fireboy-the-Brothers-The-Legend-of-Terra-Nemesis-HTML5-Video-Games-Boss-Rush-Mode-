/**
 * Shared utility functions for the Boss Rush game engine.
 */

/** Clamp a value between min and max. */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Decay a value toward zero by dt (never goes below 0). */
export function decay(val, dt) {
  return Math.max(0, val - dt);
}

/** AABB rectangle overlap test. */
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Load an Image by filename. */
export function loadImage(name) {
  const i = new Image();
  i.src = name;
  return i;
}

/** Load an Audio element by filename (URL-encodes path segments). */
export function loadSound(name) {
  const url = name.split('/').map(encodeURIComponent).join('/');
  const a = new Audio(url);
  a.preload = 'auto';
  return a;
}

/** Play an audio element from the beginning, swallowing errors. */
export function playSound(a) {
  try { a.currentTime = 0; a.play(); } catch (e) { /* user interaction required */ }
}

/** Spawn n particles at (x, y) with color c into the given array. */
export function spawnParticles(arr, x, y, c, n = 10) {
  for (let i = 0; i < n; i++) {
    arr.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30 + Math.random() * 25,
      c
    });
  }
}

/**
 * Apply damage to a target entity.
 * Handles HP decrement, invincibility frames, screen shake, sound, and particles.
 * Returns true if the target died (hp <= 0).
 */
export function applyDamage(target, amount, opts) {
  const { shake, sound, particles, particleColor, particleCount = 14, ifrFrames = 90 } = opts;
  target.hp -= amount;
  if (target.ifr !== undefined) target.ifr = ifrFrames;
  if (sound) playSound(sound);
  if (particles && particleColor) {
    spawnParticles(particles, target.x + target.w / 2, target.y + target.h / 2, particleColor, particleCount);
  }
  return { shakeAmount: shake, dead: target.hp <= 0 };
}

/**
 * Register pointer-end events (pointerup, pointercancel, pointerleave) on an element.
 * Calls handler for each event type.
 */
export function onPointerEnd(el, handler) {
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, handler));
}

/**
 * Draw a text label on the canvas with given style.
 * opts: { color, font, align }
 */
export function drawLabel(ctx, text, x, y, opts = {}) {
  const { color = '#fff', font = '700 20px Trebuchet MS', align } = opts;
  if (align) ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y);
  if (align) ctx.textAlign = 'left';
}

/**
 * Draw a health/progress bar.
 */
export function drawBar(ctx, x, y, w, h, percent, color, label) {
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, percent), h);
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.strokeRect(x, y, w, h);
  drawLabel(ctx, label, x + 8, y + h - 6, { font: '700 14px Trebuchet MS' });
}

/**
 * Gimmick attack definitions — data-driven boss attack patterns.
 * Each entry: { gimmick, interval, spawn(boss, canvas, player, stageIndex) }
 * spawn returns an array of shot descriptors: { x, y, vx, vy, w, h, c }
 */
export const GIMMICK_ATTACKS = [
  {
    gimmick: 'laser-wall', interval: 140,
    spawn(boss, canvas) {
      const shots = [];
      for (let y = 70; y < canvas.height - 120; y += 76)
        shots.push({ x: boss.x - 20, y, vx: -8, vy: 0, w: 70, h: 9, c: '#ff3030' });
      return shots;
    }
  },
  {
    gimmick: 'mirror-rival', interval: 90,
    spawn(boss, canvas, player) {
      return [{ x: player.x + 130, y: 70, vx: -2, vy: 6, w: 32, h: 32, c: '#56ff6d' }];
    }
  },
  {
    gimmick: 'swarm', interval: 28,
    spawn(boss, canvas) {
      return [{ x: canvas.width - 30, y: 60 + Math.random() * 360, vx: -3 - Math.random() * 4, vy: Math.random() * 2 - 1, w: 16, h: 16, c: '#ffcf4a' }];
    }
  },
  {
    gimmick: 'crushers', interval: 120,
    spawn() {
      return [{ x: 180 + Math.random() * 520, y: -80, vx: 0, vy: 7, w: 54, h: 90, c: '#a7b4c9' }];
    }
  },
  {
    gimmick: 'speed-echo', interval: 32,
    spawn(boss) {
      return [{ x: boss.x - 10, y: boss.y + Math.random() * boss.h, vx: -9, vy: Math.random() * 4 - 2, w: 28, h: 12, c: '#4ac9ff' }];
    }
  },
  {
    gimmick: 'darkness', interval: 160,
    spawn() { return null; } // handled as a visual effect, not a projectile
  },
  {
    gimmick: 'fusion-chaos', interval: 42,
    spawn(boss) {
      return [
        { x: boss.x, y: boss.y, vx: -7, vy: -2, w: 30, h: 14, c: '#ff3b8f' },
        { x: boss.x, y: boss.y + boss.h, vx: -7, vy: 2, w: 30, h: 14, c: '#c16cff' }
      ];
    }
  }
];
