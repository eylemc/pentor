import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/services/api.ts';
const source = await readFile(path, 'utf8');
const before = "const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://95-179-169-114.sslip.io').replace(/\\\/$/, '');";
const after = "const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\\\/$/, '');";

let next = source;
if (!next.includes(after)) {
  if (!next.includes(before)) throw new Error('[PENTOR] Relative API base: expected source line not found');
  next = next.replace(before, after);
  await writeFile(path, next);
  console.log('[PENTOR] Relative API base applied.');
} else {
  console.log('[PENTOR] Relative API base already applied.');
}

if (!next.includes("const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace")) {
  throw new Error('[PENTOR] Relative API base verification failed');
}
