export interface IDomain<D> {
    extend(value: any): void;
    getDomain(): D;
}

export class DiscreteDomain<T = any> implements IDomain<T[]> {
    private domain = new Set<T>();

    extend(value: T) {
        this.domain.add(value);
    }

    getDomain() {
        return [...this.domain];
    }

    static is(value: unknown): value is DiscreteDomain {
        return value instanceof DiscreteDomain;
    }
}

export class ContinuousDomain<T extends number | Date> implements IDomain<[T | number, T | number]> {
    private domain: [T | number, T | number] = [Infinity, -Infinity];

    extend(value: T) {
        if (this.domain[0] > value) {
            this.domain[0] = value;
        }
        if (this.domain[1] < value) {
            this.domain[1] = value;
        }
    }

    getDomain() {
        return [...this.domain] as [T | number, T | number];
    }

    static is<T extends number | Date = any>(value: unknown): value is ContinuousDomain<T> {
        return value instanceof ContinuousDomain;
    }
}
