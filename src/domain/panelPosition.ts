export type PanelPosition = {
  x: number;
  y: number;
};

export type RectSize = {
  width: number;
  height: number;
};

const EDGE_GAP = 14;
const DRAG_THRESHOLD_PX = 6;

export function defaultPanelPosition(viewport: RectSize, panel: RectSize): PanelPosition {
  return clampPanelPosition(
    {
      x: viewport.width - panel.width - 18,
      y: EDGE_GAP
    },
    viewport,
    panel
  );
}

export function clampPanelPosition(
  position: PanelPosition,
  viewport: RectSize,
  panel: RectSize
): PanelPosition {
  return {
    x: clamp(position.x, EDGE_GAP, Math.max(EDGE_GAP, viewport.width - panel.width - 16)),
    y: clamp(position.y, EDGE_GAP, Math.max(EDGE_GAP, viewport.height - panel.height - 16))
  };
}

export function hasDragMoved(start: PanelPosition, current: PanelPosition): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > DRAG_THRESHOLD_PX;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
