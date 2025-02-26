import type { AgTooltipMode } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import { sanitizeHtml } from '../../util/sanitize';
import { type LegendSymbolOptions, legendSymbolSvg } from '../legend/legendSymbol';

export const DEFAULT_TOOLTIP_CLASS = 'ag-charts-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-charts-tooltip--dark';

export type TooltipContentDataRow =
    | { label: string; fallbackLabel?: string; value: string }
    | { label: undefined; fallbackLabel: string; value: string };

export type TooltipStructuredContent = {
    heading?: string;
    title?: string;
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
    heading?: string;
    items: Omit<TooltipStructuredContent, 'heading'>[];
}

type GroupedTooltipContent =
    | ({ type: 'structured' } & GroupedStructuredContent)
    | { type: 'raw'; rawHtmlString: string };

function aggregateTooltipContent(content: TooltipContent[]): GroupedTooltipContent[] {
    const out: GroupedTooltipContent[] = [];
    const groupedContents = new Map<string, GroupedStructuredContent>();
    for (const item of content) {
        if (item.type === 'structured') {
            const { heading } = item;
            const insertionTarget = heading != null ? groupedContents.get(heading) : undefined;
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

export function tooltipContentAriaLabel(content: TooltipContent) {
    const ariaLabel: string[] = [];

    if (content.type === 'raw') return '';
    if (content.heading != null) ariaLabel.push(content.heading);
    if (content.title != null) ariaLabel.push(content.title);
    content.data?.forEach((datum) => {
        ariaLabel.push(datum.label ?? datum.fallbackLabel, datum.value);
    });

    return ariaLabel.join('; ');
}

function dataHtml(label: string | undefined, value: string, inline: boolean) {
    let rowHtml = '';

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

    const dataInline = content.title == null && content.data?.length === 1;

    const symbol = content.symbol == null ? undefined : legendSymbolSvg(content.symbol, 12);
    if (symbol != null && (content.title != null || content.data?.length)) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-symbol">${symbol}</span>`;
    }

    if (content.title != null) {
        html += `<span class="${DEFAULT_TOOLTIP_CLASS}-title">${sanitizeHtml(content.title)}</span>`;
        html += ' ';
    }

    content.data?.forEach((datum) => {
        html += dataHtml(datum.label ?? datum.fallbackLabel, datum.value, dataInline);
        html += ' ';
    });

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
) {
    let html = '';

    const singleItem = content.items.length === 1 ? content.items[0] : undefined;

    if (
        mode !== 'shared' &&
        singleItem != null &&
        (content.heading == null || singleItem.title == null) &&
        singleItem.data?.length === 1 &&
        singleItem.data[0].label == null &&
        singleItem.data[0].value != null
    ) {
        // Compact rendering
        const datum = singleItem.data[0];

        html += dataHtml(content.heading ?? singleItem.title, datum.value, false);
    } else {
        // Full rendering

        if (content.heading != null) {
            html += `<span class="${DEFAULT_TOOLTIP_CLASS}-heading">${sanitizeHtml(content.heading)}</span>`;
            html += ' ';
        }

        content.items.forEach((item) => {
            html += tooltipRowContentHtml(item);
        });
    }

    const paginationContent = pagination == null ? undefined : tooltipPaginationContentHtml(localeManager, pagination);
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

function compactTooltipHtml(content: GroupedStructuredContent) {
    const data = content.items?.[0].data;
    if (data == null || data.length === 0) return '';

    const { label, value } = data[0];
    return `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${dataHtml(label, value, false)}</div>`;
}

export function tooltipHtml(
    localeManager: LocaleManager | undefined,
    content: TooltipContent[],
    mode: AgTooltipMode,
    pagination: TooltipPaginationState | undefined
) {
    const aggregatedContent = aggregateTooltipContent(content);
    if (aggregatedContent.length === 0) return '';

    if (aggregatedContent.length === 1 && aggregatedContent[0].type === 'structured') {
        return mode === 'compact'
            ? compactTooltipHtml(aggregatedContent[0])
            : tooltipContentHtml(localeManager, aggregatedContent[0], mode, pagination);
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
