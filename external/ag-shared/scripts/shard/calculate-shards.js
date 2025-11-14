// Parse command line arguments without external dependencies
const args = process.argv.slice(2);

// Validate command is present
if (args.length === 0 || args[0] !== 'eval') {
    console.error('Error: command "eval" is required');
    process.exit(1);
}

// Default values
let min = 0;
let max = 10;
let ratio = 100;
let zero = false;
let count = null;

// Parse arguments (skip the 'eval' command)
let i = 1;
while (i < args.length) {
    const arg = args[i];

    if (arg === '--min') {
        i++;
        if (i < args.length) {
            min = parseInt(args[i], 10);
            if (isNaN(min)) {
                console.error(`Error: --min must be a number, got: ${args[i]}`);
                process.exit(1);
            }
        }
    } else if (arg === '--max') {
        i++;
        if (i < args.length) {
            max = parseInt(args[i], 10);
            if (isNaN(max)) {
                console.error(`Error: --max must be a number, got: ${args[i]}`);
                process.exit(1);
            }
        }
    } else if (arg === '--ratio') {
        i++;
        if (i < args.length) {
            ratio = parseInt(args[i], 10);
            if (isNaN(ratio)) {
                console.error(`Error: --ratio must be a number, got: ${args[i]}`);
                process.exit(1);
            }
        }
    } else if (arg === '--zero') {
        zero = true;
    } else if (!arg.startsWith('--') && count === null) {
        // Positional argument (test-count) if not already set
        count = parseInt(arg, 10);
        if (isNaN(count)) {
            console.error(`Error: test-count must be a number, got: ${arg}`);
            process.exit(1);
        }
    }

    i++;
}

// Validate required arguments
if (count === null) {
    console.error('Error: test-count is required');
    process.exit(1);
}

const shardCount = Math.max(Math.min(Math.ceil(count / ratio), max), min);
const result = { shard: [] };
if (zero && shardCount > 0) {
    result.shard.push(0);
}
for (let i = 1; i <= shardCount; i++) {
    result.shard.push(i);
}

console.log(JSON.stringify(result));
