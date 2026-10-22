const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    discoverExamples,
    loadCosts,
    parseExamplesArg,
    planShards,
    resolveExamples,
    shardExamples,
} = require('./benchmark-examples');

const SCRIPT = path.join(__dirname, 'benchmark-examples.js');

test('parseExamplesArg splits on commas and/or whitespace and drops empties', () => {
    assert.deepEqual(parseExamplesArg('a,b'), ['a', 'b']);
    assert.deepEqual(parseExamplesArg('a b'), ['a', 'b']);
    assert.deepEqual(parseExamplesArg('  a , b ,, c '), ['a', 'b', 'c']);
    assert.deepEqual(parseExamplesArg(''), []);
    // Defaulting to '' keeps the full-run path safe when no value is supplied.
    assert.deepEqual(parseExamplesArg(), []);
    assert.deepEqual(parseExamplesArg(undefined), []);
});

test('resolveExamples with no request returns every runnable example', () => {
    assert.deepEqual(resolveExamples([]), discoverExamples());
});

test('resolveExamples narrows to the requested names in discovery order', () => {
    const all = discoverExamples();
    assert.ok(all.length >= 2, 'expected at least two runnable examples to exercise narrowing');
    const [first, second] = all;
    // Request out of order to prove the result is re-sorted into discovery order.
    assert.deepEqual(resolveExamples([second, first]), [first, second]);
});

test('resolveExamples rejects unknown example names', () => {
    assert.throws(() => resolveExamples(['__definitely-not-an-example__']), /Unknown benchmark example/);
});

test('shardExamples narrows the input set before sharding', () => {
    const [first] = discoverExamples();
    assert.deepEqual(shardExamples(5, [first]), [[first]]);
});

// --- Cost-weighted shard assignment ---

/** Total cost of each shard under `costs`, with `fallback` for names the table doesn't list. */
const loads = (shards, costs, fallback = 1) =>
    shards.map((shard) => shard.reduce((sum, name) => sum + (costs[name] ?? fallback), 0));

/** The old assignment: deal the sorted names round-robin. */
const roundRobin = (names, count) => {
    const shards = Array.from({ length: count }, () => []);
    names.forEach((name, i) => shards[i % count].push(name));
    return shards;
};

test('shardExamples places every runnable example in exactly one shard', () => {
    for (const count of [1, 3, 5, 6, 9]) {
        const placed = shardExamples(count).flat();
        assert.equal(new Set(placed).size, placed.length, `an example was repeated at ${count} shards`);
        assert.deepEqual([...placed].sort(), discoverExamples());
    }
});

test('shardExamples balances by cost: the heaviest examples land on different shards', () => {
    const [a, b, c, d] = discoverExamples();
    const costs = { [a]: 100, [b]: 100, [c]: 1, [d]: 1 };
    const shards = shardExamples(2, [a, b, c, d], costs);
    assert.equal(shards.length, 2);
    assert.ok(
        shards.every((shard) => shard.some((name) => name === a || name === b)),
        'a heavy example per shard'
    );
});

test('shardExamples packs longest-first onto the least-loaded shard', () => {
    const [a, b, c, d, e] = discoverExamples();
    // LPT: 7 -> s0, 6 -> s1, 5 -> s1 (6 < 7), 4 -> s0 (7 < 11), 3 -> s0 (11 vs 11 ties to the first shard).
    const costs = { [a]: 7, [b]: 6, [c]: 5, [d]: 4, [e]: 3 };
    const plan = planShards(2, [a, b, c, d, e], costs);
    assert.deepEqual(
        plan.map(({ examples }) => examples),
        [
            [a, d, e],
            [b, c],
        ]
    );
    assert.deepEqual(
        plan.map(({ load }) => load),
        [14, 11]
    );
});

test('shardExamples beats round-robin when the costs are skewed', () => {
    const names = discoverExamples();
    // Every shard-count-th name is heavy, which is the worst case for dealing names round-robin.
    const count = 4;
    const costs = Object.fromEntries(names.map((name, i) => [name, i % count === 0 ? 1000 : 10]));
    const weighted = Math.max(...loads(shardExamples(count, [], costs), costs));
    const dealt = Math.max(...loads(roundRobin(names, count), costs));
    assert.ok(weighted < dealt, `weighted max ${weighted} should beat round-robin max ${dealt}`);
});

test('shardExamples keeps each shard in discovery order', () => {
    const costs = loadCosts();
    for (const shard of shardExamples(5, [], costs)) {
        assert.deepEqual(shard, [...shard].sort());
    }
});

test('shardExamples is deterministic for the same names and costs, whatever the request order', () => {
    const [a, b, c, d] = discoverExamples();
    const costs = { [a]: 5, [b]: 5, [c]: 5, [d]: 5 };
    const first = shardExamples(2, [a, b, c, d], costs);
    assert.deepEqual(shardExamples(2, [a, b, c, d], costs), first);
    assert.deepEqual(shardExamples(2, [d, c, b, a], costs), first);
    // Equal costs tie-break on name then shard index rather than on insertion order.
    assert.deepEqual(first, [
        [a, c],
        [b, d],
    ]);
});

test('an example missing from the cost table costs the median instead of failing', () => {
    const [a, b, c, d, e] = discoverExamples();
    // Median of {10, 30, 50} is 30, so the three unlisted examples each count 30.
    const costs = { [a]: 10, [b]: 30, [c]: 50 };
    const plan = planShards(2, [a, b, c, d, e], costs);
    assert.deepEqual([...plan.flatMap(({ examples }) => examples)].sort(), [a, b, c, d, e]);
    assert.equal(
        plan.reduce((sum, { load }) => sum + load, 0),
        10 + 30 + 50 + 30 + 30
    );
});

test('a new example is never free: it is placed by the median, not as zero cost', () => {
    const [a, b, c, d] = discoverExamples();
    // d is unlisted. At the median (100) it must not share a shard with a 100-cost example while
    // a 1-cost shard is available; at zero cost it would be placed last and lighten nothing.
    const costs = { [a]: 100, [b]: 100, [c]: 100 };
    const plan = planShards(3, [a, b, c, d], costs);
    const loadOf = (name) => plan.find(({ examples }) => examples.includes(name)).load;
    assert.equal(loadOf(d), 200);
});

test('an empty cost table still shards, with every example at the same default cost', () => {
    const [a, b, c, d] = discoverExamples();
    const shards = shardExamples(2, [a, b, c, d], {});
    assert.deepEqual(
        shards.map((shard) => shard.length),
        [2, 2]
    );
});

test('shardExamples drops shards left empty when there are fewer examples than shards', () => {
    const [a, b] = discoverExamples();
    const shards = shardExamples(5, [a, b], { [a]: 3, [b]: 4 });
    // The costlier example takes the first shard; the three unused shards are not emitted as empty entries.
    assert.deepEqual(shards, [[b], [a]]);
});

test('shardExamples balances a /benchmarks subset by the same costs', () => {
    const [a, b, c, d, e, f] = discoverExamples();
    const costs = { [a]: 90, [b]: 80, [c]: 10, [d]: 10, [e]: 500, [f]: 500 };
    // e and f are not requested, so they must not influence (or appear in) the plan.
    const shards = shardExamples(2, [a, b, c, d], costs);
    assert.deepEqual([...shards.flat()].sort(), [a, b, c, d]);
    assert.deepEqual(
        loads(shards, costs).sort((x, y) => x - y),
        [90, 100]
    );
});

test('shardExamples still rejects an unknown name in a subset', () => {
    assert.throws(() => shardExamples(3, ['__definitely-not-an-example__']), /Unknown benchmark example/);
});

test('the checked-in cost table is valid and spreads the real examples better than round-robin', () => {
    const costs = loadCosts();
    assert.ok(Object.keys(costs).length > 0);
    const median = [...Object.values(costs)].sort((x, y) => x - y)[Object.keys(costs).length >> 1];
    for (const count of [5, 6]) {
        const weighted = Math.max(...loads(shardExamples(count, [], costs), costs, median));
        const dealt = Math.max(...loads(roundRobin(discoverExamples(), count), costs, median));
        assert.ok(weighted <= dealt, `${count} shards: weighted max ${weighted}s vs round-robin max ${dealt}s`);
    }
});

test('loadCosts rejects a missing, zero, negative or non-numeric cost', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'costs-'));
    try {
        const load = (costs) => {
            const file = path.join(dir, 'costs.json');
            fs.writeFileSync(file, JSON.stringify({ costs }));
            return loadCosts(file);
        };
        assert.deepEqual(load({ a: 3 }), { a: 3 });
        assert.deepEqual(load(undefined), {});
        for (const bad of [0, -1, 'fast', null]) {
            assert.throws(() => load({ a: bad }), /Invalid cost for benchmark example "a"/);
        }
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

// --- CLI ---

const cli = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('CLI --shards prints a JSON array of comma-joined example lists covering every example', () => {
    const out = cli('--shards', '6');
    assert.equal(out.status, 0, out.stderr);
    const shards = JSON.parse(out.stdout);
    assert.equal(shards.length, 6);
    assert.deepEqual(shards.flatMap((s) => s.split(',')).sort(), discoverExamples());
});

test('CLI --shards reports each shard estimated load on stderr, leaving stdout as pure JSON', () => {
    const out = cli('--shards', '3');
    assert.match(out.stderr, /Shard 0: \d+ example\(s\), estimated [\d.]+ min/);
    assert.equal(out.stderr.match(/^Shard \d+:/gm).length, 3);
    assert.doesNotThrow(() => JSON.parse(out.stdout));
});

test('CLI --shards with --examples accepts commas and whitespace and shards only those names', () => {
    const [a, b, c] = discoverExamples();
    const out = cli('--shards', '2', '--examples', `${c} ${a},${b}`);
    assert.equal(out.status, 0, out.stderr);
    assert.deepEqual(
        JSON.parse(out.stdout)
            .flatMap((s) => s.split(','))
            .sort(),
        [a, b, c]
    );
});

test('CLI --shards with an unknown example fails loudly with a non-zero exit', () => {
    const out = cli('--shards', '2', '--examples', 'typo-example');
    assert.equal(out.status, 1);
    assert.match(out.stderr, /Unknown benchmark example\(s\): typo-example/);
    assert.equal(out.stdout, '');
});

test('CLI --shards rejects a missing, zero, negative or fractional count', () => {
    for (const bad of [[], ['0'], ['-2'], ['2.5'], ['many']]) {
        const out = cli('--shards', ...bad);
        assert.equal(out.status, 1, `--shards ${bad} should fail`);
        assert.match(out.stderr, /Usage:/);
    }
});

test('CLI --costs balances with the given table instead of the checked-in one', () => {
    const [a, b, c, d] = discoverExamples();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'costs-'));
    try {
        const file = path.join(dir, 'costs.json');
        fs.writeFileSync(file, JSON.stringify({ costs: { [a]: 50, [b]: 50, [c]: 1, [d]: 1 } }));
        const out = cli('--shards', '2', '--examples', [a, b, c, d].join(','), '--costs', file);
        assert.equal(out.status, 0, out.stderr);
        assert.deepEqual(JSON.parse(out.stdout), [`${a},${c}`, `${b},${d}`]);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('CLI without --shards still lists the runnable examples, one per line', () => {
    const out = cli();
    assert.equal(out.status, 0, out.stderr);
    assert.deepEqual(out.stdout.trim().split('\n'), discoverExamples());
});
