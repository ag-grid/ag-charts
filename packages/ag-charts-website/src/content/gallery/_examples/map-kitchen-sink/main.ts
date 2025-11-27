import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgTopologyChartOptions,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    MapShapeSeriesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getCurrencyData } from './data';
import { cables, capitals, topology } from './topology';

ModuleRegistry.registerModules([
    LegendModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    MapShapeSeriesModule,
    ZoomModule,
]);
const currencyLayers: Record<string, { title: string; symbol: string; countries: number }> = {
    euro: { title: 'Euro (€)', symbol: '€', countries: 20 },
    dollar: { title: 'Dollar ($)', symbol: '$', countries: 11 },
    franc: { title: 'Franc', symbol: 'Fr', countries: 8 },
    pound: { title: 'Pound Sterling (£)', symbol: '£', countries: 4 },
    dinar: { title: 'Dinar', symbol: 'د', countries: 11 },
    peso: { title: 'Peso', symbol: '₱', countries: 8 },
    rupee: { title: 'Rupee', symbol: '₹', countries: 7 },
    rial: { title: 'Rial', symbol: '﷼', countries: 3 },
};

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Global Currency Zones & Financial Centers',
    },
    subtitle: {
        text: 'Major world currencies, stock exchanges, and submarine cable infrastructure',
    },
    topology,
    series: [
        {
            type: 'map-shape-background',
            fillOpacity: 0.7,
            strokeWidth: 0.5,
            strokeOpacity: 0.7,
        },
        {
            type: 'map-shape',
            title: 'Other Currency',
            legendItemName: 'Currencies',
            showInLegend: true,
            data: topology.features
                .map((t: any) => ({
                    name: t.properties.name,
                    currency: 'Various local currencies',
                }))
                .filter(({ name }: { name: string }) => {
                    // Check if this country is already included in any currency layer
                    return !Object.keys(currencyLayers).some((currency) =>
                        getCurrencyData(currency).some((d) => d.name === name)
                    );
                }),
            idKey: 'name',
            fill: '#DBE8F7',
            strokeWidth: 0.5,
            strokeOpacity: 0.3,
            highlight: {
                highlightedItem: {
                    fillOpacity: 0.6,
                },
            },
        },
        ...Object.entries(currencyLayers).map(([currency, { title, symbol, countries }]) => ({
            type: 'map-shape' as const,
            legendItemName: 'Currencies',
            showInLegend: false,
            title,
            idKey: 'name',
            data: getCurrencyData(currency).map((d) => ({
                ...d,
                symbol,
                countriesUsing: countries,
            })),
            fillOpacity: 0.6,
            strokeWidth: 0.5,
            strokeOpacity: 0.8,
        })),
        {
            type: 'map-line',
            topology: cables,
            legendItemName: 'Submarine Cables',
            data: cables.features.map((t: any) => {
                return {
                    name: t.properties.name,
                    type: 'Submarine Cable',
                    purpose: 'Global Internet Infrastructure',
                };
            }),
            idKey: 'name',
            title: 'Submarine Cables',
            stroke: '#666',
            strokeOpacity: 0.4,
            lineDash: [2, 2],
            highlight: {
                highlightedItem: {
                    strokeWidth: 1.5,
                },
            },
        },
        {
            type: 'map-marker',
            topology: capitals,
            legendItemName: 'Capital Cities',
            showInLegend: false,
            data: capitals.features
                .map((t: any) => {
                    return {
                        name: t.properties.city,
                        country: t.properties.country || 'Unknown',
                        type: 'Capital City',
                    };
                })
                .filter(({ name }: { name: string }) => name != null),
            idKey: 'name',
            title: 'Capital City',
            topologyIdKey: 'city',
            size: 3,
            fillOpacity: 0.6,
            strokeOpacity: 0.8,
            tooltip: {
                renderer: ({ datum }) => ({
                    data: [{ label: `Country`, value: datum.country }],
                }),
            },
        },
        {
            type: 'map-marker',
            legendItemName: 'Stock Exchanges',
            title: 'Stock Exchange',
            data: [
                {
                    name: 'NYSE',
                    city: 'New York',
                    lat: 40.707,
                    long: -74.011,
                    marketCap: '$25.85T',
                    tradingHours: '9:30 AM - 4:00 PM EST',
                },
                {
                    name: 'TSE',
                    city: 'Tokyo',
                    lat: 35.681,
                    long: 139.777,
                    marketCap: '$6.54T',
                    tradingHours: '9:00 AM - 3:00 PM JST',
                },
                {
                    name: 'LSE',
                    city: 'London',
                    lat: 51.515,
                    long: -0.09,
                    marketCap: '$3.83T',
                    tradingHours: '8:00 AM - 4:30 PM GMT',
                },
                {
                    name: 'HKEX',
                    city: 'Hong Kong',
                    lat: 22.32,
                    long: 114.171,
                    marketCap: '$5.43T',
                    tradingHours: '9:30 AM - 4:00 PM HKT',
                },
                {
                    name: 'NSE',
                    city: 'Mumbai',
                    lat: 19.076,
                    long: 72.877,
                    marketCap: '$3.73T',
                    tradingHours: '9:15 AM - 3:30 PM IST',
                },
            ],
            latitudeKey: 'lat',
            longitudeKey: 'long',
            labelKey: 'name',
            labelName: 'Exchange',
            label: {
                enabled: true,
                border: {
                    enabled: true,
                },
                padding: { top: 2, right: 5, bottom: 2, left: 5 },
                fill: '#888',
                fillOpacity: 0.7,
                cornerRadius: 3,
            },
            shape: 'pin',
            size: 35,
            fill: '#EF5452',
            fillOpacity: 0.9,
            strokeWidth: 2,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: `${datum.name} (Stock Exchange)`,
                    data: [
                        { label: `City`, value: datum.city },
                        { label: `Market Cap`, value: datum.marketCap },
                        { label: 'Trading Hours', value: datum.tradingHours },
                    ],
                }),
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'right',
        item: {
            paddingY: 5,
            marker: {
                size: 12,
            },
        },
    },
    zoom: {
        enabled: true,
    },
};

AgCharts.create(options);
