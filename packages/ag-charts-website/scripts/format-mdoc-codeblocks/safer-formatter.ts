/**
 * Safer approach to formatting that prioritizes skipping over failing
 */
import * as prettier from 'prettier';

import { getParserForLang } from './utils';
import { tryWrapCode } from './wrappers';

/**
 * Safe format that returns original on any error
 */
export async function safeFormatCodeBlock(
    code: string,
    lang: string
): Promise<{ formatted: string; skipped: boolean; reason?: string }> {
    try {
        const parser = getParserForLang(lang);
        const prettierConfig = (await prettier.resolveConfig(process.cwd())) ?? {};

        const config = {
            ...prettierConfig,
            parser,
            printWidth: 120,
            tabWidth: 4,
            semi: true,
            singleQuote: true,
            trailingComma: 'es5' as const,
        };

        // Try direct format first
        try {
            const formatted = await prettier.format(code, config);
            return { formatted: formatted.replace(/\n$/, ''), skipped: false };
        } catch {
            // Try wrapping
            const wrapResult = tryWrapCode(code, lang);
            if (!wrapResult) {
                return { formatted: code, skipped: true, reason: 'No wrap strategy available' };
            }

            try {
                const formatted = await prettier.format(wrapResult.wrapped, config);
                const unwrapped = wrapResult.strategy.unwrap(formatted);
                return { formatted: unwrapped.replace(/\n$/, ''), skipped: false };
            } catch {
                return {
                    formatted: code,
                    skipped: true,
                    reason: `Failed with ${wrapResult.strategy.name} strategy`,
                };
            }
        }
    } catch (error) {
        return {
            formatted: code,
            skipped: true,
            reason: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
        };
    }
}
