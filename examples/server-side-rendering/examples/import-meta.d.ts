// Node.js 21.2+ provides import.meta.dirname and import.meta.filename.
// @types/node >=20.11 includes these, but the monorepo root may hoist an older
// version. This declaration ensures type-checking passes in both environments.
interface ImportMeta {
    dirname: string;
    filename: string;
}
