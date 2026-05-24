import { describe, expect, it } from 'vitest';
import { clampPanelPosition, defaultPanelPosition, hasDragMoved } from '../domain/panelPosition';

describe('panel position', () => {
  it('starts near the top-right corner inside the viewport', () => {
    expect(defaultPanelPosition({ width: 1280, height: 720 }, { width: 160, height: 44 })).toEqual({
      x: 1102,
      y: 14
    });
  });

  it('keeps a dragged panel inside the viewport', () => {
    expect(
      clampPanelPosition(
        { x: 1600, y: -40 },
        { width: 1280, height: 720 },
        { width: 760, height: 620 }
      )
    ).toEqual({
      x: 504,
      y: 14
    });
  });

  it('falls back to the default position when a saved position is not visible', () => {
    expect(
      clampPanelPosition(
        { x: 2000, y: 2000 },
        { width: 320, height: 640 },
        { width: 160, height: 44 }
      )
    ).toEqual({
      x: 144,
      y: 580
    });
  });

  it('distinguishes a click from a drag', () => {
    expect(hasDragMoved({ x: 10, y: 10 }, { x: 12, y: 13 })).toBe(false);
    expect(hasDragMoved({ x: 10, y: 10 }, { x: 20, y: 13 })).toBe(true);
  });
});
