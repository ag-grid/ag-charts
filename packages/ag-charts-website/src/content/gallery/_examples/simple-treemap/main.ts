import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AgTreemapSeriesOptions, TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([TreemapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'gdp',
            sizeKey: 'gdp',
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    const { datum } = params;
                    const continent = data.find((d) => d.children?.some((c) => c.name === datum.name))?.name;
                    const country = datum.name;
                    const gdpValue = datum.gdp;

                    if (continent && country && gdpValue) {
                        // This is a country tile
                        return {
                            title: `Continent: ${continent}`,
                            heading: country,
                            data: [{ label: 'GDP', value: `$${gdpValue.toLocaleString()} billion` }],
                        };
                    } else if (continent && !country) {
                        // This is a continent group
                        const totalGdp = datum.children?.reduce((sum: number, child: any) => sum + child.gdp, 0) || 0;
                        const countryCount = datum.children?.length || 0;
                        return {
                            title: continent,
                            data: [
                                { label: 'Countries', value: countryCount.toString() },
                                { label: 'Total GDP', value: `$${totalGdp.toLocaleString()} billion` },
                            ],
                        };
                    }

                    return undefined;
                },
            },
        } as AgTreemapSeriesOptions,
    ],
    title: {
        text: 'Countries by GDP',
    },
    formatter: {
        secondaryLabel: ({ value }) => `$${value.toLocaleString()}B`,
    },
};

AgCharts.create(options);
