const assert = require('node:assert/strict');
const test = require('node:test');

const { annotatePureToplevel } = require('../../esbuild.config.pure-toplevel.cjs');

// Run with: node --test tools/esbuild/

const INITIALISERS = [
    ['annotates a call with side-effect-free operands in place', 'var x = f(a, 1);', 'var x = /*#__PURE__*/ f(a, 1);'],
    ['annotates a new expression in place', 'var x = new Foo({ a: 1 });', 'var x = /*#__PURE__*/ new Foo({ a: 1 });'],
    ['treats a function argument as deferred', 'var x = f(() => g());', 'var x = /*#__PURE__*/ f(() => g());'],
    ['wraps a nested call', 'var x = f(g());', 'var x = /*#__PURE__*/ (() => (f(g())))();'],
    ['wraps a spread argument', 'var x = f(...a);', 'var x = /*#__PURE__*/ (() => (f(...a)))();'],
    [
        'wraps a non-call initialiser holding a call',
        'var x = { a: f() };',
        'var x = /*#__PURE__*/ (() => ({ a: f() }))();',
    ],
    ['leaves a side-effect-free initialiser alone', 'var x = 1;', 'var x = 1;'],
    [
        'annotates each declarator independently',
        'var a = f(), b = g(h());',
        'var a = /*#__PURE__*/ f(), b = /*#__PURE__*/ (() => (g(h())))();',
    ],
];

for (const [name, input, expected] of INITIALISERS) {
    test(`annotatePureToplevel: ${name}`, () => {
        assert.equal(annotatePureToplevel(input), expected);
    });
}
