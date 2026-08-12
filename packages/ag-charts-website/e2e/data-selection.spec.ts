import type { Page } from '@playwright/test';

import type { AgSelectionChangeEvent, AgSelectionChangeEventSource, AgSelectionItem } from 'ag-charts-types';

import { PREVENT_DEFAULT_STUB, evalPageFunction, popPreventables } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    readSwapchainText,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForChartUpdate,
} from './util';

type Datum = { population: number; city: string };
type SelectionItem = AgSelectionItem<Datum>;
type SelectionChangeEvent = AgSelectionChangeEvent<Datum, unknown>;

const NEW_YORK: SelectionItem = {
    seriesId: 'myBarSeries',
    itemId: 'New York',
    datum: { population: 8.1, city: 'New York' },
};
const DUBAI: SelectionItem = { seriesId: 'myBarSeries', itemId: 'Dubai', datum: { population: 4, city: 'Dubai' } };

function selectionChange(
    source: AgSelectionChangeEventSource,
    added: SelectionItem[],
    removed: SelectionItem[]
): SelectionChangeEvent {
    return {
        type: 'selectionChange',
        source,
        added,
        removed,
        defaultPrevented: false,
        preventDefault: PREVENT_DEFAULT_STUB,
    };
}

async function initChartSelection(page: Page): Promise<void> {
    await evalPageFunction(page, 'initChartSelection');
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
}

async function getChartSelection(page: Page): Promise<unknown> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    return await evalPageFunction(page, 'getChartSelection');
}

async function popEvents(page: Page): Promise<unknown> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    return await popPreventables(page, 'popEvents');
}

async function openExampleAndFocusFirstDatum(page: Page): Promise<void> {
    await gotoExample(page, toExamplePageUrl('selection-e2e', 'accessibility-click', 'vanilla').url);
    await initChartSelection(page);
    await page.keyboard.press('Tab');
}

test.describe('data-selection', () => {
    setupIntrinsicAssertions(test);

    test.describe('accessibility clicks', () => {
        test.beforeEach(async ({ page }) => {
            await openExampleAndFocusFirstDatum(page);
        });

        // Focus is on the first datum (London, unselected); New York stays selected from initChartSelection.
        test.describe('checks', () => {
            test('screenshot', async ({ page }) => {
                await expectChartScreenshot(page, page, 'selection-initial-focus.png', { animations: 'disabled' });
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('London; population; 9.1, unselected');
            });
            test('getSelection', async ({ page }) => {
                expect(await getChartSelection(page)).toEqual([NEW_YORK]);
            });
            test('popEvents', async ({ page }) => {
                expect(await popEvents(page)).toEqual([selectionChange('api-call', [NEW_YORK], [])]);
            });
        });

        test.describe('press ArrowRight 1 time', () => {
            test.beforeEach(async ({ page }) => {
                await popEvents(page); // discard the initChartSelection event
                await page.keyboard.press('ArrowRight'); // London -> New York
            });

            // Focus is on the second datum (New York, selected).
            test.describe('checks', () => {
                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'selection-focus-new-york-selected.png', {
                        animations: 'disabled',
                    });
                });
                test('aria-label', async ({ page }) => {
                    expect(await readSwapchainText(page)).toBe('New York; population; 8.1, selected');
                });
                test('getSelection', async ({ page }) => {
                    expect(await getChartSelection(page)).toEqual([NEW_YORK]);
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('press ArrowRight 2 times', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('ArrowRight'); // New York -> Tokyo
                    await page.keyboard.press('ArrowRight'); // Tokyo -> Dubai
                });

                // Focus is on the last datum (Dubai, unselected).
                test.describe('checks', () => {
                    test('screenshot', async ({ page }) => {
                        await expectChartScreenshot(page, page, 'selection-focus-dubai-unselected.png', {
                            animations: 'disabled',
                        });
                    });
                    test('aria-label', async ({ page }) => {
                        expect(await readSwapchainText(page)).toBe('Dubai; population; 4, unselected');
                    });
                    test('getSelection', async ({ page }) => {
                        expect(await getChartSelection(page)).toEqual([NEW_YORK]);
                    });
                    test('popEvents', async ({ page }) => {
                        expect(await popEvents(page)).toEqual([]);
                    });
                });

                test.describe('press Space', () => {
                    test.beforeEach(async ({ page }) => {
                        await page.keyboard.press('Space'); // single-click: select Dubai, deselect New York
                    });

                    // Dubai becomes the only selected datum; the new state is announced first.
                    test.describe('checks', () => {
                        test('screenshot', async ({ page }) => {
                            await expectChartScreenshot(page, page, 'selection-single-dubai-selected.png', {
                                animations: 'disabled',
                            });
                        });
                        test('aria-label', async ({ page }) => {
                            expect(await readSwapchainText(page)).toBe('selected, Dubai; population; 4');
                        });
                        test('getSelection', async ({ page }) => {
                            expect(await getChartSelection(page)).toEqual([DUBAI]);
                        });
                        test('popEvents', async ({ page }) => {
                            expect(await popEvents(page)).toEqual([
                                selectionChange('user-interaction', [DUBAI], [NEW_YORK]),
                            ]);
                        });
                    });

                    test.describe('press Space again', () => {
                        test.beforeEach(async ({ page }) => {
                            await popEvents(page); // discard the previous Space event
                            await page.keyboard.press('Space'); // no-op: Dubai is already the single selection
                        });

                        // No change: Dubai stays selected and no new event is emitted.
                        test.describe('checks', () => {
                            test('screenshot', async ({ page }) => {
                                await expectChartScreenshot(page, page, 'selection-single-dubai-selected.png', {
                                    animations: 'disabled',
                                });
                            });
                            test('aria-label', async ({ page }) => {
                                expect(await readSwapchainText(page)).toBe('selected, Dubai; population; 4');
                            });
                            test('getSelection', async ({ page }) => {
                                expect(await getChartSelection(page)).toEqual([DUBAI]);
                            });
                            test('popEvents', async ({ page }) => {
                                expect(await popEvents(page)).toEqual([]);
                            });
                        });
                    });
                });
            });
        });
    });

    // Same as 'accessibility clicks', but we press Ctrl+Space instead of just Space.
    test.describe('accessibility ctrl-clicks', () => {
        test.beforeEach(async ({ page }) => {
            await openExampleAndFocusFirstDatum(page);
        });

        // Focus is on the first datum (London, unselected); New York stays selected from initChartSelection.
        test.describe('checks', () => {
            test('screenshot', async ({ page }) => {
                await expectChartScreenshot(page, page, 'selection-initial-focus.png', { animations: 'disabled' });
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('London; population; 9.1, unselected');
            });
            test('getSelection', async ({ page }) => {
                expect(await getChartSelection(page)).toEqual([NEW_YORK]);
            });
            test('popEvents', async ({ page }) => {
                expect(await popEvents(page)).toEqual([selectionChange('api-call', [NEW_YORK], [])]);
            });
        });

        test.describe('press ArrowRight 1 time', () => {
            test.beforeEach(async ({ page }) => {
                await popEvents(page); // discard the initChartSelection event
                await page.keyboard.press('ArrowRight'); // London -> New York
            });

            // Focus is on the second datum (New York, selected).
            test.describe('checks', () => {
                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'selection-focus-new-york-selected.png', {
                        animations: 'disabled',
                    });
                });
                test('aria-label', async ({ page }) => {
                    expect(await readSwapchainText(page)).toBe('New York; population; 8.1, selected');
                });
                test('getSelection', async ({ page }) => {
                    expect(await getChartSelection(page)).toEqual([NEW_YORK]);
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('press ArrowRight 2 times', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('ArrowRight'); // New York -> Tokyo
                    await page.keyboard.press('ArrowRight'); // Tokyo -> Dubai
                });

                // Focus is on the last datum (Dubai, unselected).
                test.describe('checks', () => {
                    test('screenshot', async ({ page }) => {
                        await expectChartScreenshot(page, page, 'selection-focus-dubai-unselected.png', {
                            animations: 'disabled',
                        });
                    });
                    test('aria-label', async ({ page }) => {
                        expect(await readSwapchainText(page)).toBe('Dubai; population; 4, unselected');
                    });
                    test('getSelection', async ({ page }) => {
                        expect(await getChartSelection(page)).toEqual([NEW_YORK]);
                    });
                    test('popEvents', async ({ page }) => {
                        expect(await popEvents(page)).toEqual([]);
                    });
                });

                test.describe('press Ctrl+Space', () => {
                    test.beforeEach(async ({ page }) => {
                        await page.keyboard.press('Control+Space'); // ctrl-click: add Dubai to the existing selection
                    });

                    // Dubai is added alongside New York; the new state is announced first.
                    test.describe('checks', () => {
                        test('screenshot', async ({ page }) => {
                            await expectChartScreenshot(page, page, 'selection-multi-new-york-and-dubai-selected.png', {
                                animations: 'disabled',
                            });
                        });
                        test('aria-label', async ({ page }) => {
                            expect(await readSwapchainText(page)).toBe('selected, Dubai; population; 4');
                        });
                        test('getSelection', async ({ page }) => {
                            expect(await getChartSelection(page)).toEqual([NEW_YORK, DUBAI]);
                        });
                        test('popEvents', async ({ page }) => {
                            expect(await popEvents(page)).toEqual([selectionChange('user-interaction', [DUBAI], [])]);
                        });
                    });

                    test.describe('press Ctrl+Space again', () => {
                        test.beforeEach(async ({ page }) => {
                            await popEvents(page); // discard the previous Ctrl+Space event
                            await page.keyboard.press('Control+Space'); // ctrl-click again: toggle Dubai off
                        });

                        // Back to how it was before the click: Dubai is unselected, announced first.
                        test.describe('checks', () => {
                            test('screenshot', async ({ page }) => {
                                await expectChartScreenshot(page, page, 'selection-focus-dubai-unselected.png', {
                                    animations: 'disabled',
                                });
                            });
                            test('aria-label', async ({ page }) => {
                                expect(await readSwapchainText(page)).toBe('unselected, Dubai; population; 4');
                            });
                            test('getSelection', async ({ page }) => {
                                expect(await getChartSelection(page)).toEqual([NEW_YORK]);
                            });
                            test('popEvents', async ({ page }) => {
                                expect(await popEvents(page)).toEqual([
                                    selectionChange('user-interaction', [], [DUBAI]),
                                ]);
                            });
                        });
                    });
                });
            });
        });
    });
});
