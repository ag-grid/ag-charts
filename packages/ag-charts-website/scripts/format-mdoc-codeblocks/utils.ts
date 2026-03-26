/**
 * Check if a language identifier is a JavaScript/TypeScript variant
 */
export function isJavaScriptLang(lang: string | null | undefined): boolean {
    if (!lang) return false;
    const normalized = lang.toLowerCase();
    return ['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(normalized);
}
