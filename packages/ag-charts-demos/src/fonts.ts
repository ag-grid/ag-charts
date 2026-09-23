import { isDeterministicLoad } from './deterministicMode';

/** How long an e2e run's first render waits for the declared web fonts before going ahead with fallbacks. */
export const FONT_LOAD_TIMEOUT_MS = 3000;

/**
 * What the demos app awaits before a demo's first render: `waitForDeclaredFonts` in an e2e run
 * (`deterministic` defaults to the page's deterministic switch), nothing on a normal visit, which
 * renders at once and so never touches the document's fonts.
 */
export function beforeFirstRender(deterministic = isDeterministicLoad()): Promise<void> {
    return deterministic ? waitForDeclaredFonts() : Promise.resolve();
}

/**
 * Resolves once the web fonts the document declares are loaded, or after `timeoutMs`, whichever
 * comes first. The demos app awaits it only in an e2e run, when the page is loaded with the
 * deterministic switch (`beforeFirstRender`); a normal visit never waits.
 *
 * A chart measures its labels on a canvas, which never triggers a font download, and lays them
 * out with whatever font the canvas has at that moment. A page that renders its charts while a
 * web font is still downloading lays them out with the fallback font's metrics and re-lays them
 * out once the font arrives, and the two passes do not always land on the same pixels as a
 * single pass in the final font. A visitor sees the same chart either way once the font is in, so
 * holding their first render back for it would only delay the page. The parity harness, though,
 * compares the React demo pixel for pixel with its framework ports, whose first layout already
 * sees the fonts, and with itself; it needs the first layout in the final fonts. Waiting here,
 * after the demo's stylesheet has declared its `@font-face` rules and before anything renders,
 * gives it that.
 *
 * What is loaded is exactly what the page would load anyway, only earlier: the default face of
 * every declared family, for Latin text, which is the face a chart asks for. The other weights,
 * styles and script subsets are left to the text that uses them, so this changes when the fonts
 * arrive and not which ones do. A face that fails to load, or has not arrived by the timeout,
 * leaves the page to render with its fallbacks as it would have anyway. A stylesheet whose faces
 * are not declared yet (a dev server injecting CSS from script fetches its `@import`s later)
 * leaves nothing to wait for.
 */
export async function waitForDeclaredFonts(timeoutMs = FONT_LOAD_TIMEOUT_MS): Promise<void> {
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (!fonts || typeof fonts.load !== 'function') return;

    const families = new Set<string>();
    fonts.forEach((face) => families.add(face.family.replace(/^["']|["']$/g, '')));
    if (families.size === 0) return;

    const loads = Promise.allSettled([...families].map((family) => fonts.load(`16px "${family}"`)));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs);
    });
    try {
        await Promise.race([loads, timeout]);
    } finally {
        clearTimeout(timer);
    }
}
