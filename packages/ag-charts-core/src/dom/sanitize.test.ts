import { describe, expect, it } from 'vitest';

import { escapeHtml } from './sanitize';

describe('escapeHtml', () => {
    it('escapes markup characters', () => {
        expect(escapeHtml(`a < b & "c" 'd' <i>e</i>`)).toBe(
            'a &lt; b &amp; &quot;c&quot; &#39;d&#39; &lt;i&gt;e&lt;/i&gt;'
        );
    });

    it('escapes ampersands in text that is already escaped', () => {
        expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    });

    it('leaves newlines and plain text unchanged', () => {
        expect(escapeHtml('line 1\nline 2')).toBe('line 1\nline 2');
        expect(escapeHtml('')).toBe('');
    });
});
