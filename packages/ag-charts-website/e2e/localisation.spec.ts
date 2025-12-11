import type { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('localisation', () => {
    setupIntrinsicAssertions(test);

    test('locale-change', async ({ page }) => {
        async function getSwapChainLabels() {
            const elems = page.locator('.ag-charts-series-area [id]');
            await expect(elems).toHaveCount(2);
            return [elems.nth(0), elems.nth(1)];
        }

        async function getSwapChainAnnouncers() {
            const elems = page.locator('.ag-charts-series-area [role="img"]');
            await expect(elems).toHaveCount(2);
            return [elems.nth(0), elems.nth(1)];
        }

        async function getLegendItemButtons() {
            const elems = page.locator('button.ag-charts-proxy-elem[role="switch"]');
            await expect(elems).toHaveCount(2);
            return [elems.nth(0), elems.nth(1)];
        }

        async function getLegendInstructions() {
            const elems = page.locator('.ag-charts-proxy-legend-toolbar > p');
            await expect(elems).toHaveCount(1);
            return elems.nth(0);
        }

        async function readAriaText() {
            const labelledBy1 = await announcer1.getAttribute('aria-labelledby');
            const labelledBy2 = await announcer2.getAttribute('aria-labelledby');
            expect(labelledBy1).toEqual(labelledBy2);
            const labelId1 = await label1.getAttribute('id');
            const labelId2 = await label2.getAttribute('id');
            expect(labelId1).not.toEqual(labelId2);

            let targetLabel: Locator;
            if (labelledBy1 === labelId1) {
                targetLabel = label1;
            } else if (labelledBy1 === labelId2) {
                targetLabel = label2;
            } else {
                fail(`unknown id: ${labelledBy1}`);
            }

            const swapChainText = await targetLabel.textContent();
            const button1Text = await button1.textContent();
            const button2Text = await button2.textContent();
            const instructionsText = await (await getLegendInstructions()).textContent();
            return [swapChainText, button1Text, button2Text, instructionsText];
        }

        async function interrupt() {
            // Interrupt the animation and force a focus-swapchain update
            await page.mouse.click(400, 300);
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowLeft');
        }

        const { url } = toExamplePageUrl('localisation-test', 'locale-and-formatters', 'vanilla');
        await gotoExample(page, url);
        const [label1, label2] = await getSwapChainLabels();
        const [announcer1, announcer2] = await getSwapChainAnnouncers();
        const [button1, button2] = await getLegendItemButtons();
        let swapChainText;
        let button1Text;
        let button2Text;
        let instructionsText;

        type LocaleString = 'fr-FR' | 'en-US';
        type TextExpectations = {
            swapChain: string;
            legendItem1: string;
            legendItem2: string;
            instructions: string;
        };

        const NBS = '\u00A0'; // NO-BREAK SPACE
        const NNBS = '\u202F'; // NARROW NO-BREAK SPACE
        const expectedAriaLabelText: Record<LocaleString, TextExpectations> = {
            'fr-FR': {
                swapChain: `janv.; Revenu; 250${NNBS}000${NBS}$US; Croissance; 10,0${NBS}%`,
                legendItem1: 'Revenu, Élément de légende 1 sur 2',
                legendItem2: 'Croissance, Élément de légende 2 sur 2',
                instructions: 'Appuyez sur Espace ou Entrée pour basculer la visibilité',
            },
            'en-US': {
                swapChain: 'Jan; Income; $250,000; Growth; 10.0%',
                legendItem1: 'Income, Legend item 1 of 2',
                legendItem2: 'Growth, Legend item 1 of 2',
                instructions: 'Press Space or Enter to toggle visibility',
            },
        };

        await interrupt();
        [swapChainText, button1Text, button2Text, instructionsText] = await readAriaText();
        expect(swapChainText).toEqual(expectedAriaLabelText['fr-FR'].swapChain);
        expect(button1Text).toEqual(expectedAriaLabelText['fr-FR'].legendItem1);
        expect(button2Text).toEqual(expectedAriaLabelText['fr-FR'].legendItem2);
        expect(instructionsText).toEqual(expectedAriaLabelText['fr-FR'].instructions);

        await page.selectOption('#mySelect', 'en-US');
        await interrupt();
        [swapChainText, button1Text, button2Text, instructionsText] = await readAriaText();
        expect(swapChainText).toEqual(expectedAriaLabelText['en-US'].swapChain);
        expect(button1Text).toEqual(expectedAriaLabelText['en-US'].legendItem1);
        expect(button2Text).toEqual(expectedAriaLabelText['en-US'].legendItem2);
        expect(instructionsText).toEqual(expectedAriaLabelText['en-US'].instructions);
    });
});
