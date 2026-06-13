'use strict';

const { InputHandler } = require('../src/input');

describe('InputHandler', () => {
  let input;

  beforeEach(() => {
    input = new InputHandler();
  });

  test('initializes with all inputs false', () => {
    expect(input.isMovingLeft()).toBe(false);
    expect(input.isMovingRight()).toBe(false);
    expect(input.isJumping()).toBe(false);
    expect(input.isCrouching()).toBe(false);
    expect(input.isAttacking()).toBe(false);
  });

  test('updates dpad from arrow keys', () => {
    input.keys['ArrowLeft'] = true;
    input._updateFromKeys();
    expect(input.isMovingLeft()).toBe(true);
    expect(input.isMovingRight()).toBe(false);

    input.keys['ArrowLeft'] = false;
    input.keys['ArrowRight'] = true;
    input._updateFromKeys();
    expect(input.isMovingRight()).toBe(true);
    expect(input.isMovingLeft()).toBe(false);
  });

  test('updates dpad from WASD keys', () => {
    input.keys['KeyW'] = true;
    input._updateFromKeys();
    expect(input.dpad.up).toBe(true);

    input.keys['KeyS'] = true;
    input._updateFromKeys();
    expect(input.dpad.down).toBe(true);

    input.keys['KeyA'] = true;
    input._updateFromKeys();
    expect(input.dpad.left).toBe(true);

    input.keys['KeyD'] = true;
    input._updateFromKeys();
    expect(input.dpad.right).toBe(true);
  });

  test('jump activated by Space or KeyZ', () => {
    input.keys['Space'] = true;
    input._updateFromKeys();
    expect(input.isJumping()).toBe(true);

    input.keys['Space'] = false;
    input.keys['KeyZ'] = true;
    input._updateFromKeys();
    expect(input.isJumping()).toBe(true);
  });

  test('attack activated by KeyX or ShiftLeft', () => {
    input.keys['KeyX'] = true;
    input._updateFromKeys();
    expect(input.isAttacking()).toBe(true);

    input.keys['KeyX'] = false;
    input.keys['ShiftLeft'] = true;
    input._updateFromKeys();
    expect(input.isAttacking()).toBe(true);
  });

  test('crouching activated by ArrowDown', () => {
    input.keys['ArrowDown'] = true;
    input._updateFromKeys();
    expect(input.isCrouching()).toBe(true);
  });

  test('reset clears all inputs', () => {
    input.keys['ArrowLeft'] = true;
    input.keys['Space'] = true;
    input._updateFromKeys();
    expect(input.isMovingLeft()).toBe(true);

    input.reset();
    expect(input.isMovingLeft()).toBe(false);
    expect(input.isJumping()).toBe(false);
    expect(Object.keys(input.keys)).toHaveLength(0);
  });

  test('_inRect returns correct results', () => {
    const rect = { x: 10, y: 10, width: 100, height: 100 };
    expect(input._inRect(50, 50, rect)).toBe(true);
    expect(input._inRect(5, 50, rect)).toBe(false);
    expect(input._inRect(50, 5, rect)).toBe(false);
    expect(input._inRect(111, 50, rect)).toBe(false);
  });

  test('_resetTouchInputs clears dpad and buttons', () => {
    input.dpad.up = true;
    input.dpad.left = true;
    input.buttons.attack = true;
    input.buttons.jump = true;

    input._resetTouchInputs();
    expect(input.dpad.up).toBe(false);
    expect(input.dpad.left).toBe(false);
    expect(input.buttons.attack).toBe(false);
    expect(input.buttons.jump).toBe(false);
  });

  test('bindKeyboard registers event listeners', () => {
    const listeners = {};
    const target = {
      addEventListener: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      removeEventListener: jest.fn()
    };

    input.bindKeyboard(target);
    expect(target.addEventListener).toHaveBeenCalledTimes(2);

    listeners.keydown({ code: 'ArrowLeft' });
    expect(input.keys['ArrowLeft']).toBe(true);
    expect(input.isMovingLeft()).toBe(true);

    listeners.keyup({ code: 'ArrowLeft' });
    expect(input.keys['ArrowLeft']).toBe(false);
    expect(input.isMovingLeft()).toBe(false);
  });

  test('destroy removes all event listeners', () => {
    const target = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    input.bindKeyboard(target);
    input.destroy();
    expect(target.removeEventListener).toHaveBeenCalledTimes(2);
    expect(input._listeners).toHaveLength(0);
  });

  test('_updateFromTouch handles dpad regions', () => {
    const dpadRect = { x: 0, y: 0, width: 100, height: 100 };
    const attackRect = { x: 200, y: 0, width: 50, height: 50 };
    const jumpRect = { x: 300, y: 0, width: 50, height: 50 };

    // Touch left side of dpad
    input._updateFromTouch(
      { clientX: 10, clientY: 50 },
      dpadRect, attackRect, jumpRect, true
    );
    expect(input.dpad.left).toBe(true);
    expect(input.dpad.right).toBe(false);

    // Touch right side of dpad
    input._updateFromTouch(
      { clientX: 90, clientY: 50 },
      dpadRect, attackRect, jumpRect, true
    );
    expect(input.dpad.right).toBe(true);
  });

  test('_updateFromTouch handles attack button', () => {
    const dpadRect = { x: 0, y: 0, width: 100, height: 100 };
    const attackRect = { x: 200, y: 0, width: 50, height: 50 };
    const jumpRect = { x: 300, y: 0, width: 50, height: 50 };

    input._updateFromTouch(
      { clientX: 220, clientY: 20 },
      dpadRect, attackRect, jumpRect, true
    );
    expect(input.buttons.attack).toBe(true);
  });

  test('_updateFromTouch handles jump button', () => {
    const dpadRect = { x: 0, y: 0, width: 100, height: 100 };
    const attackRect = { x: 200, y: 0, width: 50, height: 50 };
    const jumpRect = { x: 300, y: 0, width: 50, height: 50 };

    input._updateFromTouch(
      { clientX: 320, clientY: 20 },
      dpadRect, attackRect, jumpRect, true
    );
    expect(input.buttons.jump).toBe(true);
  });

  test('touchend re-evaluates remaining touches (multitouch fix)', () => {
    const listeners = {};
    const target = {
      addEventListener: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      removeEventListener: jest.fn()
    };
    const dpadRect = { x: 0, y: 0, width: 100, height: 100 };
    const attackRect = { x: 200, y: 0, width: 50, height: 50 };
    const jumpRect = { x: 300, y: 0, width: 50, height: 50 };

    input.bindTouch(target, dpadRect, attackRect, jumpRect);

    // Simulate two fingers down: dpad-left (id=0) + jump (id=1)
    listeners.touchstart({
      changedTouches: [{ identifier: 0, clientX: 10, clientY: 50 }]
    });
    listeners.touchstart({
      changedTouches: [{ identifier: 1, clientX: 320, clientY: 20 }]
    });
    expect(input.dpad.left).toBe(true);
    expect(input.buttons.jump).toBe(true);

    // Lift only the jump finger (id=1)
    listeners.touchend({
      changedTouches: [{ identifier: 1, clientX: 320, clientY: 20 }]
    });

    // dpad-left should still be active from the remaining touch
    expect(input.dpad.left).toBe(true);
    expect(input.buttons.jump).toBe(false);
  });

  test('touchend clears all inputs when last finger lifts', () => {
    const listeners = {};
    const target = {
      addEventListener: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      removeEventListener: jest.fn()
    };
    const dpadRect = { x: 0, y: 0, width: 100, height: 100 };
    const attackRect = { x: 200, y: 0, width: 50, height: 50 };
    const jumpRect = { x: 300, y: 0, width: 50, height: 50 };

    input.bindTouch(target, dpadRect, attackRect, jumpRect);

    listeners.touchstart({
      changedTouches: [{ identifier: 0, clientX: 10, clientY: 50 }]
    });
    expect(input.dpad.left).toBe(true);

    listeners.touchend({
      changedTouches: [{ identifier: 0, clientX: 10, clientY: 50 }]
    });
    expect(input.dpad.left).toBe(false);
    expect(input.dpad.right).toBe(false);
    expect(input.buttons.attack).toBe(false);
    expect(input.buttons.jump).toBe(false);
  });
});
