'use strict';

const { Projectile, ProjectileManager } = require('../src/projectiles');

describe('Projectile', () => {
  test('constructs with default values', () => {
    const p = new Projectile({ x: 10, y: 20 });
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.width).toBe(8);
    expect(p.height).toBe(8);
    expect(p.damage).toBe(1);
    expect(p.type).toBe('bullet');
    expect(p.destroyed).toBe(false);
    expect(p.age).toBe(0);
  });

  test('constructs with custom values', () => {
    const owner = { name: 'player' };
    const p = new Projectile({
      x: 5, y: 10, vx: 100, vy: -50,
      width: 16, height: 4, damage: 3,
      owner, type: 'laser'
    });
    expect(p.vx).toBe(100);
    expect(p.vy).toBe(-50);
    expect(p.width).toBe(16);
    expect(p.damage).toBe(3);
    expect(p.owner).toBe(owner);
    expect(p.type).toBe('laser');
  });

  test('update moves projectile by velocity * dt', () => {
    const p = new Projectile({ x: 0, y: 0, vx: 100, vy: 50 });
    p.update(0.5);
    expect(p.x).toBe(50);
    expect(p.y).toBe(25);
    expect(p.age).toBe(0.5);
  });

  test('update does nothing when destroyed', () => {
    const p = new Projectile({ x: 0, y: 0, vx: 100, vy: 50 });
    p.destroyed = true;
    p.update(1);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  test('auto-destroys when maxAge reached', () => {
    const p = new Projectile({ x: 0, y: 0, vx: 1, vy: 0 });
    p.maxAge = 10;
    p.update(10);
    expect(p.destroyed).toBe(true);
  });

  test('getBoundingBox returns correct box', () => {
    const p = new Projectile({ x: 10, y: 20, width: 16, height: 8 });
    const box = p.getBoundingBox();
    expect(box.x).toBe(10);
    expect(box.y).toBe(20);
    expect(box.width).toBe(16);
    expect(box.height).toBe(8);
  });

  test('destroy sets destroyed flag', () => {
    const p = new Projectile({ x: 0, y: 0 });
    p.destroy();
    expect(p.destroyed).toBe(true);
  });
});

describe('ProjectileManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ProjectileManager();
  });

  test('starts empty', () => {
    expect(manager.count).toBe(0);
    expect(manager.projectiles).toHaveLength(0);
  });

  test('spawn adds a projectile', () => {
    const p = manager.spawn({ x: 0, y: 0, vx: 100, vy: 0 });
    expect(manager.count).toBe(1);
    expect(p).toBeInstanceOf(Projectile);
  });

  test('update moves all projectiles and removes destroyed', () => {
    manager.spawn({ x: 0, y: 0, vx: 100, vy: 0 });
    const p2 = manager.spawn({ x: 0, y: 0, vx: 50, vy: 0 });
    p2.destroyed = true;

    manager.update(1);
    expect(manager.count).toBe(1);
    expect(manager.projectiles[0].x).toBe(100);
  });

  test('getByOwner filters by owner', () => {
    const owner1 = { id: 1 };
    const owner2 = { id: 2 };
    manager.spawn({ x: 0, y: 0, owner: owner1 });
    manager.spawn({ x: 0, y: 0, owner: owner2 });
    manager.spawn({ x: 0, y: 0, owner: owner1 });

    const owned = manager.getByOwner(owner1);
    expect(owned).toHaveLength(2);
  });

  test('getByType filters by type', () => {
    manager.spawn({ x: 0, y: 0, type: 'bullet' });
    manager.spawn({ x: 0, y: 0, type: 'laser' });
    manager.spawn({ x: 0, y: 0, type: 'bullet' });

    expect(manager.getByType('bullet')).toHaveLength(2);
    expect(manager.getByType('laser')).toHaveLength(1);
  });

  test('clear removes all projectiles', () => {
    manager.spawn({ x: 0, y: 0 });
    manager.spawn({ x: 0, y: 0 });
    manager.clear();
    expect(manager.count).toBe(0);
  });

  test('removeOutOfBounds removes off-screen projectiles', () => {
    manager.spawn({ x: 100, y: 100 }); // in bounds
    manager.spawn({ x: -50, y: 100 }); // out left (x:-50, w:8 → right=-42 < 0)
    manager.spawn({ x: 900, y: 100 }); // out right (x:900 > 800)

    manager.removeOutOfBounds(800, 480);
    expect(manager.count).toBe(1);
  });

  test('removeOutOfBounds keeps partially visible projectiles', () => {
    manager.spawn({ x: -5, y: 100 }); // partially visible (x:-5, w:8 → right=3 > 0)
    manager.removeOutOfBounds(800, 480);
    expect(manager.count).toBe(1);
  });
});
