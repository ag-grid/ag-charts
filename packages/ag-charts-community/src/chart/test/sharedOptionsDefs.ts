import { expect } from 'vitest';

// Plugin option schemas are validated twice, in the chart pass and the plugin pass. Both must resolve
// to the same object — separate copies drift, and the stricter one clears values the other accepts.
export function expectSharedOptionsDefs(name: string, pluginOptions: unknown, commonOptions: unknown) {
    // Guard against a vacuous pass: two `undefined` reads would otherwise satisfy the identity check.
    expect(pluginOptions, `\`${name}\` plugin options must be a populated schema`).toEqual(expect.any(Object));
    expect(Object.keys(pluginOptions as object).length).toBeGreaterThan(0);

    expect(
        pluginOptions === commonOptions,
        `\`${name}\` options must be the same object in the plugin module and in commonChartOptionsDefs, ` +
            `so the two validation passes cannot disagree`
    ).toBe(true);
}
