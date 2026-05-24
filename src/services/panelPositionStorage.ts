import type { PanelPosition } from '../domain/panelPosition';

const STORAGE_KEY = 'aaveCalculatorPosition';

type ChromeStorageShape = {
  storage?: {
    local?: {
      get: (keys: string[]) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
    };
  };
};

export async function loadSavedPanelPosition(): Promise<PanelPosition | null> {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) return null;

  const result = await chromeStorage.get([STORAGE_KEY]);
  const value = result[STORAGE_KEY];
  if (!isPanelPosition(value)) return null;

  return value;
}

export async function savePanelPosition(position: PanelPosition): Promise<void> {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) return;

  await chromeStorage.set({ [STORAGE_KEY]: position });
}

function getChromeStorage() {
  const maybeChrome = globalThis.chrome as ChromeStorageShape | undefined;
  return maybeChrome?.storage?.local ?? null;
}

function isPanelPosition(value: unknown): value is PanelPosition {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PanelPosition>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}
