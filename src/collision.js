'use strict';

class BoundingBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }
  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }

  containsPoint(px, py) {
    return px >= this.left && px <= this.right &&
           py >= this.top && py <= this.bottom;
  }

  intersects(other) {
    return this.left < other.right &&
           this.right > other.left &&
           this.top < other.bottom &&
           this.bottom > other.top;
  }

  getOverlapArea(other) {
    const overlapX = Math.max(0, Math.min(this.right, other.right) - Math.max(this.left, other.left));
    const overlapY = Math.max(0, Math.min(this.bottom, other.bottom) - Math.max(this.top, other.top));
    return overlapX * overlapY;
  }

  clone() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }
}

function checkCollision(entityA, entityB) {
  const boxA = entityA.getBoundingBox();
  const boxB = entityB.getBoundingBox();
  return boxA.intersects(boxB);
}

function resolveCollisions(entities, projectiles) {
  const hits = [];
  for (let i = 0; i < projectiles.length; i++) {
    for (let j = 0; j < entities.length; j++) {
      if (projectiles[i].owner === entities[j]) continue;
      if (projectiles[i].destroyed || entities[j].destroyed) continue;
      if (checkCollision(projectiles[i], entities[j])) {
        hits.push({ projectile: projectiles[i], entity: entities[j] });
      }
    }
  }
  return hits;
}

function checkBounds(entity, canvasWidth, canvasHeight) {
  const box = entity.getBoundingBox();
  return {
    left: box.left < 0,
    right: box.right > canvasWidth,
    top: box.top < 0,
    bottom: box.bottom > canvasHeight,
    outOfBounds: box.right < 0 || box.left > canvasWidth ||
                 box.bottom < 0 || box.top > canvasHeight
  };
}

module.exports = { BoundingBox, checkCollision, resolveCollisions, checkBounds };
