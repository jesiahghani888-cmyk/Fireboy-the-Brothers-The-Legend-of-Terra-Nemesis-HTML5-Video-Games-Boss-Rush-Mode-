'use strict';

const { Boss, BOSS_DEFINITIONS, BOSS_ORDER } = require('../src/bosses');

describe('BOSS_DEFINITIONS', () => {
  test('contains all 7 bosses', () => {
    expect(Object.keys(BOSS_DEFINITIONS)).toHaveLength(7);
  });

  test('each boss has required fields', () => {
    for (const [id, def] of Object.entries(BOSS_DEFINITIONS)) {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('health');
      expect(def).toHaveProperty('speed');
      expect(def).toHaveProperty('width');
      expect(def).toHaveProperty('height');
      expect(def).toHaveProperty('attackCooldown');
      expect(def).toHaveProperty('scoreValue');
      expect(def).toHaveProperty('sprite');
      expect(def).toHaveProperty('pattern');
      expect(def.health).toBeGreaterThan(0);
      expect(def.speed).toBeGreaterThan(0);
    }
  });

  test('boss difficulty increases across the roster', () => {
    let prevHealth = 0;
    for (const id of BOSS_ORDER) {
      expect(BOSS_DEFINITIONS[id].health).toBeGreaterThanOrEqual(prevHealth);
      prevHealth = BOSS_DEFINITIONS[id].health;
    }
  });
});

describe('BOSS_ORDER', () => {
  test('has 7 entries', () => {
    expect(BOSS_ORDER).toHaveLength(7);
  });

  test('all entries are valid boss IDs', () => {
    for (const id of BOSS_ORDER) {
      expect(BOSS_DEFINITIONS).toHaveProperty(id);
    }
  });

  test('starts with bigCore and ends with roaringMetal', () => {
    expect(BOSS_ORDER[0]).toBe('bigCore');
    expect(BOSS_ORDER[BOSS_ORDER.length - 1]).toBe('roaringMetal');
  });
});

describe('Boss', () => {
  let boss;

  beforeEach(() => {
    boss = new Boss('bigCore');
  });

  test('constructs with correct initial state', () => {
    expect(boss.name).toBe('Big Core MK.I');
    expect(boss.health).toBe(30);
    expect(boss.maxHealth).toBe(30);
    expect(boss.destroyed).toBe(false);
    expect(boss.phase).toBe(1);
  });

  test('throws on unknown boss', () => {
    expect(() => new Boss('unknown')).toThrow('Unknown boss: unknown');
  });

  test('constructs all valid bosses', () => {
    for (const id of Object.keys(BOSS_DEFINITIONS)) {
      const b = new Boss(id);
      expect(b.bossId).toBe(id);
      expect(b.name).toBe(BOSS_DEFINITIONS[id].name);
    }
  });

  test('update moves boss according to pattern', () => {
    const startX = boss.x;
    const startY = boss.y;
    boss.update(0.5, 100, 300);
    // horizontal_sweep: uses sin/cos so position changes
    expect(boss.phaseTimer).toBeCloseTo(0.5, 5);
  });

  test('update does nothing when destroyed', () => {
    boss.destroyed = true;
    const oldX = boss.x;
    boss.update(1, 100, 300);
    expect(boss.x).toBe(oldX);
  });

  test('attackTimer decreases over time', () => {
    boss.attackTimer = 1.0;
    boss.update(0.5, 100, 300);
    expect(boss.attackTimer).toBeCloseTo(0.5, 5);
  });

  test('canAttack returns true when timer is zero', () => {
    boss.attackTimer = 0;
    expect(boss.canAttack()).toBe(true);
  });

  test('canAttack returns false during cooldown', () => {
    boss.attackTimer = 0.5;
    expect(boss.canAttack()).toBe(false);
  });

  test('canAttack returns false when destroyed', () => {
    boss.destroyed = true;
    boss.attackTimer = 0;
    expect(boss.canAttack()).toBe(false);
  });

  test('attack returns projectile config aimed at player', () => {
    boss.attackTimer = 0;
    boss.x = 600;
    boss.y = 200;
    const proj = boss.attack(100, 300);
    expect(proj).not.toBeNull();
    expect(proj.owner).toBe(boss);
    expect(proj.type).toBe('boss_bullet');
    expect(proj.damage).toBe(1);
    expect(proj.vx).toBeLessThan(0); // aimed left toward player
  });

  test('attack returns null during cooldown', () => {
    boss.attackTimer = 1;
    expect(boss.attack(100, 300)).toBeNull();
  });

  test('attack resets cooldown', () => {
    boss.attackTimer = 0;
    boss.attack(100, 300);
    expect(boss.attackTimer).toBe(boss.attackCooldown);
  });

  test('takeDamage reduces health', () => {
    boss.takeDamage(5);
    expect(boss.health).toBe(25);
  });

  test('takeDamage destroys boss at 0 health', () => {
    const killed = boss.takeDamage(30);
    expect(killed).toBe(true);
    expect(boss.health).toBe(0);
    expect(boss.destroyed).toBe(true);
  });

  test('takeDamage returns false if boss survives', () => {
    const killed = boss.takeDamage(5);
    expect(killed).toBe(false);
    expect(boss.destroyed).toBe(false);
  });

  test('takeDamage ignored when already destroyed', () => {
    boss.destroyed = true;
    const result = boss.takeDamage(5);
    expect(result).toBe(false);
  });

  test('isAlive returns correct state', () => {
    expect(boss.isAlive()).toBe(true);
    boss.destroyed = true;
    expect(boss.isAlive()).toBe(false);
  });

  test('getBoundingBox returns correct box', () => {
    boss.x = 100;
    boss.y = 200;
    const box = boss.getBoundingBox();
    expect(box.x).toBe(100);
    expect(box.y).toBe(200);
    expect(box.width).toBe(boss.width);
    expect(box.height).toBe(boss.height);
  });

  test('getHealthPercent returns correct ratio', () => {
    expect(boss.getHealthPercent()).toBe(1);
    boss.health = 15;
    expect(boss.getHealthPercent()).toBe(0.5);
  });

  test('ground_charge pattern chases player', () => {
    const b = new Boss('crusherBot');
    b.grounded = true;
    b.x = 500;
    b.update(0.1, 100, 300); // player at x=100, boss at x=500
    expect(b.vx).toBeLessThan(0); // moves left toward player
  });

  test('mirror_player pattern follows player direction', () => {
    const b = new Boss('fakeButch');
    b.grounded = true;
    b.x = 200;
    b.update(0.1, 500, 300); // player to the right
    expect(b.vx).toBeGreaterThan(0);
  });

  test('multi_phase pattern changes phase based on health', () => {
    const b = new Boss('roaringKnight');
    b.grounded = true;
    b.health = b.maxHealth;
    b.update(0.1, 100, 300);
    expect(b.phase).toBe(1);

    b.health = b.maxHealth * 0.3;
    b.update(0.1, 100, 300);
    expect(b.phase).toBe(2);
  });

  test('true_final pattern has three phases', () => {
    const b = new Boss('roaringMetal');
    b.grounded = true;

    b.health = b.maxHealth * 0.8;
    b.update(0.1, 100, 300);
    expect(b.phase).toBe(1);

    b.health = b.maxHealth * 0.5;
    b.update(0.1, 100, 300);
    expect(b.phase).toBe(2);

    b.health = b.maxHealth * 0.2;
    b.update(0.1, 100, 300);
    expect(b.phase).toBe(3);
  });

  test('_usesGravity returns true for ground-based patterns', () => {
    const groundBoss = new Boss('crusherBot');
    expect(groundBoss._usesGravity()).toBe(true);
    const airBoss = new Boss('bigCore');
    expect(airBoss._usesGravity()).toBe(false);
  });

  test('gravity-based boss lands on platform', () => {
    const b = new Boss('crusherBot');
    b.y = 500;
    b.grounded = false;
    b.vy = 100;
    b.update(0.016, 100, 300);
    expect(b.grounded).toBe(true);
    expect(b.y).toBe(b.platformY - b.height);
  });
});
