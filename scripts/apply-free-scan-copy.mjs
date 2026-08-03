import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/pages/LandingPage.tsx', import.meta.url);
let source = await readFile(path, 'utf8');

const before = `          <p className="text-sm text-gray-400">
            Pentor only tests domains after authorization is confirmed by email verification. No testing occurs without your explicit approval.
          </p>`;

const after = `          <p className="text-sm text-gray-400">
            Free Scan starts immediately after you confirm ownership or explicit authorization and accept the responsible-use terms. Email verification remains reserved for Pro and Deep Scan.
          </p>`;

if (source.includes(after)) {
  console.log('[PENTOR] Free Scan landing copy already updated.');
} else if (source.includes(before)) {
  source = source.replace(before, after);
  await writeFile(path, source);
  console.log('[PENTOR] Free Scan landing copy updated.');
} else {
  throw new Error('[free scan copy] expected landing-page authorization text not found');
}
