// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertEmpty(_t: Record<string, never>) {}

export const IGNORED_PROP = Symbol('IGNORED_PROP');

export function pickProps<T>(
    opts: Partial<T>,
    values: { [K in keyof Required<T>]: (T[K] extends Required<T[K]> ? T[K] : T[K] | undefined) | typeof IGNORED_PROP }
) {
    const out: any = {};
    for (const key in values) {
        const value = values[key];
        if (value !== IGNORED_PROP && Object.hasOwn(opts as any, key)) {
            out[key] = value;
        }
    }
    return out;
}
