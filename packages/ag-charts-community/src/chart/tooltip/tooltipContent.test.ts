import { describe, expect, it } from 'vitest';

import { LtrEmbedding, PopDirectionalFormatting } from 'ag-charts-core';

import { type TooltipContent, isTooltipValueMissing, tooltipHtml } from './tooltipContent';

describe('tooltipContent', () => {
    describe('isTooltipValueMissing', () => {
        it('should return true for null by default', () => {
            expect(isTooltipValueMissing(null)).toBe(true);
        });

        it('should return true for undefined by default', () => {
            expect(isTooltipValueMissing(undefined)).toBe(true);
        });

        it('should return false for null when allowNull is true', () => {
            expect(isTooltipValueMissing(null, true)).toBe(false);
        });

        it('should return false for undefined when allowNull is true', () => {
            expect(isTooltipValueMissing(undefined, true)).toBe(false);
        });

        it('should return true for null when allowNull is false', () => {
            expect(isTooltipValueMissing(null, false)).toBe(true);
        });

        it('should return true for NaN regardless of allowNull', () => {
            expect(isTooltipValueMissing(Number.NaN)).toBe(true);
            expect(isTooltipValueMissing(Number.NaN, true)).toBe(true);
            expect(isTooltipValueMissing(Number.NaN, false)).toBe(true);
        });

        it('should return true for Infinity regardless of allowNull', () => {
            expect(isTooltipValueMissing(Infinity)).toBe(true);
            expect(isTooltipValueMissing(Infinity, true)).toBe(true);
            expect(isTooltipValueMissing(-Infinity, true)).toBe(true);
        });

        it('should return false for valid string values', () => {
            expect(isTooltipValueMissing('test')).toBe(false);
            expect(isTooltipValueMissing('')).toBe(false);
        });

        it('should return false for valid number values', () => {
            expect(isTooltipValueMissing(0)).toBe(false);
            expect(isTooltipValueMissing(42)).toBe(false);
            expect(isTooltipValueMissing(-1)).toBe(false);
        });

        it('should return false for Date values', () => {
            expect(isTooltipValueMissing(new Date())).toBe(false);
        });

        it('should return false for objects and arrays', () => {
            expect(isTooltipValueMissing({})).toBe(false);
            expect(isTooltipValueMissing([])).toBe(false);
        });
    });

    describe('tooltipHtml number direction', () => {
        const mark = (text: string) => LtrEmbedding + text + PopDirectionalFormatting;
        const localeManager = {
            t: (_key: string, variables?: Record<string, any>) => `${variables?.index} מתוך ${variables?.count}`,
        };
        const structured = (): TooltipContent => ({
            type: 'structured',
            heading: 'ינואר',
            title: 'רווח',
            data: [{ label: 'רווח', value: '-45' }],
        });

        it('marks the value in an RTL chart', () => {
            const html = tooltipHtml({ isRtl: true }, [structured()], 'shared', undefined);
            expect(html).toContain(`<span class="ag-charts-tooltip-value">${mark('-45')}</span>`);
        });

        it('leaves the value alone in an LTR chart', () => {
            const html = tooltipHtml({ isRtl: false }, [structured()], 'shared', undefined);
            expect(html).toContain('<span class="ag-charts-tooltip-value">-45</span>');
        });

        it.each([[true], [false]])('never touches raw HTML from a renderer (isRtl %j)', (isRtl) => {
            const rawHtmlString = '<div dir="rtl">רווח: -45</div>';
            const html = tooltipHtml({ isRtl }, [{ type: 'raw', rawHtmlString }], 'single', undefined);
            expect(html).toBe(rawHtmlString);
        });

        it('marks the numbers in the pagination footer', () => {
            const html = tooltipHtml({ localeManager, isRtl: true }, [structured()], 'shared', {
                index: 0,
                length: 3,
            });
            expect(html).toContain(`<div class="ag-charts-tooltip-footer">${mark('1')} מתוך ${mark('3')}</div>`);
        });

        it('marks a label carrying a number beside RTL text in an LTR chart', () => {
            const content: TooltipContent = {
                type: 'structured',
                data: [{ label: 'שינוי -12.5%', value: '8' }],
            };
            const html = tooltipHtml({ isRtl: false }, [content], 'shared', undefined);
            expect(html).toContain(`<span class="ag-charts-tooltip-label">שינוי ${mark('-12.5%')}</span>`);
        });
    });
});
