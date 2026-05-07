const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const packagePath = path.join(__dirname, '..', 'package.json');
const original = fs.readFileSync(packagePath, 'utf8');
const pkg = JSON.parse(original);
const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
  cwd: path.dirname(packagePath),
  encoding: 'utf8'
}).trim();
const version = tag.replace(/^v\.?/, '');

if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid release tag: ${tag}`);
}

pkg.name = 'local-commit-ai-cli';
pkg.displayName = 'Local Commit AI CLI';
pkg.version = version;

try {
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  execFileSync('npm', ['run', 'package'], { cwd: path.dirname(packagePath), stdio: 'inherit' });
} finally {
  fs.writeFileSync(packagePath, original);
}
