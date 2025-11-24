import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCharts, AgFlowProportionChartOptions, AgSankeySeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { SankeySeriesModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, SankeySeriesModule]);
const options: AgFlowProportionChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Global Renewable Energy Flow',
    },
    subtitle: {
        text: 'From Generation to End-Use Sectors (TWh)',
    },
    footnote: {
        text: 'Source: International Renewable Energy Agency (IRENA)',
    },
    data: [
        // Renewable sources to generation types
        { from: 'Solar', to: 'Solar PV', value: 1289 },
        { from: 'Solar', to: 'Solar Thermal', value: 134 },
        { from: 'Wind', to: 'Onshore Wind', value: 1942 },
        { from: 'Wind', to: 'Offshore Wind', value: 356 },
        { from: 'Hydro', to: 'Large Hydro', value: 3421 },
        { from: 'Hydro', to: 'Small Hydro', value: 389 },
        { from: 'Biomass', to: 'Solid Biomass', value: 478 },
        { from: 'Biomass', to: 'Biogas', value: 196 },
        { from: 'Geothermal', to: 'Geothermal Power', value: 97 },
        // Generation to grid
        { from: 'Solar PV', to: 'Electricity Grid', value: 1289 },
        { from: 'Solar Thermal', to: 'Electricity Grid', value: 134 },
        { from: 'Onshore Wind', to: 'Electricity Grid', value: 1942 },
        { from: 'Offshore Wind', to: 'Electricity Grid', value: 356 },
        { from: 'Large Hydro', to: 'Electricity Grid', value: 3421 },
        { from: 'Small Hydro', to: 'Electricity Grid', value: 389 },
        { from: 'Solid Biomass', to: 'Electricity Grid', value: 478 },
        { from: 'Biogas', to: 'Electricity Grid', value: 196 },
        { from: 'Geothermal Power', to: 'Electricity Grid', value: 97 },
        // Grid to distribution
        { from: 'Electricity Grid', to: 'Transmission', value: 7868 },
        { from: 'Electricity Grid', to: 'Distribution Loss', value: 434 },
        // Distribution to end sectors
        { from: 'Transmission', to: 'Industrial', value: 3147 },
        { from: 'Transmission', to: 'Residential', value: 2360 },
        { from: 'Transmission', to: 'Commercial', value: 1573 },
        { from: 'Transmission', to: 'Transportation', value: 788 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'value',
            sizeName: 'Energy (TWh)',
            node: {
                width: 40,
                alignment: 'left',
                strokeWidth: 3,
                strokeOpacity: 0.8,
                fillOpacity: 0.9,
            },
            link: {
                fillOpacity: 0.2,
                strokeWidth: 0.5,
            },
            label: {
                enabled: true,
                border: {
                    enabled: true,
                    strokeWidth: 1,
                    stroke: 'black',
                    strokeOpacity: 0.8,
                },
                fill: 'white',
                color: 'black',
                fillOpacity: 0.6,
            },
            tooltip: {
                renderer: ({ datum }: AgSankeySeriesTooltipRendererParams<any, any>) => {
                    if (!datum) {
                        return {};
                    }

                    const value = datum.value;

                    const totalEnergy = 8302; // Total renewable energy in TWh
                    const percentage = ((value / totalEnergy) * 100).toFixed(1);

                    // Contextual information based on flow type
                    let contextLabel = 'Flow Type';
                    let contextValue = 'Energy Transfer';

                    // Source categorization
                    const renewableSources = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal'];
                    const generationTypes = [
                        'Solar PV',
                        'Solar Thermal',
                        'Onshore Wind',
                        'Offshore Wind',
                        'Large Hydro',
                        'Small Hydro',
                        'Solid Biomass',
                        'Biogas',
                        'Geothermal Power',
                    ];
                    const endSectors = ['Industrial', 'Residential', 'Commercial', 'Transportation'];

                    if (renewableSources.includes(datum.from) && generationTypes.includes(datum.to)) {
                        contextLabel = 'Stage';
                        contextValue = 'Source → Generation';
                    } else if (generationTypes.includes(datum.from) && datum.to === 'Electricity Grid') {
                        contextLabel = 'Stage';
                        contextValue = 'Generation → Grid';
                    } else if (datum.from === 'Electricity Grid') {
                        if (datum.to === 'Distribution Loss') {
                            contextLabel = 'Type';
                            contextValue = 'System Loss';
                        } else {
                            contextLabel = 'Stage';
                            contextValue = 'Grid → Transmission';
                        }
                    } else if (datum.from === 'Transmission' && endSectors.includes(datum.to)) {
                        contextLabel = 'Stage';
                        contextValue = 'Distribution → End Use';
                    }

                    return {
                        title: `${datum.from} → ${datum.to}`,
                        data: [
                            {
                                label: 'Energy Flow',
                                value: `${value.toLocaleString()} TWh`,
                            },
                            {
                                label: 'Share of Total',
                                value: `${percentage}%`,
                            },
                            {
                                label: contextLabel,
                                value: contextValue,
                            },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
