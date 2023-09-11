export type Has<P extends keyof T, T> = T & { [K in P]-?: T[P] };

export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
