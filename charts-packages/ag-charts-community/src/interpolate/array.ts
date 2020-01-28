import value from "./value";

export default function(a: any[], b: any[]): (t: number) => any[] {
    const nb = b ? b.length : 0;
    const na = a ? Math.min(nb, a.length) : 0;
    const x = new Array(na);
    const c = new Array(nb);
    let i;

    for (i = 0; i < na; ++i) {
        x[i] = value(a[i], b[i]);
    }
    for (; i < nb; ++i) {
        c[i] = b[i];
    }

    return function (t: number) {
        for (i = 0; i < na; ++i) {
            c[i] = x[i](t);
        }
        return c;
    };
}
