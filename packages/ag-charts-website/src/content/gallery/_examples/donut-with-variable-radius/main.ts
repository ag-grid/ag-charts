import { DonutSeriesModule, LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([DonutSeriesModule, LegendModule]);
const data = getData();
const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    notation: 'compact',
});

// Calculate total value from actual data
const totalValue = data.categories.reduce((sum, item) => sum + item.value, 0);
const formattedTotal = currencyFormatter.format(totalValue);

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Oxford Street Department Store',
    },
    subtitle: {
        text: 'Revenue Distribution vs. Profit Margin',
    },
    series: [
        {
            data: data.categories,
            type: 'donut',
            calloutLabelKey: 'category',
            angleKey: 'value',
            radiusKey: 'profitMargin',
            innerRadiusRatio: 0.35,
            fillOpacity: 0.85,
            innerLabels: [
                {
                    text: 'Total Revenue',
                    spacing: 4,
                },
                {
                    text: formattedTotal,
                    spacing: 4,
                },
            ],
            cornerRadius: 5,
            strokeWidth: 1,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    const value = params.datum[params.angleKey!] as number;
                    const profitMargin = params.datum[params.radiusKey!] as number;
                    const category = params.datum[params.calloutLabelKey || 'category'];
                    const percentage = ((value / totalValue) * 100).toFixed(1);
                    const formattedValue = currencyFormatter.format(value);
                    const marginPercent = (profitMargin * 100).toFixed(0);

                    // Determine department based on category
                    let department = 'Other';
                    if (['Smartphones', 'Laptops', 'Cameras'].includes(category)) {
                        department = 'Electronics';
                    } else if (["Men's", "Women's", "Children's"].includes(category)) {
                        department = 'Clothing';
                    } else if (['Furniture', 'Appliances', 'Decor'].includes(category)) {
                        department = 'Home';
                    }

                    return {
                        heading: formattedValue,
                        title: `${category} (${department})`,
                        data: [
                            {
                                label: 'Revenue Share',
                                value: `${percentage}%`,
                            },
                            {
                                label: 'Profit Margin',
                                value: `${marginPercent}%`,
                            },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        position: 'right',
        spacing: 30,
    },
};

AgCharts.create(options);
