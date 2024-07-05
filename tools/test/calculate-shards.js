const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const args = yargs(hideBin(process.argv))
    .command('eval <test-count>', 'calculate GHA shards', (yargs) => {
        yargs
            .option('min', { number: true, default: 1 })
            .option('max', { number: true, default: 10 })
            .option('ratio', { number: true, default: 100 })
            .positional('test-count', { alias: 'count', type: 'number', demandOption: true });
    })
    .parse();

console.log({ count, min, max, ratio });

const shardCount = Math.max(Math.min(Math.floor(count / ratio), max), min);
const result = { shards: [] };
for (let i = 1; i <= shardCount; i++) {
    result.shards.push(i);
}

console.log(JSON.stringify(result));
