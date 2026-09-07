// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

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

function syncControls() {
    const tooltip = options.title?.tooltip;
    const visible = tooltip?.visible ?? (tooltip?.text != null || tooltip?.renderer != null ? 'always' : 'auto');
    visibilityRadios[visible].checked = true;

    // A visibility-only tooltip carries no content, so no content option is applied.
    if (tooltip?.text == null && tooltip?.renderer == null) {
        for (const radio of Object.values(contentRadios)) {
            radio.checked = false;
        }
    }
}

visibilityRadios.always.addEventListener('change', () => {
    options.title!.tooltip = { visible: 'always' };
    options.subtitle!.tooltip = { visible: 'always' };
    chart.update(options);
    syncControls();
});

visibilityRadios.never.addEventListener('change', () => {
    options.title!.tooltip = { visible: 'never' };
    options.subtitle!.tooltip = { visible: 'never' };
    chart.update(options);
    syncControls();
});

visibilityRadios.auto.addEventListener('change', () => {
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
