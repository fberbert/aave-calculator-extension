import { cp, copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('manifest.json', 'dist/manifest.json');

await mkdir('assets', { recursive: true });
await mkdir('icons', { recursive: true });
await cp('dist/assets', 'assets', { recursive: true });
await cp('dist/icons', 'icons', { recursive: true });
