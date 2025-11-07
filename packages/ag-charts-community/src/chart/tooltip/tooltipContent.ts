import { toPlainText } from 'ag-charts-core';
import type { AgTooltipMode, TextOrSegments } from 'ag-charts-types';

import { sanitizeHtml } from '../../util/sanitize';
import { type LegendSymbolOptions, legendSymbolSvg } from '../legend/legendSymbol';

export const DEFAULT_TOOLTIP_CLASS = 'ag-charts-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-charts-tooltip--dark';

interface LocaleManager {
    t(key: string, variables?: Record<string, any>): string;
}

export type TooltipContentDataRow =
    | { label: string; fallbackLabel?: string; value: string; missing?: boolean }
    | { label: undefined; fallbackLabel: string; value: string; missing?: boolean };

export type TooltipStructuredContent = {
    heading?: TextOrSegments;
    title?: TextOrSegments;
    symbol?: LegendSymbolOptions;
    data?: TooltipContentDataRow[];
};

export type TooltipContent =
    | ({ type: 'structured' } & TooltipStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

export interface TooltipPaginationState {
    index: number;
    length: number;
}

interface GroupedStructuredContent {
    heading?: TextOrSegments;
    items: Omit<TooltipStructuredContent, 'heading'>[];
}

type GroupedTooltipContent =
    | ({ type: 'structured' } & GroupedStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

function textOrSegmentsIsDefined(value: TextOrSegments | undefined): value is TextOrSegments {
    if (value == null) {
        return false;
    } else if (Array.isArray(value)) {
        return value.some((segment) => textOrSegmentsIsDefined(segment.text));
    } else {
        return value.trim() !== '';
    }
}

/**
 * Determines if a value should be treated as missing in tooltips.
 * Only null, undefined, NaN, and Infinity are considered missing.
 * Strings, Dates, and other non-numeric values are valid for category/time axes.
 */
export function isTooltipValueMissing(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'number' && !Number.isFinite(value)) return true;
    return false;
}

/**
 * Check if tooltip content has all data marked as missing.
 * Used to filter out series with no valid data in shared tooltips.
 */
export function hasAllMissingData(content: TooltipContent): boolean {
    if (content.type === 'raw') return false;
    if (!content.data || content.data.length === 0) return false;
    return content.data.every((datum) => datum.missing === true);
}

function aggregateTooltipContent(content: TooltipContent[]): GroupedTooltipContent[] {
    const out: GroupedTooltipContent[] = [];
    const groupedContents = new Map<TextOrSegments, GroupedStructuredContent>();
    for (const item of content) {
        // Filter out items with all missing data
        if (hasAllMissingData(item)) continue;

        if (item.type === 'structured') {
            const { heading } = item;
            const insertionTarget = textOrSegmentsIsDefined(heading) ? groupedContents.get(heading) : undefined;
            const groupedItem: GroupedTooltipContent = { type: 'structured', heading, items: [item] };
            if (insertionTarget == null) {
                groupedContents.set(heading!, groupedItem);
                out.push(groupedItem);
            } else {
                insertionTarget.items.push(item);
            }
        } else {
            out.push(item);
        }
    }
    return out;
}

export function tooltipContentAriaLabel(ungroupedContent: TooltipContent[]) {
    const content = aggregateTooltipContent(ungroupedContent);
    const ariaLabel: string[] = [];

    for (const c of content) {
        if (c.type === 'raw') {
            continue;
        }
        if (textOrSegmentsIsDefined(c.heading)) {
            ariaLabel.push(toPlainText(c.heading));
        }
        for (const i of c.items) {
            if (textOrSegmentsIsDefined(i.title)) {
                ariaLabel.push(toPlainText(i.title));
            }
            if (i.data) {
                for (const datum of i.data) {
                    // Skip data rows that are marked as missing
                    if (datum.missing === true) continue;
                    ariaLabel.push(datum.label ?? datum.fallbackLabel, datum.value);
                }
            }
        }
    }

    return ariaLabel.filter((s) => s !== '').join('; ');
}

function dataHtml(label: string | undefined, value: string, inline: boolean) {
    let rowHtml = '';

    if (textOrSegmentsIsDefined(label)) {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(label)}</span>`;
        rowHtml += ' ';
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-value">${sanitizeHtml(value)}</span>`;
    } else {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(value)}</span>`;
    }

    const rowClassNames = [`${DEFAULT_TOOLTIP_CLASS}-row`];
    if (inline) rowClassNames.push(`${DEFAULT_TOOLTIP_CLASS}-row--inline`);
    rowHtml = `<div class="${rowClassNames.join(' ')}">${rowHtml}</div>`;

    return rowHtml;
}

function tooltipRowContentHtml(content: GroupedStructuredContent['items'][0]) {
    let html = '';

    // Skip the row if all data is missing (not just empty strings)
    if (content.data?.length && content.data.every((datum) => datum.missing === true)) {
        return html;
    }

    const titleDefined = textOrSegmentsIsDefined(content.title);

    const dataInline = !titleDefined && content.data?.length === 1;

    const symbol = content.symbol == null ? undefined : legendSymbolSvg(content.symbol, 12);
    if (symbol != null && (titleDefined || content.data?.length)) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-symbol">${symbol}</span>`;
    }

    if (titleDefined) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${sanitizeHtml(content.title!)}</span>`;
        html += ' ';
    }

    if (content.data) {
        for (const datum of content.data) {
            // Skip data rows that are marked as missing
            if (datum.missing === true) continue;
            html += dataHtml(datum.label ?? datum.fallbackLabel, datum.value, dataInline);
            html += ' ';
        }
    }
    return html;
}

function tooltipPaginationContentHtml(localeManager: LocaleManager | undefined, pagination: TooltipPaginationState) {
    if (localeManager == null || pagination.length === 1) return;

    const text = localeManager?.t('tooltipPaginationStatus', {
        index: pagination.index + 1,
        count: pagination.length,
    });
    return `<div class="${DEFAULT_TOOLTIP_CLASS}-footer">${text}</div>`;
}

function tooltipContentHtml(
    localeManager: LocaleManager | undefined,
    content: GroupedStructuredContent,
    mode: AgTooltipMode,
    pagination?: TooltipPaginationState
): string | undefined {
    const singleItem = content.items.length === 1 ? content.items[0] : undefined;

    let compact: boolean;
    let compactTitle: string | undefined;
    let compactFallbackLabel: string | undefined;
    switch (mode) {
        case 'compact':
            compact = true;
            compactTitle = toPlainText(singleItem?.title);
            break;
        case 'single':
            const headingDefined = textOrSegmentsIsDefined(content.heading);
            compact =
                singleItem != null &&
                (!headingDefined || singleItem.title == null) &&
                singleItem.data?.length === 1 &&
                singleItem.data[0].label == null &&
                singleItem.data[0].value != null;
            compactFallbackLabel = toPlainText(headingDefined ? content.heading : singleItem?.title);
            break;
        case 'shared':
            compact = false;
    }

    let html = '';
    if (compact && singleItem != null) {
        if (textOrSegmentsIsDefined(compactTitle)) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${sanitizeHtml(compactTitle)}</span>`;
        }

        if (singleItem.data) {
            for (const datum of singleItem.data) {
                // Skip data rows that are marked as missing
                if (datum.missing === true) continue;
                html += dataHtml(datum.label ?? compactFallbackLabel, datum.value, false);
                html += ' ';
            }
        }
    } else {
        // Full rendering
        if (textOrSegmentsIsDefined(content.heading)) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-heading">${sanitizeHtml(toPlainText(content.heading))}</span>`;
            html += ' ';
        }

        for (const item of content.items) {
            html += tooltipRowContentHtml(item);
        }
    }

    if (html.length === 0) return;

    const paginationContent =
        mode !== 'compact' && pagination != null ? tooltipPaginationContentHtml(localeManager, pagination) : undefined;
    if (paginationContent! + null) {
        html += paginationContent;
    }

    html = `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${html.trimEnd()}</div>`;

    return html;
}

function tooltipPaginationHtml(localeManager: LocaleManager | undefined, pagination: TooltipPaginationState) {
    const paginationContent = pagination == null ? undefined : tooltipPaginationContentHtml(localeManager, pagination);
    if (paginationContent == null) return '';

    return `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${paginationContent}</div>`;
}

export function tooltipHtml(
    localeManager: LocaleManager | undefined,
    content: TooltipContent[],
    mode: AgTooltipMode,
    pagination: TooltipPaginationState | undefined
): string | undefined {
    const aggregatedContent = aggregateTooltipContent(content);
    if (aggregatedContent.length === 0) return;

    if (aggregatedContent.length === 1 && aggregatedContent[0].type === 'structured') {
        return tooltipContentHtml(localeManager, aggregatedContent[0], mode, pagination);
    } else {
        const htmlRows = aggregatedContent.map((c) => {
            return c.type === 'structured' ? tooltipContentHtml(localeManager, c, mode) : c.rawHtmlString;
        });
        if (pagination != null) {
            htmlRows.push(tooltipPaginationHtml(localeManager, pagination) ?? '');
        }
        return htmlRows.join('');
    }
}
