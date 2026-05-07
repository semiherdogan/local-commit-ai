const { execFileSync } = require('node:child_process');

const tag = process.argv[2];

if (!tag) {
  throw new Error('Usage: npm run changelog:release -- v0.3.1');
}

const version = tag.replace(/^v/, '');

if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid release tag: ${tag}`);
}

execFileSync('git-cliff', ['--tag', tag, '--output', 'CHANGELOG.md'], {
  stdio: 'inherit'
});
