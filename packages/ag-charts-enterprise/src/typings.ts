declare module '*.css' {
    const contents: string;
    export default contents;
}

declare module '*.html' {
    const contents: string;
    export default contents;
}

declare module '*.json' {
    const contents: Record<string, any>;
    export default contents;
}
