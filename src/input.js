'use strict';

class InputHandler {
  constructor() {
    this.keys = {};
    this.touches = {};
    this.dpad = { up: false, down: false, left: false, right: false };
    this.buttons = { attack: false, jump: false };
    this._listeners = [];
  }

  bindKeyboard(target) {
    const onKeyDown = (e) => {
      this.keys[e.code] = true;
      this._updateFromKeys();
    };
    const onKeyUp = (e) => {
      this.keys[e.code] = false;
      this._updateFromKeys();
    };
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    this._listeners.push(
      { target, event: 'keydown', handler: onKeyDown },
      { target, event: 'keyup', handler: onKeyUp }
    );
  }

  bindTouch(target, dpadRect, attackBtnRect, jumpBtnRect) {
    const onTouchStart = (e) => {
      for (const touch of e.changedTouches) {
        this.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
        this._updateFromTouch(touch, dpadRect, attackBtnRect, jumpBtnRect, true);
      }
    };
    const onTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        delete this.touches[touch.identifier];
      }
      this._resetTouchInputs();
    };
    const onTouchMove = (e) => {
      for (const touch of e.changedTouches) {
        this.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
        this._updateFromTouch(touch, dpadRect, attackBtnRect, jumpBtnRect, true);
      }
    };
    target.addEventListener('touchstart', onTouchStart);
    target.addEventListener('touchend', onTouchEnd);
    target.addEventListener('touchmove', onTouchMove);
    this._listeners.push(
      { target, event: 'touchstart', handler: onTouchStart },
      { target, event: 'touchend', handler: onTouchEnd },
      { target, event: 'touchmove', handler: onTouchMove }
    );
  }

  _updateFromKeys() {
    this.dpad.up = !!(this.keys['ArrowUp'] || this.keys['KeyW']);
    this.dpad.down = !!(this.keys['ArrowDown'] || this.keys['KeyS']);
    this.dpad.left = !!(this.keys['ArrowLeft'] || this.keys['KeyA']);
    this.dpad.right = !!(this.keys['ArrowRight'] || this.keys['KeyD']);
    this.buttons.jump = !!(this.keys['Space'] || this.keys['KeyZ']);
    this.buttons.attack = !!(this.keys['KeyX'] || this.keys['ShiftLeft']);
  }

  _updateFromTouch(touch, dpadRect, attackBtnRect, jumpBtnRect, pressed) {
    const x = touch.clientX;
    const y = touch.clientY;
    if (this._inRect(x, y, dpadRect)) {
      const cx = dpadRect.x + dpadRect.width / 2;
      const cy = dpadRect.y + dpadRect.height / 2;
      this.dpad.left = pressed && x < cx - dpadRect.width * 0.15;
      this.dpad.right = pressed && x > cx + dpadRect.width * 0.15;
      this.dpad.up = pressed && y < cy - dpadRect.height * 0.15;
      this.dpad.down = pressed && y > cy + dpadRect.height * 0.15;
    }
    if (this._inRect(x, y, attackBtnRect)) {
      this.buttons.attack = pressed;
    }
    if (this._inRect(x, y, jumpBtnRect)) {
      this.buttons.jump = pressed;
    }
  }

  _inRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  _resetTouchInputs() {
    this.dpad.up = false;
    this.dpad.down = false;
    this.dpad.left = false;
    this.dpad.right = false;
    this.buttons.attack = false;
    this.buttons.jump = false;
  }

  isMovingLeft() { return this.dpad.left; }
  isMovingRight() { return this.dpad.right; }
  isJumping() { return this.dpad.up || this.buttons.jump; }
  isCrouching() { return this.dpad.down; }
  isAttacking() { return this.buttons.attack; }

  reset() {
    this.keys = {};
    this.touches = {};
    this._resetTouchInputs();
  }

  destroy() {
    for (const { target, event, handler } of this._listeners) {
      target.removeEventListener(event, handler);
    }
    this._listeners = [];
    this.reset();
  }
}

module.exports = { InputHandler };
