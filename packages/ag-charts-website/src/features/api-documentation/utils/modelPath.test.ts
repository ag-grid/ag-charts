import { createUnionNestedObjectPathItemRegex } from './modelPath';

describe('createUnionNestedObjectPathItemRegex', () => {
    it('returns null for simple path items', () => {
        const regex = createUnionNestedObjectPathItemRegex();

        expect(regex.exec('something')).toBeNull();
    });

    it('returns value breakdown for discriminator paths', () => {
        const regex = createUnionNestedObjectPathItemRegex();

        expect(regex.exec("[type = 'number']")).toMatchInlineSnapshot(`
          [
            "[type = 'number']",
            "[type = '",
            "number",
            "']",
          ]
        `);
    });
});
