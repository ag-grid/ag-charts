type NonGenericType = { key1: string; key2: number };
const test_correctNonGenericVar: NonGenericType = { key1: '', key2: 0 };

type NoDefaultGenericType<A, B, C> = { a: A; b: B; c: C };
const test_correctNoDefaultGenericVar: NoDefaultGenericType<string, number, boolean> = { a: '--', b: 9, c: false };

type SomeDefaultGenericType<T, R = object, S = [number, number]> = { tide: T; ride: R; side: S };
const test_correctSomeDefaultGenericVar: SomeDefaultGenericType<string, string, string> = {
    tide: 'tow',
    ride: 'row',
    side: 'sow',
};
const test_incorrectSomeDefaultGenericVar1: SomeDefaultGenericType<string, string> = {
    tide: 'tug',
    ride: 'rug',
    side: [7, 3],
};
const test_incorrectSomeDefaultGenericVar2: SomeDefaultGenericType<string> = {
    tide: 'ted',
    ride: {},
    side: [7, 3],
};
type test_CorrectSomeDefaultParentType = { myVar: SomeDefaultGenericType<string, string, string> };
type test_IncorrectSomeDefaultParentType1 = { myVar: SomeDefaultGenericType<string, string> };
type test_IncorrectSomeDefaultParentType2 = { myVar: SomeDefaultGenericType<string> };

type AllDefaultGenericType<R = number, G = number, B = number> = { red: R; green: G; blue: B };
const test_correctAllDefaultGenericVar: AllDefaultGenericType<string, string, string> = {
    red: 'FF',
    green: 'DD',
    blue: 'AA',
};
const test_incorrectAllDefaultGenericVar1: AllDefaultGenericType<string, string> = {
    red: 'fd',
    green: 'ef',
    blue: 255,
};
const test_incorrectAllDefaultGenericVar2: AllDefaultGenericType<string> = {
    red: '0e',
    green: 100,
    blue: 87,
};
const test_incorrectAllDefaultGenericVar3: AllDefaultGenericType = {
    red: 43,
    green: 29,
    blue: 71,
};
type test_CorrectAllDefaultParentType = { myVar: AllDefaultGenericType<string, string, string> };
type test_IncorrectAllDefaultParentType1 = { myVar: AllDefaultGenericType<string, string> };
type test_IncorrectAllDefaultParentType2 = { myVar: AllDefaultGenericType<string> };
type test_IncorrectAllDefaultParentType3 = { myVar: AllDefaultGenericType };

interface SomeDefaultInterface<Tag, X = number, Y = number> {
    tag: Tag;
    x: X;
    y: Y;
}
interface test_CorrectSomeDerivedInterface extends SomeDefaultInterface<boolean, number, number> {}
interface test_IncorrectSomeDerivedInterface1 extends SomeDefaultInterface<boolean, number> {}
interface test_IncorrectSomeDerivedInterface1 extends SomeDefaultInterface<boolean> {}

interface AllDefaultInterface<X = number, Y = number> {
    x: X;
    y: Y;
}
interface test_CorrectAllDerivedInterface extends AllDefaultInterface<string, string> {}
interface test_IncorrectAllDerivedInterface1 extends AllDefaultInterface<string> {}
interface test_IncorrectAllDerivedInterface2 extends AllDefaultInterface {}
