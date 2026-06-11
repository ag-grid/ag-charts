// TODO: !!!IMPORTANT!!! Use DAMP not DRY.

// TODO Add wrapper function for the selection-test/examples/e2e-accessibility-click example agE2E callables
//
// -   window.agE2E.initChartSelection
// -   window.agE2E.getChartSelection
// -   window.agE2E.popEvents
//
// Use inspiration from files `tooltip.spec.ts` and `state.spec.ts` on how to do this.
// Ensure that wrappers wait for stability where required to avoid test flakiness.


// TODO: Test the following things for `test()` calls with these titles:
// -   'screenshot': Expect the page to match a screenshot.
// -   'aria-label': Expect the `readSwapchainText()` value to match a string.
// -   'getSelection': Expect the `getChartSelection()` value to match an array of selection items.
// -   'popEvents': Expect the `popEvents()` value to match an array of selectionChange events.
test.describe('data-selection', () => {
    // TODO: Add relevant initialisation code here.

    test.describe('accessibility clicks', () => {
        test.beforeEach(async ({ page }) => {
            // TODO:
            // -   Open page selection-test/examples/e2e-accessibility-click
            // -   Call initChartSelection using wrapper
            // -   Tab into the chart to start keyboard navigation.
            // Ensure to wait for chart stability where required to avoid test flakiness.
        });
        test.describe('checks', () => {
            // aria-label should include the screenreader value of the first datum (unselected).
            // getSelection/popEvents should include the initial selection from initChartSelection.
            test('screenshot', async({ page }) => {});
            test('aria-label', async({ page }) => {});
            test('getSelection', async({ page }) => {});
            test('popEvents', async({ page }) => {});
        });
        test.describe('press ArrowRight 1 time', () => {
            test.beforeEach(async ({ page }) => {
                // TODO:
                // -   popEvents() and ignore return.
                // -   Release ArrowKey three times.
            });
            test.describe('checks', () => {
                // aria-label should include the screenreader value of the second datum (selected).
                // getSelection should include the initial selection from initChartSelection.
                // popEvents should be empty
                test('screenshot', async({ page }) => {});
                test('aria-label', async({ page }) => {});
                test('getSelection', async({ page }) => {});
                test('popEvents', async({ page }) => {});
            });
            test.describe('press ArrowRight 2 times', () => {
                test.beforeEach(async ({ page }) => {
                    // TODO: press ArrowRight 2 more times
                });
                test.describe('checks', () => {
                    // aria-label should include the screenreader value of the last datum (unselected)
                    // getSelection should include the initial selection from initChartSelection.
                    // popEvents should be empty
                    test('screenshot', async({ page }) => {});
                    test('aria-label', async({ page }) => {});
                    test('getSelection', async({ page }) => {});
                    test('popEvents', async({ page }) => {});
                });
                test.describe('press Space', () => {
                    test.beforeEach(async ({ page }) => {
                        // TODO: press Space
                    });
                    test.describe('checks', () => {
                        // aria-label should include the screenreader value of the last datum, with the new selected state announced first
                        // getSelection should include the last datum only
                        // popEvents should be include 1 removed datum (New York) and 1 added datum (Dubai).
                        test('screenshot', async({ page }) => {});
                        test('aria-label', async({ page }) => {});
                        test('getSelection', async({ page }) => {});
                        test('popEvents', async({ page }) => {});
                    });
                    test.describe('press Space again', () => {
                        test.beforeEach(async ({ page }) => {
                            // TODO: press Space
                        });
                        test.describe('checks', () => {
                            // No Change.
                            test('screenshot', async({ page }) => {});
                            test('aria-label', async({ page }) => {});
                            test('getSelection', async({ page }) => {});
                            test('popEvents', async({ page }) => {});
                        });
                    });
                });
            });
        });
    });

    test.describe('accessibility ctrl-clicks', () => { // Note: Same as 'accessibility clicks', but we'll press Ctrl+Space instead of just Space.
        test.beforeEach(async ({ page }) => {
            // TODO: same
        });
        test.describe('checks', () => {
            // TODO: same
            test('screenshot', async({ page }) => {});
            test('aria-label', async({ page }) => {});
            test('getSelection', async({ page }) => {});
            test('popEvents', async({ page }) => {});
        });
        test.describe('press ArrowRight 1 time', () => {
            test.beforeEach(async ({ page }) => {
                // TODO: same
            });
            test.describe('checks', () => {
                // TODO: same
                test('screenshot', async({ page }) => {});
                test('aria-label', async({ page }) => {});
                test('getSelection', async({ page }) => {});
                test('popEvents', async({ page }) => {});
            });
            test.describe('press ArrowRight 2 times', () => {
                test.beforeEach(async ({ page }) => {
                    // TODO: same
                });
                test.describe('checks', () => {
                    // TODO: same
                    test('screenshot', async({ page }) => {});
                    test('aria-label', async({ page }) => {});
                    test('getSelection', async({ page }) => {});
                    test('popEvents', async({ page }) => {});
                });
                test.describe('press Ctrl+Space', () => {
                    test.beforeEach(async ({ page }) => {
                        // TODO: press Ctrl+Space
                    });
                    test.describe('checks', () => {
                        // aria-label should include the screenreader value of the last datum, with the new selected state announced first
                        // getSelection should include the both the initial datum and the new datum.
                        // popEvents should be include 0 removed datums and 1 added datum (Dubai).
                        test('screenshot', async({ page }) => {});
                        test('aria-label', async({ page }) => {});
                        test('getSelection', async({ page }) => {});
                        test('popEvents', async({ page }) => {});
                    });
                    test.describe('press Ctrl+Space again', () => {
                        test.beforeEach(async ({ page }) => {
                            // TODO: press Ctrl+Space
                        });
                        test.describe('checks', () => {
                            // screenshot should match accessibility ctrl-clicks > press ArrowRight 1 time > press ArrowRight 2 times > checks (back to how it was before the initial keyboard-click).
                            // aria-label should include the screenreader value of the last datum, with the new unselected state announced first
                            // getSelection should include the initial selection from initChartSelection.
                            // popEvents should be include 1 removed datum (Dubai).
                            test('screenshot', async({ page }) => {});
                            test('aria-label', async({ page }) => {});
                            test('getSelection', async({ page }) => {});
                            test('popEvents', async({ page }) => {});
                        });
                    });
                });
            });
        });
    });

});

// TODO: finally - ensure that the file compiles, adding necessary imports, fixing TS errors, lint errors and so on. No need to run the tests themselves, I will run them and make necessary adjustments so that they run/pass; I just need help writing the DAMP boilerplate code.
