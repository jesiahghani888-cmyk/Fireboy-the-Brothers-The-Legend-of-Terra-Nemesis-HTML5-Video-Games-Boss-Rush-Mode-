'use strict';

const { GameEngine } = require('../src/engine');
const { GAME_STATES } = require('../src/ui');
const { BOSS_ORDER } = require('../src/bosses');

describe('GameEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine({ canvasWidth: 800, canvasHeight: 480 });
  });

  test('constructs with correct defaults', () => {
    expect(engine.canvasWidth).toBe(800);
    expect(engine.canvasHeight).toBe(480);
    expect(engine.state).toBe(GAME_STATES.TITLE);
    expect(engine.currentBossIndex).toBe(0);
    expect(engine.running).toBe(false);
    expect(engine.paused).toBe(false);
  });

  test('constructs with custom config', () => {
    const e = new GameEngine({ canvasWidth: 1024, canvasHeight: 768 });
    expect(e.canvasWidth).toBe(1024);
    expect(e.canvasHeight).toBe(768);
  });

  test('constructs with default config values', () => {
    const e = new GameEngine({});
    expect(e.canvasWidth).toBe(800);
    expect(e.canvasHeight).toBe(480);
  });

  test('start sets running and title state', () => {
    engine.start();
    expect(engine.running).toBe(true);
    expect(engine.state).toBe(GAME_STATES.TITLE);
  });

  test('stop sets running to false', () => {
    engine.start();
    engine.stop();
    expect(engine.running).toBe(false);
  });

  test('setState updates state and previousState', () => {
    engine.setState(GAME_STATES.PLAYING);
    expect(engine.state).toBe(GAME_STATES.PLAYING);
    expect(engine.previousState).toBe(GAME_STATES.TITLE);
  });

  test('setState resets stateTimer', () => {
    engine.stateTimer = 5;
    engine.setState(GAME_STATES.PLAYING);
    expect(engine.stateTimer).toBe(0);
  });

  test('setState calls onStateChange callback', () => {
    const callback = jest.fn();
    engine.onStateChange = callback;
    engine.setState(GAME_STATES.PLAYING);
    expect(callback).toHaveBeenCalledWith(GAME_STATES.PLAYING, GAME_STATES.TITLE);
  });

  test('pause works from PLAYING state', () => {
    engine.setState(GAME_STATES.PLAYING);
    engine.pause();
    expect(engine.state).toBe(GAME_STATES.PAUSED);
    expect(engine.paused).toBe(true);
  });

  test('pause does nothing from non-PLAYING state', () => {
    engine.setState(GAME_STATES.TITLE);
    engine.pause();
    expect(engine.state).toBe(GAME_STATES.TITLE);
  });

  test('resume works from PAUSED state', () => {
    engine.setState(GAME_STATES.PLAYING);
    engine.pause();
    engine.resume();
    expect(engine.state).toBe(GAME_STATES.PLAYING);
    expect(engine.paused).toBe(false);
  });

  test('resume does nothing from non-PAUSED state', () => {
    engine.setState(GAME_STATES.TITLE);
    engine.resume();
    expect(engine.state).toBe(GAME_STATES.TITLE);
  });

  test('selectCharacter transitions to PLAYING', () => {
    const result = engine.selectCharacter('fireboy');
    expect(engine.state).toBe(GAME_STATES.PLAYING);
    expect(result).toBe('fireboy');
  });

  test('startBossEncounter transitions to BOSS_WARNING', () => {
    const bossId = engine.startBossEncounter();
    expect(engine.state).toBe(GAME_STATES.BOSS_WARNING);
    expect(bossId).toBe(BOSS_ORDER[0]);
  });

  test('getCurrentBossId returns correct boss', () => {
    expect(engine.getCurrentBossId()).toBe('bigCore');
    engine.currentBossIndex = 3;
    expect(engine.getCurrentBossId()).toBe('mandler');
  });

  test('getCurrentBossId returns null when all defeated', () => {
    engine.currentBossIndex = BOSS_ORDER.length;
    expect(engine.getCurrentBossId()).toBeNull();
  });

  test('advanceBoss moves to next boss', () => {
    const nextId = engine.advanceBoss();
    expect(engine.currentBossIndex).toBe(1);
    expect(nextId).toBe(BOSS_ORDER[1]);
  });

  test('advanceBoss transitions to VICTORY after last boss', () => {
    engine.currentBossIndex = BOSS_ORDER.length - 1;
    const result = engine.advanceBoss();
    expect(engine.state).toBe(GAME_STATES.VICTORY);
    expect(result).toBeNull();
  });

  test('onBossDefeated transitions to BOSS_DEFEATED', () => {
    engine.onBossDefeated();
    expect(engine.state).toBe(GAME_STATES.BOSS_DEFEATED);
  });

  test('onPlayerDefeated transitions to GAME_OVER', () => {
    engine.onPlayerDefeated();
    expect(engine.state).toBe(GAME_STATES.GAME_OVER);
  });

  test('update increments elapsed time', () => {
    engine.start();
    engine.update(0.5);
    expect(engine.elapsedTime).toBeCloseTo(0.5, 5);
  });

  test('update does nothing when not running', () => {
    engine.update(0.5);
    expect(engine.elapsedTime).toBe(0);
  });

  test('update transitions BOSS_WARNING to PLAYING after duration', () => {
    engine.start();
    engine.setState(GAME_STATES.BOSS_WARNING);
    engine.update(engine.warningDuration + 0.1);
    expect(engine.state).toBe(GAME_STATES.PLAYING);
  });

  test('BOSS_WARNING stays during warning duration', () => {
    engine.start();
    engine.setState(GAME_STATES.BOSS_WARNING);
    engine.update(1.0);
    expect(engine.state).toBe(GAME_STATES.BOSS_WARNING);
  });

  test('BOSS_DEFEATED auto-advances after celebration', () => {
    engine.start();
    engine.setState(GAME_STATES.BOSS_DEFEATED);
    engine.update(engine.defeatCelebrationDuration + 0.1);
    // Should advance boss and go to BOSS_WARNING for next boss
    expect(engine.currentBossIndex).toBe(1);
    expect(engine.state).toBe(GAME_STATES.BOSS_WARNING);
  });

  test('FPS counter updates after 1 second', () => {
    engine.start();
    // Simulate ~60fps for 1 second
    for (let i = 0; i < 60; i++) {
      engine.update(1 / 60);
    }
    expect(engine.fps).toBe(60);
  });

  test('restart resets all state', () => {
    engine.start();
    engine.currentBossIndex = 5;
    engine.elapsedTime = 100;
    engine.paused = true;

    engine.restart();
    expect(engine.currentBossIndex).toBe(0);
    expect(engine.elapsedTime).toBe(0);
    expect(engine.paused).toBe(false);
    expect(engine.state).toBe(GAME_STATES.TITLE);
  });

  test('isPlaying returns true only during active gameplay', () => {
    expect(engine.isPlaying()).toBe(false);
    engine.setState(GAME_STATES.PLAYING);
    expect(engine.isPlaying()).toBe(true);
    engine.paused = true;
    expect(engine.isPlaying()).toBe(false);
  });

  test('isGameOver works correctly', () => {
    expect(engine.isGameOver()).toBe(false);
    engine.setState(GAME_STATES.GAME_OVER);
    expect(engine.isGameOver()).toBe(true);
  });

  test('isVictory works correctly', () => {
    expect(engine.isVictory()).toBe(false);
    engine.setState(GAME_STATES.VICTORY);
    expect(engine.isVictory()).toBe(true);
  });

  test('getTotalBosses returns 7', () => {
    expect(engine.getTotalBosses()).toBe(7);
  });

  test('getBossesDefeated returns current index', () => {
    expect(engine.getBossesDefeated()).toBe(0);
    engine.currentBossIndex = 3;
    expect(engine.getBossesDefeated()).toBe(3);
  });

  test('getProgress returns fraction', () => {
    expect(engine.getProgress()).toBe(0);
    engine.currentBossIndex = 3;
    expect(engine.getProgress()).toBeCloseTo(3 / 7, 5);
    engine.currentBossIndex = 7;
    expect(engine.getProgress()).toBe(1);
  });

  test('formatTime formats minutes and seconds', () => {
    expect(engine.formatTime(0)).toBe('00:00');
    expect(engine.formatTime(65)).toBe('01:05');
    expect(engine.formatTime(3661)).toBe('61:01');
  });
});
