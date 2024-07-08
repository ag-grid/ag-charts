export type RequireOptional<T> = {
    [K in keyof Required<T>]: T[K] extends Required<T[K]> ? T[K] : T[K] | undefined;
};
