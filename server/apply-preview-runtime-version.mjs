import { readFile, writeFile } from 'node:fs/promises';

const path = './index.mjs';
let source = await readFile(path, 'utf8');

if (!source.includes('function lockedPreviewForFinding(item)')) {
  throw new Error('[PENTOR] Provider-specific locked preview helper is missing from runtime source.');
}

const mapperHasProviderPreview =
  source.includes('...lockedPreviewForFinding(item)') ||
  (
    source.includes("previewTitle: isAi ? String(item.title || preview.previewTitle)") &&
    source.includes("previewText: isAi ? String(item.impact || preview.previewText)")
  );

if (!mapperHasProviderPreview) {
  throw new Error('[PENTOR] Locked preview mapper is not attaching provider-specific preview data.');
}

source = source.replace(
  /const reportCacheVersion = '[^']+';/,
  "const reportCacheVersion = 'reports-v16-direct-ai-preview-copy';",
);
source = source.replace(
  /mode: 'safe-scan-v3-ai-provider-previews'(?:, previewVersion: '[^']+')?/,
  "mode: 'safe-scan-v3-ai-provider-previews', previewVersion: 'direct-provider-copy-v2'",
);
source = source.replace(
  "mode: 'safe-scan-v2-data-security'",
  "mode: 'safe-scan-v3-ai-provider-previews', previewVersion: 'direct-provider-copy-v2'",
);

if (!source.includes("reports-v16-direct-ai-preview-copy")) {
  throw new Error('[PENTOR] Report cache version bump failed.');
}
if (!source.includes("previewVersion: 'direct-provider-copy-v2'")) {
  throw new Error('[PENTOR] Runtime preview version marker failed.');
}

await writeFile(path, source);
console.log('[PENTOR] Direct provider preview runtime verified; report cache bumped to v16.');
