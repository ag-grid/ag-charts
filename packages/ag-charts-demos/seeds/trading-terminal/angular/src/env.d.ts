// `import.meta.env.VITE_DEMO_DETERMINISTIC` is a Vite convention that deterministic.ts (copied
// unchanged from the React demo) reads. The Angular build has no `import.meta.env`, so angular.json
// `define` replaces that whole expression with `undefined` at build time; this declaration only
// lets it type-check. The runtime switch is the `?deterministic=1` URL query.
interface ImportMetaEnv {
    readonly VITE_DEMO_DETERMINISTIC?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
