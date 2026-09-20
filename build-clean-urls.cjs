// Render build: keep HTML behind explicit clean-URL rewrites so legacy URLs
// can return HTTP 301 (Render bypasses rules when a source file exists).
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const out = path.join(root, 'dist');
const files = [];
function walk(dir = '') {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['dist', 'node_modules'].includes(entry.name)) continue;
    const name = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(name);
    else if (name !== 'build-clean-urls.cjs') files.push(name);
  }
}
walk();
const pages = new Set(files.filter(file => file.endsWith('.html')));
const origin = 'https://www.tssolutionsllp.com';
const hosts = new Set(['www.tssolutionsllp.com', 'tssolutionsllp.com', 'twinstance-website.onrender.com']);
function clean(text, file) {
  const base = origin + '/' + (file.endsWith('.js') ? 'index.html' : file);
  return text.replace(/[A-Za-z0-9_:/.-]+\.html\b/g, value => {
    let url;
    try { url = new URL(value, base); } catch { return value; }
    if (!hosts.has(url.hostname) || !pages.has(url.pathname.slice(1))) return value;
    return value.endsWith('index.html') ? (value.slice(0, -10) || './') : value.slice(0, -5);
  });
}
// Render starts with a fresh checkout; never delete anything outside this output.
if (fs.existsSync(out)) throw new Error('dist already exists; use a fresh build directory');
for (const file of files) {
  const target = path.join(out, pages.has(file) ? '_pages/' + file : file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (/\.(html|js|xml)$/.test(file)) fs.writeFileSync(target, clean(fs.readFileSync(path.join(root, file), 'utf8'), file));
  else fs.copyFileSync(path.join(root, file), target);
  // First rollout can retain legacy files until dashboard rules are installed.
  if (pages.has(file) && process.argv.includes('--compat')) {
    const legacy = path.join(out, file);
    fs.mkdirSync(path.dirname(legacy), { recursive: true });
    fs.copyFileSync(target, legacy);
  }
}
console.log(`Built ${pages.size} clean-URL pages and preserved assets.`);

