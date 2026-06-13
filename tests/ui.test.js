'use strict';

const { HUD, GAME_STATES, MenuSystem } = require('../src/ui');

describe('GAME_STATES', () => {
  test('contains all expected states', () => {
    expect(GAME_STATES.TITLE).toBe('title');
    expect(GAME_STATES.CHARACTER_SELECT).toBe('character_select');
    expect(GAME_STATES.PLAYING).toBe('playing');
    expect(GAME_STATES.BOSS_WARNING).toBe('boss_warning');
    expect(GAME_STATES.BOSS_DEFEATED).toBe('boss_defeated');
    expect(GAME_STATES.GAME_OVER).toBe('game_over');
    expect(GAME_STATES.VICTORY).toBe('victory');
    expect(GAME_STATES.PAUSED).toBe('paused');
  });

  test('has 8 states', () => {
    expect(Object.keys(GAME_STATES)).toHaveLength(8);
  });
});

describe('HUD', () => {
  let hud;

  beforeEach(() => {
    hud = new HUD(800, 480);
  });

  test('constructs with correct dimensions', () => {
    expect(hud.canvasWidth).toBe(800);
    expect(hud.canvasHeight).toBe(480);
    expect(hud.visible).toBe(true);
  });

  test('getPlayerHealthBarRect returns valid rect', () => {
    const rect = hud.getPlayerHealthBarRect();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  test('getBossHealthBarRect is centered horizontally', () => {
    const rect = hud.getBossHealthBarRect();
    const center = rect.x + rect.width / 2;
    expect(center).toBeCloseTo(400, 0);
  });

  test('getScorePosition is on right side', () => {
    const pos = hud.getScorePosition();
    expect(pos.x).toBe(790);
  });

  test('getLivesPosition is below health bar', () => {
    const healthRect = hud.getPlayerHealthBarRect();
    const livesPos = hud.getLivesPosition();
    expect(livesPos.y).toBeGreaterThan(healthRect.y + healthRect.height);
  });

  test('getBossWarningRect is centered', () => {
    const rect = hud.getBossWarningRect();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    expect(centerX).toBeCloseTo(400, 0);
    expect(centerY).toBeCloseTo(240, 0);
  });

  test('formatScore pads to 8 digits', () => {
    expect(hud.formatScore(0)).toBe('00000000');
    expect(hud.formatScore(12345)).toBe('00012345');
    expect(hud.formatScore(99999999)).toBe('99999999');
  });

  test('formatLives returns formatted string', () => {
    expect(hud.formatLives(3)).toBe('LIVES: 3');
    expect(hud.formatLives(0)).toBe('LIVES: 0');
  });

  test('formatBossName returns warning string', () => {
    expect(hud.formatBossName('Big Core MK.I')).toBe('WARNING: BIG CORE MK.I APPROACHING!');
  });

  test('toggle flips visibility', () => {
    expect(hud.toggle()).toBe(false);
    expect(hud.visible).toBe(false);
    expect(hud.toggle()).toBe(true);
    expect(hud.visible).toBe(true);
  });
});

describe('MenuSystem', () => {
  let menu;

  beforeEach(() => {
    menu = new MenuSystem(800, 480);
    menu.setItems(['Start', 'Options', 'Quit']);
  });

  test('setItems resets selectedIndex to 0', () => {
    menu.selectedIndex = 2;
    menu.setItems(['A', 'B']);
    expect(menu.selectedIndex).toBe(0);
  });

  test('getSelected returns current item', () => {
    expect(menu.getSelected()).toBe('Start');
  });

  test('moveDown advances selection', () => {
    menu.moveDown();
    expect(menu.getSelected()).toBe('Options');
  });

  test('moveDown wraps around', () => {
    menu.moveDown();
    menu.moveDown();
    menu.moveDown();
    expect(menu.getSelected()).toBe('Start');
  });

  test('moveUp goes backwards', () => {
    menu.moveUp();
    expect(menu.getSelected()).toBe('Quit');
  });

  test('moveUp wraps around', () => {
    menu.moveUp();
    menu.moveUp();
    menu.moveUp();
    expect(menu.getSelected()).toBe('Start');
  });

  test('getItemRect returns valid rect for each item', () => {
    for (let i = 0; i < 3; i++) {
      const rect = menu.getItemRect(i);
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    }
  });

  test('getItemRect items are vertically ordered', () => {
    const rect0 = menu.getItemRect(0);
    const rect1 = menu.getItemRect(1);
    const rect2 = menu.getItemRect(2);
    expect(rect1.y).toBeGreaterThan(rect0.y);
    expect(rect2.y).toBeGreaterThan(rect1.y);
  });

  test('getItemAtPoint returns correct index', () => {
    const rect = menu.getItemRect(1);
    const idx = menu.getItemAtPoint(rect.x + 5, rect.y + 5);
    expect(idx).toBe(1);
  });

  test('getItemAtPoint returns -1 for miss', () => {
    expect(menu.getItemAtPoint(0, 0)).toBe(-1);
  });

  test('getSelected returns null for empty menu', () => {
    menu.setItems([]);
    expect(menu.getSelected()).toBeNull();
  });

  test('moveDown does nothing on empty menu', () => {
    menu.setItems([]);
    expect(() => menu.moveDown()).not.toThrow();
  });

  test('moveUp does nothing on empty menu', () => {
    menu.setItems([]);
    expect(() => menu.moveUp()).not.toThrow();
  });
});
