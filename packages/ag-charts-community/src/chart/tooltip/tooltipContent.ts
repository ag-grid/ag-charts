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
    | { label: string; fallbackLabel?: string; value: string }
    | { label: undefined; fallbackLabel: string; value: string };

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

function aggregateTooltipContent(content: TooltipContent[]): GroupedTooltipContent[] {
    const out: GroupedTooltipContent[] = [];
    const groupedContents = new Map<TextOrSegments, GroupedStructuredContent>();
    for (const item of content) {
        if (item.type === 'structured') {
            const { heading } = item;
            const insertionTarget = heading == null ? undefined : groupedContents.get(heading);
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
        if (c.heading != null) {
            ariaLabel.push(toPlainText(c.heading));
        }
        for (const i of c.items) {
            if (i.title != null) {
                ariaLabel.push(toPlainText(i.title));
            }
            if (i.data) {
                for (const datum of i.data) {
                    ariaLabel.push(datum.label ?? datum.fallbackLabel, datum.value);
                }
            }
        }
    }

    return ariaLabel.filter((s) => s !== '').join('; ');
}

function dataHtml(label: string | undefined, value: string, inline: boolean) {
    let rowHtml = '';

    if (label == null && !value) {
        return '';
    }

    if (label == null) {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(value)}</span>`;
    } else {
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-label">${sanitizeHtml(label)}</span>`;
        rowHtml += ' ';
        rowHtml += `<span class="${DEFAULT_TOOLTIP_CLASS}-value">${sanitizeHtml(value)}</span>`;
    }

    const rowClassNames = [`${DEFAULT_TOOLTIP_CLASS}-row`];
    if (inline) rowClassNames.push(`${DEFAULT_TOOLTIP_CLASS}-row--inline`);
    rowHtml = `<div class="${rowClassNames.join(' ')}">${rowHtml}</div>`;

    return rowHtml;
}

function tooltipRowContentHtml(content: GroupedStructuredContent['items'][0]) {
    let html = '';

    if (content.data?.length && content.data.every((datum) => datum.value == null || datum.value === '')) {
        return html;
    }

    const dataInline = content.title == null && content.data?.length === 1;

    const symbol = content.symbol == null ? undefined : legendSymbolSvg(content.symbol, 12);
    if (symbol != null && (content.title != null || content.data?.length)) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-symbol">${symbol}</span>`;
    }

    if (content.title != null) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${sanitizeHtml(content.title)}</span>`;
        html += ' ';
    }

    if (content.data) {
        for (const datum of content.data) {
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
            compact =
                singleItem != null &&
                (content.heading == null || singleItem.title == null) &&
                singleItem.data?.length === 1 &&
                singleItem.data[0].label == null &&
                singleItem.data[0].value != null;
            compactFallbackLabel = toPlainText(content.heading ?? singleItem?.title);
            break;
        case 'shared':
            compact = false;
    }

    let html = '';
    if (compact && singleItem != null) {
        if (compactTitle != null) {
            html += dataHtml(undefined, compactTitle, false);
        }

        if (singleItem.data) {
            for (const datum of singleItem.data) {
                html += dataHtml(datum.label ?? compactFallbackLabel, datum.value, false);
                html += ' ';
            }
        }
    } else {
        // Full rendering
        if (content.heading != null) {
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
