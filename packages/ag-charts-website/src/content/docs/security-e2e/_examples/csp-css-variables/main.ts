import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    styleNonce: '9f3c21a8',
    animation: { enabled: false },
    data: [
        { month: 'Jan', sales: 162000 },
        { month: 'Mar', sales: 302000 },
        { month: 'May', sales: 800000 },
        { month: 'Jul', sales: 1254000 },
        { month: 'Sep', sales: 950000 },
        { month: 'Nov', sales: 200000 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'sales', fill: 'var(--my-brand-colour)' }],
};

AgCharts.create(options);

// A strict `script-src` blocks inline `onclick` attributes, so the control is wired up here.
document.getElementById('toggleVariable')?.addEventListener('click', () => {
    const current = document.body.style.getPropertyValue('--my-brand-colour');
    document.body.style.setProperty('--my-brand-colour', current === '#d33b2b' ? '#2b7cd3' : '#d33b2b');
});
