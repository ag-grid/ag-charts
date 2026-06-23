import type { AreMutuallyExclusive } from 'ag-charts-core';

// EXPERIMENTAL WORKAROUND: the bundled TypeScript lib.dom `FocusOptions` does not yet declare the
// experimental `focusVisible` option of `HTMLElement.focus()`. We extend it locally rather than
// augmenting the global type, so the assertion below keeps guarding the workaround.
//
// This assertion stops compiling once lib.dom gains a native `focusVisible`. When that happens,
// delete `FocusOptionsExperimental` and use `FocusOptions` directly at every call site.
true satisfies AreMutuallyExclusive<keyof FocusOptions, 'focusVisible'>;

export type FocusOptionsExperimental = FocusOptions & { focusVisible?: boolean };
