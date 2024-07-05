const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const args = yargs(hideBin(process.argv))
    .command('eval <test-count>', 'calculate GHA shards', (yargs) => {
        yargs
            .option('min', { number: true, default: 0 })
            .option('max', { number: true, default: 10 })
            .option('ratio', { number: true, default: 100 })
            .positional('test-count', { alias: 'count', type: 'number', demandOption: true });
    })
    .parse();

const { count, min, max, ratio } = args;

const shardCount = Math.max(Math.min(Math.ceil(count / ratio), max), min);
const result = { shard: [] };
for (let i = 1; i <= shardCount; i++) {
    result.shard.push(i);
}

console.log(JSON.stringify(result));
