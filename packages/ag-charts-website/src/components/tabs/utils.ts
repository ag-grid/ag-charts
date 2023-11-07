import { load } from 'cheerio';

import { TAB_ID_PROP, TAB_LABEL_PROP } from './constants';
import type { TabData } from './types';

export function extractTabsData(html: string): TabData[] {
    const $ = load(html, null, false);

    return $(`[${TAB_LABEL_PROP}]`)
        .map((_index: number, node: any) => {
            const id = node.attribs[TAB_ID_PROP];
            const label = node.attribs[TAB_LABEL_PROP];
            const content = $(`[${TAB_LABEL_PROP}="${label}"]`).html() || '';

            return {
                id,
                label,
                content,
            };
        })
        .toArray();
}
