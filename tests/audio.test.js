'use strict';

const { AudioManager, AUDIO_ASSETS } = require('../src/audio');

describe('AUDIO_ASSETS', () => {
  test('contains all expected audio keys', () => {
    const expectedKeys = [
      'bossMusic', 'gameOver', 'stageClear', 'bossLaser',
      'bossExplosion', 'bossWarning', 'hitBoss', 'impact',
      'jump', 'playerDeath', 'playerHurt', 'playerShoot',
      'strain', 'strain2'
    ];
    for (const key of expectedKeys) {
      expect(AUDIO_ASSETS).toHaveProperty(key);
    }
  });

  test('has 14 audio assets', () => {
    expect(Object.keys(AUDIO_ASSETS)).toHaveLength(14);
  });

  test('all values are file paths', () => {
    for (const val of Object.values(AUDIO_ASSETS)) {
      expect(typeof val).toBe('string');
      expect(val).toMatch(/\.(mp3|wav)$/);
    }
  });
});

describe('AudioManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AudioManager(null);
  });

  test('constructs with correct defaults', () => {
    expect(manager.musicVolume).toBe(0.7);
    expect(manager.sfxVolume).toBe(1.0);
    expect(manager.muted).toBe(false);
    expect(manager.getLoadedCount()).toBe(0);
  });

  test('getTotalAssets returns 14', () => {
    expect(manager.getTotalAssets()).toBe(14);
  });

  test('isLoaded returns false for unloaded sounds', () => {
    expect(manager.isLoaded('jump')).toBe(false);
  });

  test('playSfx returns null without audio context', () => {
    expect(manager.playSfx('jump')).toBeNull();
  });

  test('playMusic returns null without audio context', () => {
    expect(manager.playMusic('bossMusic')).toBeNull();
  });

  test('setMusicVolume clamps to 0-1 range', () => {
    manager.setMusicVolume(1.5);
    expect(manager.musicVolume).toBe(1);

    manager.setMusicVolume(-0.5);
    expect(manager.musicVolume).toBe(0);

    manager.setMusicVolume(0.5);
    expect(manager.musicVolume).toBe(0.5);
  });

  test('setSfxVolume clamps to 0-1 range', () => {
    manager.setSfxVolume(2);
    expect(manager.sfxVolume).toBe(1);

    manager.setSfxVolume(-1);
    expect(manager.sfxVolume).toBe(0);
  });

  test('toggleMute toggles state', () => {
    expect(manager.muted).toBe(false);
    const result1 = manager.toggleMute();
    expect(result1).toBe(true);
    expect(manager.muted).toBe(true);

    const result2 = manager.toggleMute();
    expect(result2).toBe(false);
    expect(manager.muted).toBe(false);
  });

  test('playSfx returns null when muted', () => {
    manager.muted = true;
    expect(manager.playSfx('jump')).toBeNull();
  });

  test('stopMusic handles no active music gracefully', () => {
    expect(() => manager.stopMusic()).not.toThrow();
  });

  test('loadSound returns false without context', () => {
    return manager.loadSound('test', 'test.wav').then(result => {
      expect(result).toBe(false);
    });
  });

  test('setMusicVolume updates active music gain', () => {
    const mockGainNode = { gain: { value: 0.7 } };
    manager.music = { source: {}, gainNode: mockGainNode };
    manager.setMusicVolume(0.3);
    expect(mockGainNode.gain.value).toBe(0.3);
  });

  test('stopMusic stops and clears active music', () => {
    const stopped = jest.fn();
    manager.music = {
      source: { stop: stopped },
      gainNode: { gain: { value: 0.7 } }
    };
    manager.stopMusic();
    expect(stopped).toHaveBeenCalled();
    expect(manager.music).toBeNull();
  });

  test('stopMusic handles already-stopped source', () => {
    manager.music = {
      source: { stop: () => { throw new Error('already stopped'); } },
      gainNode: { gain: { value: 0.7 } }
    };
    expect(() => manager.stopMusic()).not.toThrow();
    expect(manager.music).toBeNull();
  });

  test('toggleMute stops music when muting', () => {
    const stopped = jest.fn();
    manager.music = {
      source: { stop: stopped },
      gainNode: { gain: { value: 0.7 } }
    };
    manager.toggleMute();
    expect(stopped).toHaveBeenCalled();
  });
});
