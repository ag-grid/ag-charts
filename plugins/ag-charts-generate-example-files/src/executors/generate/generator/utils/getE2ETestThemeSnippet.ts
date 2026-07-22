export const E2E_THEME_START = '/** E2E THEME START **/';
export const E2E_THEME_END = '/** E2E THEME END **/';

export const getE2ETestThemeSnippet = ({ chartAPI }: { chartAPI?: string } = {}) =>
    `${E2E_THEME_START}
{
${chartAPI == null ? `` : `const __chartAPI = ${chartAPI};`}

if (window && window.location.hash.includes('e2e=true')) {
    __chartAPI.optionsMutationFn = function update(options, preset) {
        const nextOptions = { ...options };
        const theme = options.theme;
        const overrides = {
            axisLineColor: '#b4b6b6',
            borderColor: 'rgba(24, 29, 31, 0.15)',
            fontFamily: 'Verdana, sans-serif',
            focusShadow: '0 0 0 3px var(--ag-charts-accent-color)',
            gridLineColor: '#e8e8e9',
        }
        if (isAgThemeOrUndefined(theme)) {
            nextOptions.theme = {
                baseTheme: preset === 'price-volume' ? 'ag-financial' : theme,
                params: overrides,
            };
        } else if (typeof theme === 'object' && isAgThemeOrUndefined(theme.baseTheme)) {
            nextOptions.theme = {
                ...options.theme,
                params: { ...(options.theme.params || {}), ...overrides },
                baseTheme: preset === 'price-volume' ? 'ag-financial' : theme,
            };
        }

        return nextOptions;
    };

    const applyE2ETestTheme = () => {
        const charts = document.querySelectorAll('[data-ag-charts]');
        charts.forEach((element) => {
            const chart = __chartAPI.getInstance(element.parentElement);
            if (chart == null) return;
            // This is just needed to trigger the theme update
            chart.update(chart.getOptions());
        });
        return charts.length !== 0;
    };

    applyE2ETestTheme();

    // Read-only scene-graph capture for e2e snapshot diffing. The browser only serialises the raw
    // subtrees (structured-clone-safe); the Playwright (Node) side keys and measures them via the
    // shared sampler, so the roots below must mirror createSceneGeometrySampler's live roots.
    const serializeLiveNode = (node) => {
        const datum = node.datum;
        let datumId;
        if (datum != null && typeof datum !== 'object') {
            datumId = String(datum);
        } else {
            const value = datum?.xValue ?? datum?.angleValue ?? datum?.itemId ?? datum?.tickId ?? datum?.index;
            if (value != null) datumId = String(value);
        }
        return {
            name: node.name,
            datumId,
            state: node.serialize(),
            children: typeof node.children === 'function' ? Array.from(node.children(), serializeLiveNode) : [],
        };
    };

    const captureSceneRoots = (chart) => {
        const series = (chart.series ?? []).map((s) => {
            const root = { content: serializeLiveNode(s.contentGroup), labels: serializeLiveNode(s.labelGroup) };
            if (s.backgroundGroup != null) root.background = serializeLiveNode(s.backgroundGroup);
            return root;
        });
        const axes = (chart.axes ?? []).map((a) => ({
            position: a.position ?? 'unknown',
            axisGroup: serializeLiveNode(a.axisGroup),
            grid: serializeLiveNode(a.gridGroup),
        }));
        const legends = [];
        for (const entry of chart.modulesManager.legends()) {
            if (entry.legend?.group != null) {
                legends.push({ legendType: entry.legendType, group: serializeLiveNode(entry.legend.group) });
            }
        }
        const roots = { series, axes, legends };
        if (chart.titleGroup != null) roots.captions = serializeLiveNode(chart.titleGroup);
        const clipRect = chart.lastUpdateClipRect;
        if (clipRect != null) {
            roots.clipRect = { x: clipRect.x, y: clipRect.y, width: clipRect.width, height: clipRect.height };
        }
        return roots;
    };

    const captureScenes = () => {
        const out = [];
        document.querySelectorAll('[data-ag-charts]').forEach((element) => {
            const chart = __chartAPI.getInstance(element.parentElement)?.chart;
            if (chart == null) return;
            out.push(captureSceneRoots(chart));
        });
        // Normalise to plain JSON (drops functions/undefined) so it survives page.evaluate's clone.
        return JSON.parse(JSON.stringify(out));
    };

    window.agE2E = Object.assign(window.agE2E || {}, { captureScenes });
}

}
${E2E_THEME_END}`;
