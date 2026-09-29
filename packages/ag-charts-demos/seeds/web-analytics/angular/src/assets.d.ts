// flags.ts, devices.ts and browsers.ts (copied unchanged from the React demo) import their images
// as modules and use the resolved URL, which Vite provides by default. The Angular build does the
// same through the `loader` option in angular.json (`file` emits the image and resolves the import
// to its URL); these declarations only let those imports type-check.
declare module '*.png' {
    const url: string;
    export default url;
}

declare module '*.svg' {
    const url: string;
    export default url;
}
