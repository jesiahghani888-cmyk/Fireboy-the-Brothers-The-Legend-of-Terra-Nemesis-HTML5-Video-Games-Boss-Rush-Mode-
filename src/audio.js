'use strict';

const AUDIO_ASSETS = {
  bossMusic: '13 Last Evil [Boss Battle].mp3',
  gameOver: '21. Game Over.mp3',
  stageClear: '23. Stage Clear.mp3',
  bossLaser: 'BigCore_Laser.wav',
  bossExplosion: 'BossDefeat_Explosion.wav',
  bossWarning: 'BossWarning.wav',
  hitBoss: 'HitBoss.wav',
  impact: 'Impact2.wav',
  jump: 'Jump.wav',
  playerDeath: 'PlayerDeath.wav',
  playerHurt: 'PlayerHurt.wav',
  playerShoot: 'Player_FireShoot.wav',
  strain: 'Strain.wav',
  strain2: 'Strain2.wav'
};

class AudioManager {
  constructor(audioContext) {
    this.context = audioContext || null;
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.7;
    this.sfxVolume = 1.0;
    this.muted = false;
    this.loaded = new Set();
  }

  async loadSound(key, url) {
    if (!this.context) return false;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds[key] = audioBuffer;
      this.loaded.add(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  async loadAll(basePath) {
    const results = {};
    for (const [key, file] of Object.entries(AUDIO_ASSETS)) {
      const url = basePath ? `${basePath}/${file}` : file;
      results[key] = await this.loadSound(key, url);
    }
    return results;
  }

  playSfx(key) {
    if (this.muted || !this.context || !this.sounds[key]) return null;
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();
    source.buffer = this.sounds[key];
    gainNode.gain.value = this.sfxVolume;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
    return source;
  }

  playMusic(key) {
    this.stopMusic();
    if (this.muted || !this.context || !this.sounds[key]) return null;
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();
    source.buffer = this.sounds[key];
    source.loop = true;
    gainNode.gain.value = this.musicVolume;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
    this.music = { source, gainNode };
    return source;
  }

  stopMusic() {
    if (this.music) {
      try {
        this.music.source.stop();
      } catch (e) {
        // already stopped
      }
      this.music = null;
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.music) {
      this.music.gainNode.gain.value = this.musicVolume;
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    }
    return this.muted;
  }

  isLoaded(key) {
    return this.loaded.has(key);
  }

  getLoadedCount() {
    return this.loaded.size;
  }

  getTotalAssets() {
    return Object.keys(AUDIO_ASSETS).length;
  }
}

module.exports = { AudioManager, AUDIO_ASSETS };
