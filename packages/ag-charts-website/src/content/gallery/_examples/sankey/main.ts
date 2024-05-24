// Source: https://secfilings.nasdaq.com/filingFrameset.asp?FilingID=13146567&RcvdDate=1/8/2019&CoName=NIKE%20INC&FormType=10-Q&View=html
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Nike Quarterly Statement',
    },
    data: [
        { from: 'Footwear', to: 'N. America', sales: 2245 },
        { from: 'Footwear', to: 'EMEA', sales: 1419 },
        { from: 'Footwear', to: 'China', sales: 1022 },
        { from: 'Footwear', to: 'Asia & LATAM', sales: 879 },
        { from: 'Apparel', to: 'N. America', sales: 1405 },
        { from: 'Apparel', to: 'EMEA', sales: 794 },
        { from: 'Apparel', to: 'Asia & LATAM', sales: 360 },
        { from: 'Apparel', to: 'China', sales: 490 },
        { from: 'Equipment', to: 'N. America', sales: 132 },
        { from: 'Equipment', to: 'EMEA', sales: 100 },
        { from: 'Equipment', to: 'China', sales: 32 },
        { from: 'Equipment', to: 'Asia & LATAM', sales: 59 },
        { from: 'N. America', to: 'NIKE Brand', sales: 3782 },
        { from: 'EMEA', to: 'NIKE Brand', sales: 2313 },
        { from: 'China', to: 'NIKE Brand', sales: 1544 },
        { from: 'Asia & LATAM', to: 'NIKE Brand', sales: 1298 },
        { from: 'Global', to: 'NIKE Brand', sales: 9 },
        { from: 'NIKE Brand', to: 'Revenues', sales: 8946 },
        { from: 'Converse', to: 'Revenues', sales: 425 },
        { from: 'Corporate', to: 'Revenues', sales: 3 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'sales',
            sizeName: 'Sales',
            node: {
                justify: 'center',
            },
        },
    ],
};

AgCharts.create(options);
