'use strict';

class HUD {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.healthBarWidth = 200;
    this.healthBarHeight = 20;
    this.bossHealthBarWidth = 300;
    this.bossHealthBarHeight = 16;
    this.padding = 10;
    this.fontSize = 16;
    this.visible = true;
  }

  getPlayerHealthBarRect() {
    return {
      x: this.padding,
      y: this.padding,
      width: this.healthBarWidth,
      height: this.healthBarHeight
    };
  }

  getBossHealthBarRect() {
    return {
      x: (this.canvasWidth - this.bossHealthBarWidth) / 2,
      y: this.padding,
      width: this.bossHealthBarWidth,
      height: this.bossHealthBarHeight
    };
  }

  getScorePosition() {
    return {
      x: this.canvasWidth - this.padding,
      y: this.padding + this.fontSize
    };
  }

  getLivesPosition() {
    return {
      x: this.padding,
      y: this.padding + this.healthBarHeight + this.fontSize + 5
    };
  }

  getBossWarningRect() {
    return {
      x: this.canvasWidth / 2 - 150,
      y: this.canvasHeight / 2 - 30,
      width: 300,
      height: 60
    };
  }

  formatScore(score) {
    return String(score).padStart(8, '0');
  }

  formatLives(lives) {
    return `LIVES: ${lives}`;
  }

  formatBossName(name) {
    return `WARNING: ${name.toUpperCase()} APPROACHING!`;
  }

  toggle() {
    this.visible = !this.visible;
    return this.visible;
  }
}

const GAME_STATES = {
  TITLE: 'title',
  CHARACTER_SELECT: 'character_select',
  PLAYING: 'playing',
  BOSS_WARNING: 'boss_warning',
  BOSS_DEFEATED: 'boss_defeated',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  PAUSED: 'paused'
};

class MenuSystem {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.selectedIndex = 0;
    this.items = [];
  }

  setItems(items) {
    this.items = items;
    this.selectedIndex = 0;
  }

  moveUp() {
    if (this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
  }

  moveDown() {
    if (this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
  }

  getSelected() {
    if (this.items.length === 0) return null;
    return this.items[this.selectedIndex];
  }

  getItemRect(index) {
    const itemHeight = 50;
    const totalHeight = this.items.length * itemHeight;
    const startY = (this.canvasHeight - totalHeight) / 2;
    return {
      x: this.canvasWidth / 2 - 120,
      y: startY + index * itemHeight,
      width: 240,
      height: 40
    };
  }

  getItemAtPoint(x, y) {
    for (let i = 0; i < this.items.length; i++) {
      const rect = this.getItemRect(i);
      if (x >= rect.x && x <= rect.x + rect.width &&
          y >= rect.y && y <= rect.y + rect.height) {
        return i;
      }
    }
    return -1;
  }
}

module.exports = { HUD, GAME_STATES, MenuSystem };
