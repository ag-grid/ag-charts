// @ag-skip-fws
import { AgCaptionTooltipOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Quarterly Revenue by Product Line for the Financial Year',
    },
    subtitle: {
        text: 'Fiscal Year 2025',
    },
    footnote: {
        text: 'Excludes returns and refunds',
    },
    data: [
        { quarter: 'Q1', widgets: 420, gadgets: 310 },
        { quarter: 'Q2', widgets: 490, gadgets: 350 },
        { quarter: 'Q3', widgets: 530, gadgets: 410 },
        { quarter: 'Q4', widgets: 610, gadgets: 460 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'widgets', yName: 'Widgets' },
        { type: 'bar', xKey: 'quarter', yKey: 'gadgets', yName: 'Gadgets' },
    ],
};

const chart = AgCharts.create(options);

const visibilityRadios: Record<'auto' | 'always' | 'never', HTMLInputElement> = {
    always: document.getElementById('visible-always') as HTMLInputElement,
    never: document.getElementById('visible-never') as HTMLInputElement,
    auto: document.getElementById('visible-auto') as HTMLInputElement,
};

const contentRadios: Record<string, HTMLInputElement> = {
    customText: document.getElementById('custom-text') as HTMLInputElement,
    renderer: document.getElementById('renderer') as HTMLInputElement,
    emptyRenderer: document.getElementById('empty-renderer') as HTMLInputElement,
    undefinedRenderer: document.getElementById('undefined-renderer') as HTMLInputElement,
};

const truncateButton = document.getElementById('truncate') as HTMLButtonElement;
const resetButton = document.getElementById('reset') as HTMLButtonElement;

// Mirrors how the chart resolves visibility: content with no explicit option shows always.
function effectiveVisible(tooltip: AgCaptionTooltipOptions | undefined) {
    return tooltip?.visible ?? (tooltip?.text != null || tooltip?.renderer != null ? 'always' : 'auto');
}

function syncControls() {
    const tooltip = options.title?.tooltip;
    // Each visibility option applies to both captions, so the group only shows one as applied
    // while the two agree - a content option changes the title's effective visibility alone.
    const titleVisible = effectiveVisible(tooltip);
    const subtitleVisible = effectiveVisible(options.subtitle?.tooltip);
    for (const [option, radio] of Object.entries(visibilityRadios)) {
        radio.checked = titleVisible === subtitleVisible && option === titleVisible;
    }

    // A visibility-only tooltip carries no content, so no content option is applied.
    if (tooltip?.text == null && tooltip?.renderer == null) {
        for (const radio of Object.values(contentRadios)) {
            radio.checked = false;
        }
    }
}

// Listen for clicks rather than changes: a content option can leave a visibility segment checked
// while the captions no longer match it, and an already-checked radio emits no change event.
visibilityRadios.always.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'always' };
    options.subtitle!.tooltip = { visible: 'always' };
    chart.update(options);
    syncControls();
});

visibilityRadios.never.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'never' };
    options.subtitle!.tooltip = { visible: 'never' };
    chart.update(options);
    syncControls();
});

visibilityRadios.auto.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'auto' };
    options.subtitle!.tooltip = { visible: 'auto' };
    chart.update(options);
    syncControls();
});

contentRadios.customText.addEventListener('change', () => {
    options.title!.tooltip = { text: 'Revenue in USD from internal CRM' };
    chart.update(options);
    syncControls();
});

contentRadios.renderer.addEventListener('change', () => {
    options.title!.tooltip = {
        renderer: ({ text }) => `<b>${text}</b><br/>Source: Internal CRM`,
    };
    chart.update(options);
    syncControls();
});

contentRadios.emptyRenderer.addEventListener('change', () => {
    options.title!.tooltip = {
        renderer: () => '',
    };
    chart.update(options);
    syncControls();
});

contentRadios.undefinedRenderer.addEventListener('change', () => {
    options.title!.tooltip = {
        visible: 'always',
        renderer: () => undefined,
    };
    options.subtitle!.tooltip = {
        visible: 'always',
        text: 'Subtitle fallback text',
        renderer: () => undefined,
    };
    chart.update(options);
    syncControls();
});

truncateButton.addEventListener('click', () => {
    options.title!.maxWidth = 200;
    options.title!.tooltip = undefined;
    chart.update(options);
    syncControls();
});

resetButton.addEventListener('click', () => {
    options.title!.tooltip = undefined;
    options.title!.maxWidth = undefined;
    options.subtitle!.tooltip = undefined;
    chart.update(options);
    syncControls();
});
