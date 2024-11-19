import { Pool } from './pool';

describe('Pool', () => {
    const testPoolSize = 5;

    let pool: Pool<symbol, string>;
    let released: jest.MockedFunction<(i: symbol) => void>;
    let destroy: jest.MockedFunction<(i: symbol) => void>;

    beforeEach(() => {
        released = jest.fn();
        destroy = jest.fn();
        pool = new Pool('test', (name) => Symbol(name), released, destroy, testPoolSize);
    });

    afterEach(() => {
        pool.destroy();
    });

    it('should instantiate new items when empty', () => {
        const result = pool.obtain('create test 123');

        expect(typeof result.item).toEqual('symbol');
        expect(result.item.description).toEqual('create test 123');
    });

    it('should instantiate new items up to pool size', () => {
        for (let i = 0; i < testPoolSize; i++) {
            const result = pool.obtain('create test ' + i);
            expect(typeof result.item).toEqual('symbol');
            expect(result.item.description).toEqual('create test ' + i);
        }
    });

    it('should prevent new items when full', () => {
        for (let i = 0; i < testPoolSize; i++) {
            pool.obtain('create test ' + i);
        }

        expect(() => pool.obtain('create test ' + testPoolSize)).toThrowErrorMatchingInlineSnapshot(
            `"AG Charts - pool exhausted"`
        );
    });

    it('should free items when released', () => {
        const results = [];
        for (let i = 0; i < testPoolSize; i++) {
            results.push(pool.obtain('create test ' + i));
        }

        const testItems = results.splice(0, 2);
        pool.release(testItems[0].item);
        testItems[1].release();

        expect(released).toHaveBeenCalledWith(testItems[0].item);
        expect(released).toHaveBeenCalledWith(testItems[1].item);

        const reobtained = [pool.obtain(''), pool.obtain('')].map((i) => i.item);
        expect(reobtained).toContain(testItems[0].item);
        expect(reobtained).toContain(testItems[1].item);
    });

    it('should destroy freed items after 100ms', async () => {
        const results = [];
        for (let i = 0; i < testPoolSize; i++) {
            results.push(pool.obtain('create test ' + i));
        }

        results.forEach((r) => r.release());
        results.forEach((r) => {
            expect(released).toHaveBeenCalledWith(r.item);
        });

        await new Promise((r) => setTimeout(r, 50));
        expect(destroy).not.toHaveBeenCalled();

        await new Promise((r) => setTimeout(r, 50));

        results.forEach((r) => {
            expect(destroy).toHaveBeenCalledWith(r.item);
        });
    });
});
