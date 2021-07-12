var options = {
    container: document.getElementById('myChart'),
    autoSize: true,
    title: {
        text: 'Weight vs Height (by gender)'
    },
    subtitle: {
        text: 'with name labels'
    },
    series: [
        {
            type: 'scatter',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            fill: 'rgba(227,111,106,0.71)',
            stroke: '#9f4e4a',
            marker: {
                shape: 'square',
                size: 6,
                maxSize: 30
            },
            label: {
                enabled: true
            }
        },
        {
            type: 'scatter',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            fill: 'rgba(123,145,222,0.71)',
            stroke: '#56659b',
            marker: {
                size: 6,
                maxSize: 30
            },
            label: {
                enabled: true
            }
        }
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Height'
            },
            label: {
                rotation: 45,
                formatter: function(params) {
                    return params.value + 'cm';
                }
            }
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Weight'
            },
            label: {
                formatter: function(params) {
                    return params.value + 'kg';
                }
            }
        }
    ]
};

var chart = agCharts.AgChart.create(options);

function updateFontSize(event) {
    var value = +event.target.value;

    options.series[0].label.fontSize = value;
    options.series[1].label.fontSize = value;
    agCharts.AgChart.update(chart, options);

    document.getElementById('fontSizeSliderValue').innerHTML = String(value);
}