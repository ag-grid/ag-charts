import { type Locator, type Page, expect } from '@playwright/test';

// The accessibility contract of the demos' composite controls, which the React reference gets from
// Radix UI and every framework port hand-rolls: the Select's combobox and listbox, the Tabs, the
// ToggleGroup's radiogroup, the Popover and the id linkages between their parts. Each demo spec
// applies these to its own controls, against the React app or, via DEMOS_BASE_URL, against a port.
// What is asserted is what an id resolves to, never the id string, which differs per framework.

/** Controls rendered by the demos rather than by AG Grid or AG Charts, which have contracts of their own. */
const DEMO_CONTROLS = ':not(.ag-root-wrapper *):not(.ag-charts-wrapper *)';

export interface SelectSpec {
    /** The trigger's accessible name (the demo's `ariaLabel`). */
    name: string;
    /** Every option's label, in order. */
    options: readonly string[];
    /** The label selected when the test starts. */
    initial: string;
}

export interface TabsSpec {
    /** The tablist's accessible name. */
    name: string;
    /** Every tab's label, in order. */
    tabs: readonly string[];
    /** The tab selected when the test starts. */
    initial: string;
    orientation: 'horizontal' | 'vertical';
}

export interface RadioGroupSpec {
    /** The radiogroup's accessible name. */
    name: string;
    /** Every radio's label, in order. */
    options: readonly string[];
    /** The radio checked when the test starts. */
    initial: string;
}

/** The element an id-valued attribute points at. */
const byId = (page: Page, id: string) => page.locator(`[id="${id}"]`);

/** Read an attribute that the contract requires to be present. */
async function requiredAttribute(locator: Locator, name: string): Promise<string> {
    const value = await locator.getAttribute(name);
    expect(value, `${name} on ${await locator.evaluate((el) => el.outerHTML.slice(0, 120))}`).toBeTruthy();
    return value!;
}

/**
 * Radix's typeahead for one typed character: the first option after `current`, wrapping round,
 * whose label starts with it, never `current` itself; `current` when there is none, since the
 * value then stays.
 */
function typeaheadMatch(options: readonly string[], current: string, char: string): string {
    const start = options.indexOf(current);
    const candidates = options.map((_, index) => options[(start + 1 + index) % options.length]);
    return candidates.filter((option) => option !== current).find((option) => option.startsWith(char)) ?? current;
}

/** The option after `current`, wrapping round: the natural typeahead target. */
const optionAfter = (options: readonly string[], current: string) =>
    options[(options.indexOf(current) + 1) % options.length];

/**
 * Every `aria-labelledby` and `aria-controls` on the demo's own controls, and every `for` on their
 * labels, names an element that exists. The closed combobox is exempt: Radix gives it
 * `aria-controls` for a listbox it has not mounted yet, and the open state is asserted in
 * `expectSelectOpenTypeahead`. Call it once the demo has rendered: the React app shows the demo's
 * container before a lazily loaded demo renders anything, and an empty page has nothing to fail.
 */
export async function expectIdLinkagesResolve(page: Page) {
    const unresolved = await page.evaluate((selector) => {
        const misses: string[] = [];
        for (const attr of ['aria-labelledby', 'aria-controls']) {
            for (const el of document.querySelectorAll(`[${attr}]${selector}`)) {
                if (attr === 'aria-controls' && el.getAttribute('aria-expanded') === 'false') continue;
                for (const id of el.getAttribute(attr)!.split(/\s+/)) {
                    if (!document.getElementById(id))
                        misses.push(`${el.tagName.toLowerCase()}[role=${el.getAttribute('role')}] ${attr}="${id}"`);
                }
            }
        }
        for (const label of document.querySelectorAll(`label[for]${selector}`)) {
            const id = label.getAttribute('for')!;
            if (!document.getElementById(id)) misses.push(`label for="${id}"`);
        }
        return misses;
    }, DEMO_CONTROLS);
    expect(unresolved, 'aria-labelledby / aria-controls / label for ids with no element').toEqual([]);
}

/**
 * Typing on the closed combobox moves its value to the option the character matches, without
 * opening it: the next option starting with that character, then on a repeat the one after that,
 * or the same one when no other starts with it.
 */
export async function expectSelectClosedTypeahead(page: Page, spec: SelectSpec) {
    const combobox = page.getByRole('combobox', { name: spec.name, exact: true });
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    await expect(combobox).toContainText(spec.initial);
    await combobox.focus();
    await expect(combobox).toBeFocused();

    const char = optionAfter(spec.options, spec.initial)[0];
    let current = spec.initial;
    for (let press = 0; press < 2; press++) {
        const match = typeaheadMatch(spec.options, current, char);
        await page.keyboard.press(char);
        await expect(combobox).toContainText(match);
        await expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await expect(combobox).toHaveAttribute('data-state', 'closed');
        await expect(page.locator(`[role="listbox"]${DEMO_CONTROLS}`)).toHaveCount(0);
        current = match;
    }
}

/**
 * Enter opens the listbox the combobox controls, with the selected option focused and marked, and
 * every option labelled by its own text. Typing focuses the matching option without selecting it;
 * Enter then selects it and closes. Reopened, Escape closes without a change and hands focus back
 * to the combobox.
 */
export async function expectSelectOpenTypeahead(page: Page, spec: SelectSpec) {
    // While the listbox is open the rest of the page, the combobox included, is `aria-hidden`.
    const combobox = page.getByRole('combobox', { name: spec.name, exact: true, includeHidden: true });
    await combobox.focus();
    await page.keyboard.press('Enter');

    const listbox = byId(page, await requiredAttribute(combobox, 'aria-controls'));
    await expect(listbox).toHaveRole('listbox');
    await expect(listbox).toHaveAttribute('data-state', 'open');
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(combobox).toHaveAttribute('data-state', 'open');

    const options = listbox.getByRole('option');
    await expect(options).toHaveText([...spec.options]);
    for (const [index, label] of spec.options.entries()) {
        const option = options.nth(index);
        await expect(byId(page, await requiredAttribute(option, 'aria-labelledby'))).toHaveText(label);
        await expect(option).toHaveAttribute('data-state', label === spec.initial ? 'checked' : 'unchecked');
    }

    const selected = options.nth(spec.options.indexOf(spec.initial));
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute('aria-selected', 'true');
    await expect(selected).toHaveAttribute('data-highlighted', '');

    // Typing moves focus, and with it the highlight, to the match; the value is untouched.
    const target = optionAfter(spec.options, spec.initial);
    const matched = options.nth(spec.options.indexOf(target));
    await page.keyboard.press(target[0]);
    await expect(matched).toBeFocused();
    await expect(matched).toHaveAttribute('data-highlighted', '');
    await expect(matched).toHaveAttribute('aria-selected', 'false');
    await expect(matched).toHaveAttribute('data-state', 'unchecked');
    await expect(selected).not.toHaveAttribute('data-highlighted', '');
    await expect(selected).toHaveAttribute('aria-selected', 'false');
    await expect(combobox).toContainText(spec.initial);

    // Enter selects the focused option and closes.
    await page.keyboard.press('Enter');
    await expect(listbox).toHaveCount(0);
    await expect(combobox).toContainText(target);
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    await expect(combobox).toBeFocused();

    // Reopened, the new value is the focused option; Escape closes without changing it.
    await page.keyboard.press('Enter');
    const reopened = byId(page, await requiredAttribute(combobox, 'aria-controls'));
    await expect(reopened.getByRole('option').nth(spec.options.indexOf(target))).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(reopened).toHaveCount(0);
    await expect(combobox).toContainText(target);
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    await expect(combobox).toBeFocused();
}

/**
 * Every tab controls a tabpanel that is labelled by it; the selected tab's panel is shown and the
 * others hidden. Focus landing on the tablist moves to the selected tab, the arrow keys along the
 * orientation move it (and the selection) with wrap-around, and Home/End jump to the ends.
 */
export async function expectTabsContract(page: Page, spec: TabsSpec) {
    const tablist = page.getByRole('tablist', { name: spec.name, exact: true });
    await expect(tablist).toHaveAttribute('aria-orientation', spec.orientation);
    const tabs = tablist.getByRole('tab');
    await expect(tabs).toHaveText([...spec.tabs]);

    const panels: Locator[] = [];
    for (const [index, label] of spec.tabs.entries()) {
        const tab = tabs.nth(index);
        const panel = byId(page, await requiredAttribute(tab, 'aria-controls'));
        await expect(panel).toHaveRole('tabpanel');
        await expect(panel).toHaveAttribute('aria-labelledby', await requiredAttribute(tab, 'id'));
        panels.push(panel);
        await expectTabState(tab, panel, label === spec.initial);
    }

    // The tablist is the tab stop; keyboard focus on it lands on the selected tab.
    const initial = spec.tabs.indexOf(spec.initial);
    await tablist.focus();
    await expect(tabs.nth(initial)).toBeFocused();

    const [next, previous] = spec.orientation === 'horizontal' ? ['ArrowRight', 'ArrowLeft'] : ['ArrowDown', 'ArrowUp'];
    const last = spec.tabs.length - 1;
    const wrapped = (initial + last) % spec.tabs.length;
    // Home and End are each pressed away from the end they jump to, so a key that does nothing
    // leaves focus on the wrong tab and fails. Which goes first depends on where the arrows left
    // focus: from the first tab only End moves, from anywhere else Home does.
    const ends: [string, number][] =
        wrapped === 0
            ? [
                  ['End', last],
                  ['Home', 0],
              ]
            : [
                  ['Home', 0],
                  ['End', last],
              ];
    const moves: [string, number][] = [
        [next, (initial + 1) % spec.tabs.length],
        [previous, initial],
        [previous, wrapped],
        ...ends,
    ];
    let selected = initial;
    for (const [key, index] of moves) {
        await page.keyboard.press(key);
        await expect(tabs.nth(index)).toBeFocused();
        await expectTabState(tabs.nth(index), panels[index], true);
        if (index !== selected) await expectTabState(tabs.nth(selected), panels[selected], false);
        selected = index;
    }
}

async function expectTabState(tab: Locator, panel: Locator, active: boolean) {
    await expect(tab).toHaveAttribute('aria-selected', String(active));
    await expect(tab).toHaveAttribute('data-state', active ? 'active' : 'inactive');
    await expect(panel).toHaveAttribute('data-state', active ? 'active' : 'inactive');
    if (active) await expect(panel).toBeVisible();
    else await expect(panel).toBeHidden();
}

/**
 * A single-selection toggle group: a radiogroup whose radios report `aria-checked`, where focus
 * landing on the group moves to the checked radio, the arrow keys move focus (not the selection)
 * with wrap-around, and Enter checks the focused radio.
 */
export async function expectRadioGroupContract(page: Page, spec: RadioGroupSpec) {
    const group = page.getByRole('radiogroup', { name: spec.name, exact: true });
    const radios = group.getByRole('radio');
    await expect(radios).toHaveText([...spec.options]);

    const initial = spec.options.indexOf(spec.initial);
    const expectChecked = async (index: number) => {
        for (const [i] of spec.options.entries()) {
            await expect(radios.nth(i)).toHaveAttribute('aria-checked', String(i === index));
            await expect(radios.nth(i)).toHaveAttribute('data-state', i === index ? 'on' : 'off');
        }
    };
    await expectChecked(initial);

    await group.focus();
    await expect(radios.nth(initial)).toBeFocused();

    const next = (initial + 1) % spec.options.length;
    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(next)).toBeFocused();
    await expectChecked(initial);

    await page.keyboard.press('Enter');
    await expectChecked(next);

    await page.keyboard.press('Home');
    await expect(radios.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(radios.nth(spec.options.length - 1)).toBeFocused();
    await expectChecked(next);
}

/**
 * A popover trigger: `aria-haspopup="dialog"`, and while open `aria-controls` names the dialog it
 * opened. Escape closes it and hands focus back to the trigger.
 */
export async function expectPopoverContract(page: Page, trigger: Locator) {
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('data-state', 'closed');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-state', 'open');
    const dialog = byId(page, await requiredAttribute(trigger, 'aria-controls'));
    await expect(dialog).toHaveRole('dialog');
    await expect(dialog).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
}
