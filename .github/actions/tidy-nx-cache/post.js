const { spawnSync } = require('child_process');

spawnSync(`./tools/tidy-nx-cache.sh`);

console.log('Cleaned .nx/cache.');
