/**
 * Check if a language identifier is a JavaScript/TypeScript variant
 */
export function isJavaScriptLang(lang: string | null | undefined): boolean {
    if (!lang) return false;
    const normalized = lang.toLowerCase();
    return ['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(normalized);
}

/**
 * Get the appropriate Prettier parser for a language
 */
export function getParserForLang(lang: string): string {
    const langMap: Record<string, string> = {
        js: 'babel',
        javascript: 'babel',
        jsx: 'babel',
        ts: 'typescript',
        typescript: 'typescript',
        tsx: 'babel-ts',
    };
    return langMap[lang.toLowerCase()] || 'babel';
}
