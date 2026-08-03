import { readFile, writeFile } from 'node:fs/promises';

const path = './index.mjs';
let source = await readFile(path, 'utf8');

if (!source.includes('function lockedPreviewForFinding(item)')) {
  throw new Error('[PENTOR] Provider-specific locked preview helper is missing from runtime source.');
}
if (!source.includes('...lockedPreviewForFinding(item)')) {
  throw new Error('[PENTOR] Locked preview mapper is not attaching provider-specific preview data.');
}

source = source.replace(
  /const reportCacheVersion = '[^']+';/,
  "const reportCacheVersion = 'reports-v15-provider-specific-ai-previews';",
);
source = source.replace(
  "mode: 'safe-scan-v2-data-security'",
  "mode: 'safe-scan-v3-ai-provider-previews', previewVersion: 'provider-specific-v1'",
);

if (!source.includes("reports-v15-provider-specific-ai-previews")) {
  throw new Error('[PENTOR] Report cache version bump failed.');
}
if (!source.includes("previewVersion: 'provider-specific-v1'")) {
  throw new Error('[PENTOR] Runtime preview version marker failed.');
}

await writeFile(path, source);
console.log('[PENTOR] Provider-specific preview runtime verified; report cache bumped to v15.');
