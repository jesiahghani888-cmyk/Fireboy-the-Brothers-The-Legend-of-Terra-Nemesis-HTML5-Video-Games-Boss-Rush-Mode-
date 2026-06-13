'use strict';

const { BoundingBox } = require('./collision');

const BOSS_DEFINITIONS = {
  bigCore: {
    name: 'Big Core MK.I',
    health: 30,
    speed: 100,
    width: 80,
    height: 60,
    attackCooldown: 1.5,
    scoreValue: 5000,
    sprite: 'Big Core MK.I (Boss).png',
    pattern: 'horizontal_sweep'
  },
  crusherBot: {
    name: 'Crusher-Bot MK.II',
    health: 45,
    speed: 80,
    width: 72,
    height: 72,
    attackCooldown: 2.0,
    scoreValue: 7000,
    sprite: 'Crusher-Bot MK.II (Boss).png',
    pattern: 'ground_charge'
  },
  fakeButch: {
    name: 'Fake Butch',
    health: 50,
    speed: 160,
    width: 52,
    height: 68,
    attackCooldown: 0.8,
    scoreValue: 8000,
    sprite: 'Fake Butch (Boss).png',
    pattern: 'mirror_player'
  },
  mandler: {
    name: 'Mandler',
    health: 60,
    speed: 120,
    width: 80,
    height: 80,
    attackCooldown: 1.2,
    scoreValue: 10000,
    sprite: 'Mandler from Terra Cresta (Boss).png',
    pattern: 'aerial_dive'
  },
  metalSonic: {
    name: 'Metal Sonic',
    health: 70,
    speed: 220,
    width: 48,
    height: 52,
    attackCooldown: 0.6,
    scoreValue: 15000,
    sprite: 'Metal Sonic (Boss).png',
    pattern: 'speed_rush'
  },
  roaringKnight: {
    name: 'Roaring Knight',
    health: 100,
    speed: 140,
    width: 64,
    height: 80,
    attackCooldown: 1.0,
    scoreValue: 25000,
    sprite: 'Roaring Knight from Deltarune (Final Boss).png',
    pattern: 'multi_phase'
  },
  roaringMetal: {
    name: 'Roaring Metal',
    health: 150,
    speed: 180,
    width: 80,
    height: 88,
    attackCooldown: 0.5,
    scoreValue: 50000,
    sprite: 'Roaring Metal - Roaring Knight x Metal Sonic (True Final Boss).png',
    pattern: 'true_final'
  }
};

const BOSS_ORDER = [
  'bigCore', 'crusherBot', 'fakeButch', 'mandler',
  'metalSonic', 'roaringKnight', 'roaringMetal'
];

class Boss {
  constructor(bossId) {
    const def = BOSS_DEFINITIONS[bossId];
    if (!def) {
      throw new Error(`Unknown boss: ${bossId}`);
    }
    this.bossId = bossId;
    this.name = def.name;
    this.maxHealth = def.health;
    this.health = def.health;
    this.speed = def.speed;
    this.width = def.width;
    this.height = def.height;
    this.attackCooldown = def.attackCooldown;
    this.attackTimer = def.attackCooldown;
    this.scoreValue = def.scoreValue;
    this.sprite = def.sprite;
    this.pattern = def.pattern;
    this.x = 600;
    this.y = 200;
    this.vx = 0;
    this.vy = 0;
    this.destroyed = false;
    this.phase = 1;
    this.phaseTimer = 0;
    this.platformY = 400;
    this.gravity = 800;
    this.grounded = false;
  }

  update(dt, playerX, playerY) {
    if (this.destroyed) return;
    this.phaseTimer += dt;
    this._runPattern(dt, playerX, playerY);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this._usesGravity()) {
      if (!this.grounded) {
        this.vy += this.gravity * dt;
      }
      if (this.y + this.height >= this.platformY) {
        this.y = this.platformY - this.height;
        this.vy = 0;
        this.grounded = true;
      }
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }
  }

  _usesGravity() {
    return ['ground_charge', 'mirror_player', 'speed_rush', 'multi_phase', 'true_final'].includes(this.pattern);
  }

  _runPattern(dt, playerX, playerY) {
    switch (this.pattern) {
      case 'horizontal_sweep':
        this.vy = Math.sin(this.phaseTimer * 2) * this.speed * 0.5;
        this.vx = Math.cos(this.phaseTimer) * this.speed * 0.3;
        break;
      case 'ground_charge':
        if (this.grounded) {
          this.vx = playerX < this.x ? -this.speed : this.speed;
        }
        break;
      case 'mirror_player':
        this.vx = playerX > this.x ? this.speed : -this.speed;
        if (this.grounded && Math.abs(playerX - this.x) < 100) {
          this.vy = -350;
          this.grounded = false;
        }
        break;
      case 'aerial_dive':
        this.vy = Math.sin(this.phaseTimer * 1.5) * this.speed;
        this.vx = Math.cos(this.phaseTimer * 0.8) * this.speed * 0.5;
        break;
      case 'speed_rush':
        if (this.grounded && this.phaseTimer % 3 < 1.5) {
          this.vx = playerX < this.x ? -this.speed : this.speed;
        } else if (this.grounded) {
          this.vx = 0;
        }
        break;
      case 'multi_phase':
        this._multiPhasePattern(dt, playerX, playerY);
        break;
      case 'true_final':
        this._trueFinalPattern(dt, playerX, playerY);
        break;
    }
  }

  _multiPhasePattern(dt, playerX, playerY) {
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.5) {
      this.phase = 1;
      this.vx = playerX > this.x ? this.speed * 0.8 : -this.speed * 0.8;
    } else {
      this.phase = 2;
      this.vx = playerX > this.x ? this.speed : -this.speed;
      if (this.grounded && Math.random() < 0.02) {
        this.vy = -400;
        this.grounded = false;
      }
    }
  }

  _trueFinalPattern(dt, playerX, playerY) {
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.66) {
      this.phase = 1;
      this.vx = playerX > this.x ? this.speed * 0.7 : -this.speed * 0.7;
    } else if (healthPercent > 0.33) {
      this.phase = 2;
      this.vx = playerX > this.x ? this.speed : -this.speed;
    } else {
      this.phase = 3;
      this.vx = playerX > this.x ? this.speed * 1.3 : -this.speed * 1.3;
      if (this.grounded && Math.random() < 0.03) {
        this.vy = -500;
        this.grounded = false;
      }
    }
  }

  canAttack() {
    return this.attackTimer <= 0 && !this.destroyed;
  }

  attack(playerX, playerY) {
    if (!this.canAttack()) return null;
    this.attackTimer = this.attackCooldown;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      vx: (dx / dist) * 250,
      vy: (dy / dist) * 250,
      damage: 1,
      owner: this,
      type: 'boss_bullet',
      width: 12,
      height: 12
    };
  }

  takeDamage(amount) {
    if (this.destroyed) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroyed = true;
      return true;
    }
    return false;
  }

  isAlive() {
    return !this.destroyed;
  }

  getBoundingBox() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }

  getHealthPercent() {
    return this.health / this.maxHealth;
  }
}

module.exports = { Boss, BOSS_DEFINITIONS, BOSS_ORDER };
