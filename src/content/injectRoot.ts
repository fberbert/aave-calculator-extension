export function getExtensionRoot(): ShadowRoot {
  const existing = document.getElementById('aave-calculator-extension-root');
  if (existing?.shadowRoot) {
    placeHostNearSettings(existing);
    return existing.shadowRoot;
  }

  const host = document.createElement('div');
  host.id = 'aave-calculator-extension-root';
  host.style.display = 'none';
  host.style.alignItems = 'center';
  host.style.height = '40px';
  host.style.verticalAlign = 'middle';
  placeHostNearSettings(host);
  watchSettingsButton(host);
  return host.attachShadow({ mode: 'open' });
}

function placeHostNearSettings(host: HTMLElement): void {
  const settingsButton = document.getElementById('settings-button');
  const settingsContainer = settingsButton?.parentElement;

  if (settingsButton && settingsContainer) {
    if (host.parentElement !== settingsContainer) {
      settingsContainer.insertBefore(host, settingsButton.nextSibling);
    }
    host.style.display = 'inline-flex';
    return;
  }

  if (!host.parentElement) {
    document.documentElement.appendChild(host);
  }
}

function watchSettingsButton(host: HTMLElement): void {
  const observer = new MutationObserver(() => {
    const previousParent = host.parentElement;
    placeHostNearSettings(host);

    if (host.parentElement && host.parentElement !== previousParent && host.parentElement !== document.documentElement) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
