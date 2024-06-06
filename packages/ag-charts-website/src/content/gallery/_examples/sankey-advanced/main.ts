// Source: https://secfilings.nasdaq.com/filingFrameset.asp?FilingID=13146567&RcvdDate=1/8/2019&CoName=NIKE%20INC&FormType=10-Q&View=html
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Nike Quarterly Statement',
    },
    data: [
        { from: 'N. America', to: 'Footwear', sales: 2245 },
        { from: 'EMEA', to: 'Footwear', sales: 1419 },
        { from: 'China', to: 'Footwear', sales: 1022 },
        { from: 'Asia & LATAM', to: 'Footwear', sales: 879 },
        { from: 'N. America', to: 'Apparel', sales: 1405 },
        { from: 'EMEA', to: 'Apparel', sales: 794 },
        { from: 'Asia & LATAM', to: 'Apparel', sales: 360 },
        { from: 'China', to: 'Apparel', sales: 490 },
        { from: 'N. America', to: 'Equipment', sales: 132 },
        { from: 'EMEA', to: 'Equipment', sales: 100 },
        { from: 'China', to: 'Equipment', sales: 32 },
        { from: 'Asia & LATAM', to: 'Equipment', sales: 59 },
        { from: 'Footwear', to: 'NIKE Brand', sales: 5565 },
        { from: 'Apparel', to: 'NIKE Brand', sales: 3049 },
        { from: 'Equipment', to: 'NIKE Brand', sales: 323 },
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
                alignment: 'center',
            },
        },
    ],
};

AgCharts.create(options);
