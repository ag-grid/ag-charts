var data = [
    {
        quarter: 'Q1',
        petrol: 200,
        diesel: 100,
        electric: 50
    },
    {
        quarter: 'Q2',
        petrol: 300,
        diesel: 130,
        electric: 60
    },
    {
        quarter: 'Q3',
        petrol: 350,
        diesel: 160,
        electric: 70
    },
    {
        quarter: 'Q4',
        petrol: 400,
        diesel: 200,
        electric: 50
    }
];

var options = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Fuel Spending (2019)'
    },
    data: data,
    series: [{
        xKey: 'quarter',
        yKey: 'petrol',
        title: 'Petrol',
        marker: {
            shape: 'square',
            size: 10
        }
    }, {
        xKey: 'quarter',
        yKey: 'diesel',
        title: 'Diesel',
        stroke: 'black',
        marker: {
            size: 15,
            fill: 'gray',
            stroke: 'black'
        }
    }, {
        xKey: 'quarter',
        yKey: 'electric',
        title: 'Electric',
        stroke: '#8bc24a',
        marker: {
            shape: 'cross',
            size: 20,
            fill: '#8bc24a',
            stroke: '#658d36'
        }
    }]
};

agCharts.AgChart.create(options);