'use strict';

const { GAME_STATES } = require('./ui');
const { BOSS_ORDER } = require('./bosses');

class GameEngine {
  constructor(config) {
    this.canvasWidth = config.canvasWidth || 800;
    this.canvasHeight = config.canvasHeight || 480;
    this.state = GAME_STATES.TITLE;
    this.previousState = null;
    this.currentBossIndex = 0;
    this.bossOrder = [...BOSS_ORDER];
    this.player = null;
    this.boss = null;
    this.running = false;
    this.paused = false;
    this.elapsedTime = 0;
    this.stateTimer = 0;
    this.warningDuration = 3.0;
    this.defeatCelebrationDuration = 2.0;
    this.fps = 0;
    this._frameCount = 0;
    this._fpsTimer = 0;
    this.onStateChange = null;
  }

  setState(newState) {
    this.previousState = this.state;
    this.state = newState;
    this.stateTimer = 0;
    if (this.onStateChange) {
      this.onStateChange(newState, this.previousState);
    }
  }

  start() {
    this.running = true;
    this.setState(GAME_STATES.TITLE);
  }

  stop() {
    this.running = false;
  }

  pause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.paused = true;
      this.setState(GAME_STATES.PAUSED);
    }
  }

  resume() {
    if (this.state === GAME_STATES.PAUSED) {
      this.paused = false;
      this.setState(GAME_STATES.PLAYING);
    }
  }

  selectCharacter(characterId) {
    this.setState(GAME_STATES.PLAYING);
    return characterId;
  }

  startBossEncounter() {
    this.setState(GAME_STATES.BOSS_WARNING);
    return this.getCurrentBossId();
  }

  getCurrentBossId() {
    if (this.currentBossIndex >= this.bossOrder.length) return null;
    return this.bossOrder[this.currentBossIndex];
  }

  advanceBoss() {
    this.currentBossIndex += 1;
    if (this.currentBossIndex >= this.bossOrder.length) {
      this.setState(GAME_STATES.VICTORY);
      return null;
    }
    return this.getCurrentBossId();
  }

  onBossDefeated() {
    this.setState(GAME_STATES.BOSS_DEFEATED);
  }

  onPlayerDefeated() {
    this.setState(GAME_STATES.GAME_OVER);
  }

  update(dt) {
    if (!this.running) return;
    this.elapsedTime += dt;
    this.stateTimer += dt;

    this._frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 1.0) {
      this.fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTimer -= 1.0;
    }

    switch (this.state) {
      case GAME_STATES.BOSS_WARNING:
        if (this.stateTimer >= this.warningDuration) {
          this.setState(GAME_STATES.PLAYING);
        }
        break;
      case GAME_STATES.BOSS_DEFEATED:
        if (this.stateTimer >= this.defeatCelebrationDuration) {
          this.advanceBoss();
          if (this.state !== GAME_STATES.VICTORY) {
            this.startBossEncounter();
          }
        }
        break;
    }
  }

  restart() {
    this.currentBossIndex = 0;
    this.elapsedTime = 0;
    this.stateTimer = 0;
    this.paused = false;
    this.setState(GAME_STATES.TITLE);
  }

  isPlaying() {
    return this.state === GAME_STATES.PLAYING && !this.paused;
  }

  isGameOver() {
    return this.state === GAME_STATES.GAME_OVER;
  }

  isVictory() {
    return this.state === GAME_STATES.VICTORY;
  }

  getTotalBosses() {
    return this.bossOrder.length;
  }

  getBossesDefeated() {
    return this.currentBossIndex;
  }

  getProgress() {
    return this.currentBossIndex / this.bossOrder.length;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

module.exports = { GameEngine };
