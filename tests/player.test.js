'use strict';

const { Player, CHARACTER_STATS } = require('../src/player');

describe('CHARACTER_STATS', () => {
  test('contains all four playable characters', () => {
    expect(CHARACTER_STATS).toHaveProperty('fireboy');
    expect(CHARACTER_STATS).toHaveProperty('butch');
    expect(CHARACTER_STATS).toHaveProperty('anabel');
    expect(CHARACTER_STATS).toHaveProperty('caroline');
  });

  test('each character has required stats', () => {
    for (const [id, stats] of Object.entries(CHARACTER_STATS)) {
      expect(stats).toHaveProperty('name');
      expect(stats).toHaveProperty('speed');
      expect(stats).toHaveProperty('jumpForce');
      expect(stats).toHaveProperty('maxHealth');
      expect(stats).toHaveProperty('attackPower');
      expect(stats).toHaveProperty('attackCooldown');
      expect(stats).toHaveProperty('sprite');
      expect(stats).toHaveProperty('width');
      expect(stats).toHaveProperty('height');
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.maxHealth).toBeGreaterThan(0);
    }
  });
});

describe('Player', () => {
  let player;
  const mockInput = {
    isMovingLeft: () => false,
    isMovingRight: () => false,
    isJumping: () => false,
    isCrouching: () => false,
    isAttacking: () => false
  };

  beforeEach(() => {
    player = new Player('fireboy');
  });

  test('constructs with correct initial state', () => {
    expect(player.name).toBe('Fireboy');
    expect(player.health).toBe(5);
    expect(player.maxHealth).toBe(5);
    expect(player.lives).toBe(3);
    expect(player.score).toBe(0);
    expect(player.destroyed).toBe(false);
    expect(player.facingRight).toBe(true);
  });

  test('throws on unknown character', () => {
    expect(() => new Player('unknown')).toThrow('Unknown character: unknown');
  });

  test('constructs all valid characters', () => {
    for (const id of Object.keys(CHARACTER_STATS)) {
      const p = new Player(id);
      expect(p.characterId).toBe(id);
      expect(p.name).toBe(CHARACTER_STATS[id].name);
    }
  });

  test('update moves player left', () => {
    const input = { ...mockInput, isMovingLeft: () => true };
    const startX = player.x;
    player.grounded = true;
    player.update(0.1, input);
    expect(player.x).toBeLessThan(startX);
    expect(player.facingRight).toBe(false);
  });

  test('update moves player right', () => {
    const input = { ...mockInput, isMovingRight: () => true };
    const startX = player.x;
    player.grounded = true;
    player.update(0.1, input);
    expect(player.x).toBeGreaterThan(startX);
    expect(player.facingRight).toBe(true);
  });

  test('jump sets negative vy when grounded', () => {
    const input = { ...mockInput, isJumping: () => true };
    player.grounded = true;
    player.update(0.016, input);
    expect(player.vy).toBeLessThan(0);
    expect(player.grounded).toBe(false);
  });

  test('cannot jump when airborne', () => {
    const input = { ...mockInput, isJumping: () => true };
    player.grounded = false;
    player.vy = -100;
    player.update(0.016, input);
    // vy should increase (gravity), not reset to jumpForce
    expect(player.vy).toBeGreaterThan(-100);
  });

  test('gravity pulls player down when airborne', () => {
    player.grounded = false;
    player.vy = 0;
    player.y = 100;
    player.update(0.1, mockInput);
    expect(player.vy).toBeGreaterThan(0);
  });

  test('player lands on platform', () => {
    player.y = 500; // below platform
    player.grounded = false;
    player.vy = 100;
    player.update(0.016, mockInput);
    expect(player.grounded).toBe(true);
    expect(player.y).toBe(player.platformY - player.height);
    expect(player.vy).toBe(0);
  });

  test('update does nothing when destroyed', () => {
    player.destroyed = true;
    const oldX = player.x;
    const input = { ...mockInput, isMovingRight: () => true };
    player.update(0.1, input);
    expect(player.x).toBe(oldX);
  });

  test('canAttack returns true when cooldown elapsed', () => {
    player.attackTimer = 0;
    expect(player.canAttack()).toBe(true);
  });

  test('canAttack returns false during cooldown', () => {
    player.attackTimer = 0.5;
    expect(player.canAttack()).toBe(false);
  });

  test('canAttack returns false when destroyed', () => {
    player.destroyed = true;
    player.attackTimer = 0;
    expect(player.canAttack()).toBe(false);
  });

  test('attack returns projectile config when ready', () => {
    player.attackTimer = 0;
    player.facingRight = true;
    const proj = player.attack();
    expect(proj).not.toBeNull();
    expect(proj.vx).toBeGreaterThan(0);
    expect(proj.owner).toBe(player);
    expect(proj.type).toBe('player_bullet');
    expect(proj.damage).toBe(player.attackPower);
  });

  test('attack returns null when on cooldown', () => {
    player.attackTimer = 0.5;
    expect(player.attack()).toBeNull();
  });

  test('attack fires left when facing left', () => {
    player.attackTimer = 0;
    player.facingRight = false;
    const proj = player.attack();
    expect(proj.vx).toBeLessThan(0);
  });

  test('attack sets cooldown timer', () => {
    player.attackTimer = 0;
    player.attack();
    expect(player.attackTimer).toBe(player.attackCooldown);
  });

  test('takeDamage reduces health', () => {
    player.takeDamage(2);
    expect(player.health).toBe(3);
  });

  test('takeDamage makes player invincible', () => {
    player.takeDamage(1);
    expect(player.invincible).toBe(true);
    expect(player.invincibleTimer).toBe(player.invincibleDuration);
  });

  test('takeDamage ignored when invincible', () => {
    player.invincible = true;
    const result = player.takeDamage(1);
    expect(result).toBe(false);
    expect(player.health).toBe(5);
  });

  test('takeDamage ignored when destroyed', () => {
    player.destroyed = true;
    const result = player.takeDamage(1);
    expect(result).toBe(false);
  });

  test('takeDamage triggers death and respawn when lives remain', () => {
    const died = player.takeDamage(5);
    expect(died).toBe(true);
    // Player respawns with full health since lives > 0
    expect(player.health).toBe(player.maxHealth);
    expect(player.lives).toBe(2);
    expect(player.destroyed).toBe(false);
  });

  test('player respawns after death with lives remaining', () => {
    player.lives = 2;
    player.takeDamage(5);
    expect(player.health).toBe(player.maxHealth);
    expect(player.lives).toBe(1);
    expect(player.destroyed).toBe(false);
  });

  test('player is destroyed when no lives remain', () => {
    player.lives = 1;
    player.takeDamage(5);
    expect(player.destroyed).toBe(true);
    expect(player.lives).toBe(0);
  });

  test('invincibility wears off after duration', () => {
    player.invincible = true;
    player.invincibleTimer = 0.5;
    player.grounded = true;
    player.update(0.6, mockInput);
    expect(player.invincible).toBe(false);
  });

  test('addScore increments score', () => {
    player.addScore(1000);
    expect(player.score).toBe(1000);
    player.addScore(500);
    expect(player.score).toBe(1500);
  });

  test('isAlive returns correct state', () => {
    expect(player.isAlive()).toBe(true);
    player.destroyed = true;
    expect(player.isAlive()).toBe(false);
  });

  test('getBoundingBox returns correct box', () => {
    player.x = 50;
    player.y = 100;
    const box = player.getBoundingBox();
    expect(box.x).toBe(50);
    expect(box.y).toBe(100);
    expect(box.width).toBe(player.width);
    expect(box.height).toBe(player.height);
  });

  test('getHealthPercent returns correct ratio', () => {
    expect(player.getHealthPercent()).toBe(1);
    player.health = 2;
    expect(player.getHealthPercent()).toBe(2 / 5);
  });

  test('respawn resets position and state', () => {
    player.x = 500;
    player.y = 100;
    player.vx = 200;
    player.vy = -100;
    player.health = 1;
    player.attackTimer = 0.5;
    player.respawn();
    expect(player.x).toBe(100);
    expect(player.health).toBe(player.maxHealth);
    expect(player.vx).toBe(0);
    expect(player.vy).toBe(0);
    expect(player.grounded).toBe(true);
    expect(player.invincible).toBe(true);
    expect(player.attackTimer).toBe(0);
  });

  test('attack cooldown decreases over time', () => {
    player.attackTimer = 0.5;
    player.grounded = true;
    player.update(0.3, mockInput);
    expect(player.attackTimer).toBeCloseTo(0.2, 5);
  });
});
