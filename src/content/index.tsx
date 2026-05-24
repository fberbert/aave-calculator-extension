import React from 'react';
import { createRoot } from 'react-dom/client';
import { AaveCalculator } from '../ui/AaveCalculator';
import styles from '../styles/extension.css?inline';
import { getExtensionRoot } from './injectRoot';

const shadowRoot = getExtensionRoot();
const style = document.createElement('style');
style.textContent = styles;
shadowRoot.appendChild(style);

const appRoot = document.createElement('div');
appRoot.id = 'aave-calculator-app';
shadowRoot.appendChild(appRoot);

createRoot(appRoot).render(
  <React.StrictMode>
    <AaveCalculator />
  </React.StrictMode>
);
