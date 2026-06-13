'use strict';

const { BoundingBox } = require('./collision');

const CHARACTER_STATS = {
  fireboy: {
    name: 'Fireboy',
    speed: 200,
    jumpForce: -400,
    maxHealth: 5,
    attackPower: 1,
    attackCooldown: 0.25,
    sprite: 'Fireboy (Playable Characters).png',
    width: 48,
    height: 64
  },
  butch: {
    name: 'Butch',
    speed: 170,
    jumpForce: -380,
    maxHealth: 7,
    attackPower: 2,
    attackCooldown: 0.4,
    sprite: 'Butch (Playable Characters).png',
    width: 52,
    height: 68
  },
  anabel: {
    name: 'Anabel',
    speed: 230,
    jumpForce: -420,
    maxHealth: 4,
    attackPower: 1,
    attackCooldown: 0.18,
    sprite: 'Anabel (Playable Characters).png',
    width: 44,
    height: 60
  },
  caroline: {
    name: 'Caroline',
    speed: 210,
    jumpForce: -440,
    maxHealth: 4,
    attackPower: 1,
    attackCooldown: 0.22,
    sprite: 'Caroline (Playable Characters).png',
    width: 46,
    height: 62
  }
};

class Player {
  constructor(characterId) {
    const stats = CHARACTER_STATS[characterId];
    if (!stats) {
      throw new Error(`Unknown character: ${characterId}`);
    }
    this.characterId = characterId;
    this.name = stats.name;
    this.x = 100;
    this.y = 300;
    this.vx = 0;
    this.vy = 0;
    this.width = stats.width;
    this.height = stats.height;
    this.speed = stats.speed;
    this.jumpForce = stats.jumpForce;
    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;
    this.attackPower = stats.attackPower;
    this.attackCooldown = stats.attackCooldown;
    this.attackTimer = 0;
    this.sprite = stats.sprite;
    this.facingRight = true;
    this.grounded = false;
    this.destroyed = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 1.5;
    this.lives = 3;
    this.score = 0;
    this.gravity = 800;
    this.platformY = 400;
  }

  update(dt, input) {
    if (this.destroyed) return;

    this.vx = 0;
    if (input.isMovingLeft()) {
      this.vx = -this.speed;
      this.facingRight = false;
    }
    if (input.isMovingRight()) {
      this.vx = this.speed;
      this.facingRight = true;
    }

    if (input.isJumping() && this.grounded) {
      this.vy = this.jumpForce;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.vy += this.gravity * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y + this.height >= this.platformY) {
      this.y = this.platformY - this.height;
      this.vy = 0;
      this.grounded = true;
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }

  canAttack() {
    return this.attackTimer <= 0 && !this.destroyed;
  }

  attack() {
    if (!this.canAttack()) return null;
    this.attackTimer = this.attackCooldown;
    const projX = this.facingRight ? this.x + this.width : this.x - 8;
    const projVx = this.facingRight ? 400 : -400;
    return {
      x: projX,
      y: this.y + this.height / 2 - 4,
      vx: projVx,
      vy: 0,
      damage: this.attackPower,
      owner: this,
      type: 'player_bullet'
    };
  }

  takeDamage(amount) {
    if (this.invincible || this.destroyed) return false;
    this.health -= amount;
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    if (this.health <= 0) {
      this.health = 0;
      this.onDeath();
      return true;
    }
    return false;
  }

  onDeath() {
    this.lives -= 1;
    if (this.lives > 0) {
      this.respawn();
    } else {
      this.destroyed = true;
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.x = 100;
    this.y = this.platformY - this.height;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.attackTimer = 0;
  }

  addScore(points) {
    this.score += points;
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

module.exports = { Player, CHARACTER_STATS };
