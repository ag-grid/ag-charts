export type MapTypes<T> = UnionToIntersection<T extends { type: infer U extends string } ? { [K in U]: T } : never>;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
