const assert = require('node:assert/strict');
const test = require('node:test');

const { annotatePureToplevel } = require('../../esbuild.config.pure-toplevel.cjs');

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
    [
        'merges trailing class statements, renaming references but not literals',
        'var _Foo = class {};\n_Foo.className = "_Foo";\n_Foo.registry = { _Foo };',
        'var _Foo = /*#__PURE__*/ (() => { var _c$0 = class {}; _c$0.className = "_Foo"; _c$0.registry = { _Foo: _c$0 }; return _c$0; })()',
    ],
    ['wraps a __VERIFY statement', '__VERIFY(x);', '/*#__PURE__*/ (() => { __VERIFY(x); })();'],
    [
        'drops bare AG Charts imports but keeps other side-effect imports',
        'import "ag-charts-core";\nimport "./side-effect.css";',
        '\nimport "./side-effect.css";',
    ],
];

for (const [name, input, expected] of INITIALISERS) {
    test(`annotatePureToplevel: ${name}`, () => {
        assert.equal(annotatePureToplevel(input), expected);
    });
}
