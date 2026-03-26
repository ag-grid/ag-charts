import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    enableRtl: true,
    title: {
        text: 'תרשים עמודות המציג נתוני מכירות חודשיים של מוצרים שונים בשנת אלפיים עשרים וארבע',
        wrapping: 'always',
        maxWidth: 400,
    },
    subtitle: {
        text: 'מכירות Sales Report מוצרים חודשיים Data Analysis נתונים',
        wrapping: 'on-space',
        maxWidth: 350,
    },
    footnote: {
        text: 'מקור: מחלקת מכירות\nעדכון: פברואר 2024',
    },
    data: [
        { month: 'ינואר', sales: 150 },
        { month: 'פברואר', sales: 230 },
        { month: 'מרץ', sales: 180 },
        { month: 'אפריל', sales: 290 },
        { month: 'מאי', sales: 210 },
        { month: 'יוני', sales: 260 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'מכירות',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'right',
        },
    },
};

AgCharts.create(options);
