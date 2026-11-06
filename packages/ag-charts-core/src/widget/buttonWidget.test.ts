import { describe, expect, it } from 'vitest';

import { ButtonWidget } from './buttonWidget';

describe('ButtonWidget', () => {
    it('setType changes the native button type', () => {
        const button = new ButtonWidget();
        button.setType('button');
        expect(button.getElement().type).toBe('button');
        expect(button.getElement().getAttribute('type')).toBe('button');
    });
});
