'use strict';

const { BoundingBox } = require('./collision');

class Projectile {
  constructor({ x, y, vx, vy, width, height, damage, owner, type }) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy || 0;
    this.width = width || 8;
    this.height = height || 8;
    this.damage = damage || 1;
    this.owner = owner || null;
    this.type = type || 'bullet';
    this.destroyed = false;
    this.age = 0;
    this.maxAge = 300;
  }

  update(dt) {
    if (this.destroyed) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
    if (this.age >= this.maxAge) {
      this.destroyed = true;
    }
  }

  getBoundingBox() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }

  destroy() {
    this.destroyed = true;
  }
}

class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  spawn(config) {
    const proj = new Projectile(config);
    this.projectiles.push(proj);
    return proj;
  }

  update(dt) {
    for (const p of this.projectiles) {
      p.update(dt);
    }
    this.projectiles = this.projectiles.filter(p => !p.destroyed);
  }

  getByOwner(owner) {
    return this.projectiles.filter(p => p.owner === owner);
  }

  getByType(type) {
    return this.projectiles.filter(p => p.type === type);
  }

  clear() {
    this.projectiles = [];
  }

  get count() {
    return this.projectiles.length;
  }

  removeOutOfBounds(canvasWidth, canvasHeight) {
    this.projectiles = this.projectiles.filter(p => {
      return p.x + p.width > 0 && p.x < canvasWidth &&
             p.y + p.height > 0 && p.y < canvasHeight;
    });
  }
}

module.exports = { Projectile, ProjectileManager };
