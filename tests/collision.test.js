'use strict';

const { BoundingBox, checkCollision, resolveCollisions, checkBounds } = require('../src/collision');

describe('BoundingBox', () => {
  test('constructs with correct properties', () => {
    const box = new BoundingBox(10, 20, 30, 40);
    expect(box.x).toBe(10);
    expect(box.y).toBe(20);
    expect(box.width).toBe(30);
    expect(box.height).toBe(40);
  });

  test('computes edges correctly', () => {
    const box = new BoundingBox(10, 20, 30, 40);
    expect(box.left).toBe(10);
    expect(box.right).toBe(40);
    expect(box.top).toBe(20);
    expect(box.bottom).toBe(60);
  });

  test('computes center correctly', () => {
    const box = new BoundingBox(0, 0, 100, 50);
    expect(box.centerX).toBe(50);
    expect(box.centerY).toBe(25);
  });

  test('containsPoint returns true for interior points', () => {
    const box = new BoundingBox(0, 0, 100, 100);
    expect(box.containsPoint(50, 50)).toBe(true);
    expect(box.containsPoint(0, 0)).toBe(true);
    expect(box.containsPoint(100, 100)).toBe(true);
  });

  test('containsPoint returns false for exterior points', () => {
    const box = new BoundingBox(0, 0, 100, 100);
    expect(box.containsPoint(-1, 50)).toBe(false);
    expect(box.containsPoint(101, 50)).toBe(false);
    expect(box.containsPoint(50, -1)).toBe(false);
    expect(box.containsPoint(50, 101)).toBe(false);
  });

  test('intersects detects overlapping boxes', () => {
    const a = new BoundingBox(0, 0, 50, 50);
    const b = new BoundingBox(25, 25, 50, 50);
    expect(a.intersects(b)).toBe(true);
    expect(b.intersects(a)).toBe(true);
  });

  test('intersects returns false for non-overlapping boxes', () => {
    const a = new BoundingBox(0, 0, 50, 50);
    const b = new BoundingBox(100, 100, 50, 50);
    expect(a.intersects(b)).toBe(false);
  });

  test('intersects returns false for adjacent boxes (touching edges)', () => {
    const a = new BoundingBox(0, 0, 50, 50);
    const b = new BoundingBox(50, 0, 50, 50);
    expect(a.intersects(b)).toBe(false);
  });

  test('getOverlapArea returns correct area', () => {
    const a = new BoundingBox(0, 0, 50, 50);
    const b = new BoundingBox(25, 25, 50, 50);
    expect(a.getOverlapArea(b)).toBe(625); // 25 * 25
  });

  test('getOverlapArea returns 0 for non-overlapping boxes', () => {
    const a = new BoundingBox(0, 0, 50, 50);
    const b = new BoundingBox(100, 100, 50, 50);
    expect(a.getOverlapArea(b)).toBe(0);
  });

  test('clone creates an independent copy', () => {
    const a = new BoundingBox(10, 20, 30, 40);
    const b = a.clone();
    expect(b.x).toBe(a.x);
    expect(b.y).toBe(a.y);
    b.x = 999;
    expect(a.x).toBe(10);
  });
});

describe('checkCollision', () => {
  const makeEntity = (x, y, w, h, opts = {}) => ({
    getBoundingBox: () => new BoundingBox(x, y, w, h),
    ...opts
  });

  test('returns true when entities overlap', () => {
    const a = makeEntity(0, 0, 50, 50);
    const b = makeEntity(25, 25, 50, 50);
    expect(checkCollision(a, b)).toBe(true);
  });

  test('returns false when entities do not overlap', () => {
    const a = makeEntity(0, 0, 50, 50);
    const b = makeEntity(200, 200, 50, 50);
    expect(checkCollision(a, b)).toBe(false);
  });
});

describe('resolveCollisions', () => {
  const makeEntity = (x, y, w, h, opts = {}) => ({
    getBoundingBox: () => new BoundingBox(x, y, w, h),
    destroyed: false,
    ...opts
  });

  test('detects projectile-entity hits', () => {
    const entity = makeEntity(40, 40, 50, 50);
    const projectile = makeEntity(45, 45, 10, 10, { owner: null });
    const hits = resolveCollisions([entity], [projectile]);
    expect(hits).toHaveLength(1);
    expect(hits[0].entity).toBe(entity);
    expect(hits[0].projectile).toBe(projectile);
  });

  test('ignores projectile hitting its owner', () => {
    const entity = makeEntity(40, 40, 50, 50);
    const projectile = makeEntity(45, 45, 10, 10, { owner: entity });
    const hits = resolveCollisions([entity], [projectile]);
    expect(hits).toHaveLength(0);
  });

  test('ignores destroyed projectiles', () => {
    const entity = makeEntity(40, 40, 50, 50);
    const projectile = makeEntity(45, 45, 10, 10, { owner: null, destroyed: true });
    const hits = resolveCollisions([entity], [projectile]);
    expect(hits).toHaveLength(0);
  });

  test('ignores destroyed entities', () => {
    const entity = makeEntity(40, 40, 50, 50, { destroyed: true });
    const projectile = makeEntity(45, 45, 10, 10, { owner: null });
    const hits = resolveCollisions([entity], [projectile]);
    expect(hits).toHaveLength(0);
  });

  test('returns empty array when no collisions', () => {
    const entity = makeEntity(0, 0, 50, 50);
    const projectile = makeEntity(200, 200, 10, 10, { owner: null });
    const hits = resolveCollisions([entity], [projectile]);
    expect(hits).toHaveLength(0);
  });
});

describe('checkBounds', () => {
  const makeEntity = (x, y, w, h) => ({
    getBoundingBox: () => new BoundingBox(x, y, w, h)
  });

  test('detects entity touching left boundary', () => {
    const entity = makeEntity(-5, 50, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.left).toBe(true);
    expect(bounds.right).toBe(false);
  });

  test('detects entity touching right boundary', () => {
    const entity = makeEntity(790, 50, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.right).toBe(true);
    expect(bounds.left).toBe(false);
  });

  test('detects entity fully out of bounds', () => {
    const entity = makeEntity(-100, -100, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.outOfBounds).toBe(true);
  });

  test('entity within bounds reports no violations', () => {
    const entity = makeEntity(100, 100, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.left).toBe(false);
    expect(bounds.right).toBe(false);
    expect(bounds.top).toBe(false);
    expect(bounds.bottom).toBe(false);
    expect(bounds.outOfBounds).toBe(false);
  });

  test('detects entity touching top boundary', () => {
    const entity = makeEntity(50, -5, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.top).toBe(true);
  });

  test('detects entity touching bottom boundary', () => {
    const entity = makeEntity(50, 470, 20, 20);
    const bounds = checkBounds(entity, 800, 480);
    expect(bounds.bottom).toBe(true);
  });
});
