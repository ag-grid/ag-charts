import {
    type Logger,
    type NormalisedTextOrSegments,
    forceLtrNumbersIn,
    getDocument,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { AgTooltipMode, TextValue } from 'ag-charts-types';

import { sanitizeHtml } from '../../util/sanitize';
import { type LegendSymbolOptions, legendSymbolSvg } from '../legend/legendSymbol';

export const DEFAULT_TOOLTIP_CLASS = 'ag-charts-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-charts-tooltip--dark';

interface LocaleManager {
    t(key: string, variables?: Record<string, any>): string;
}

interface TooltipHtmlContext {
    localeManager?: LocaleManager;
    /** Paragraph direction the tooltip element inherits from the chart root. */
    isRtl: boolean;
}

/** Escapes text the library lays out itself, keeping any number it carries in left-to-right order. */
function tooltipTextHtml(ctx: TooltipHtmlContext, text: NormalisedTextOrSegments) {
    return sanitizeHtml(forceLtrNumbersIn(toPlainText(text), ctx.isRtl));
}

export type TooltipContentDataRow =
    | { label: string; fallbackLabel?: string; value: TextValue; missing?: boolean }
    | { label: undefined; fallbackLabel: string; value: TextValue; missing?: boolean };

export type TooltipStructuredContent = {
    heading?: NormalisedTextOrSegments;
    title?: NormalisedTextOrSegments;
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
    heading?: NormalisedTextOrSegments;
    items: Omit<TooltipStructuredContent, 'heading'>[];
}

type GroupedTooltipContent =
    | ({ type: 'structured' } & GroupedStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

function textOrSegmentsIsDefined(value: NormalisedTextOrSegments | undefined): value is NormalisedTextOrSegments {
    if (value == null) {
        return false;
    } else if (Array.isArray(value)) {
        return value.some((segment) => segment.type !== 'image' && textOrSegmentsIsDefined(segment.text));
    } else {
        return toTextString(value).trim() !== '';
    }
}

/**
 * Determines if a value should be treated as missing in tooltips.
 * Only null, undefined, NaN, and Infinity are considered missing.
 * Strings, Dates, and other non-numeric values are valid for category/time axes.
 */
export function isTooltipValueMissing(value: any, allowNull: boolean = false): boolean {
    if (value == null) return !allowNull;
    return typeof value === 'number' && !Number.isFinite(value);
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
    const groupedContents = new Map<NormalisedTextOrSegments, GroupedStructuredContent>();
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

function readTextContent(html: string, logger: Logger): string {
    const tempDiv = getDocument().createElement('div');
    tempDiv.innerHTML = html;
    const result: string | undefined = tempDiv.textContent?.trim();

    if (result == null) {
        logger.warnOnce('cannot retrieve tooltip textContent (required for aria-label)');
        return '';
    } else {
        return result;
    }
}

export function tooltipContentAriaLabel(ungroupedContent: TooltipContent[], logger: Logger): string {
    const content = aggregateTooltipContent(ungroupedContent);
    const ariaLabel: string[] = [];

    for (const c of content) {
        if (c.type === 'raw') {
            ariaLabel.push(readTextContent(c.rawHtmlString, logger));
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
                    ariaLabel.push(datum.label ?? datum.fallbackLabel, toPlainText(datum.value));
                }
            }
        }
    }

    return ariaLabel.filter((s) => s !== '').join('; ');
}

function dataHtml(ctx: TooltipHtmlContext, label: string | undefined, value: string, inline: boolean) {
    let rowHtml = '';

    if (textOrSegmentsIsDefined(label)) {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${tooltipTextHtml(ctx, label)}</span>`;
        rowHtml += ' ';
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-value">${tooltipTextHtml(ctx, value)}</span>`;
    } else {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${tooltipTextHtml(ctx, value)}</span>`;
    }

    const rowClassNames = [`${DEFAULT_TOOLTIP_CLASS}-row`];
    if (inline) rowClassNames.push(`${DEFAULT_TOOLTIP_CLASS}-row--inline`);
    rowHtml = `<div class="${rowClassNames.join(' ')}">${rowHtml}</div>`;

    return rowHtml;
}

function tooltipRowContentHtml(ctx: TooltipHtmlContext, content: GroupedStructuredContent['items'][0]) {
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
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${tooltipTextHtml(ctx, content.title!)}</span>`;
        html += ' ';
    }

    if (content.data) {
        for (const datum of content.data) {
            // Skip data rows that are marked as missing
            if (datum.missing === true) continue;
            html += dataHtml(ctx, datum.label ?? datum.fallbackLabel, toPlainText(datum.value), dataInline);
            html += ' ';
        }
    }
    return html;
}

function tooltipPaginationContentHtml(ctx: TooltipHtmlContext, pagination: TooltipPaginationState) {
    const { localeManager } = ctx;
    if (localeManager == null || pagination.length === 1) return;

    const text = localeManager.t('tooltipPaginationStatus', {
        index: pagination.index + 1,
        count: pagination.length,
    });
    return `<div class="${DEFAULT_TOOLTIP_CLASS}-footer">${forceLtrNumbersIn(text, ctx.isRtl)}</div>`;
}

function tooltipContentHtml(
    ctx: TooltipHtmlContext,
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
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${tooltipTextHtml(ctx, compactTitle)}</span>`;
        }

        if (singleItem.data) {
            for (const datum of singleItem.data) {
                // Skip data rows that are marked as missing
                if (datum.missing === true) continue;
                html += dataHtml(ctx, datum.label ?? compactFallbackLabel, toPlainText(datum.value), false);
                html += ' ';
            }
        }
    } else {
        // Full rendering
        if (textOrSegmentsIsDefined(content.heading)) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-heading">${tooltipTextHtml(ctx, content.heading)}</span>`;
            html += ' ';
        }

        for (const item of content.items) {
            html += tooltipRowContentHtml(ctx, item);
        }
    }

    if (html.length === 0) return;

    const paginationContent =
        mode !== 'compact' && pagination != null ? tooltipPaginationContentHtml(ctx, pagination) : undefined;
    if (paginationContent! + null) {
        html += paginationContent;
    }

    html = `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${html.trimEnd()}</div>`;

    return html;
}

function tooltipPaginationHtml(ctx: TooltipHtmlContext, pagination: TooltipPaginationState) {
    const paginationContent = pagination == null ? undefined : tooltipPaginationContentHtml(ctx, pagination);
    if (paginationContent == null) return '';

    return `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${paginationContent}</div>`;
}

export function tooltipHtml(
    ctx: TooltipHtmlContext,
    content: TooltipContent[],
    mode: AgTooltipMode,
    pagination: TooltipPaginationState | undefined
): string | undefined {
    const aggregatedContent = aggregateTooltipContent(content);
    if (aggregatedContent.length === 0) return;

    if (aggregatedContent.length === 1 && aggregatedContent[0].type === 'structured') {
        return tooltipContentHtml(ctx, aggregatedContent[0], mode, pagination);
    } else {
        const htmlRows = aggregatedContent.map((c) => {
            return c.type === 'structured' ? tooltipContentHtml(ctx, c, mode) : c.rawHtmlString;
        });
        if (pagination != null) {
            htmlRows.push(tooltipPaginationHtml(ctx, pagination) ?? '');
        }
        return htmlRows.join('');
    }
}
