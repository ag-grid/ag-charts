import Vue from 'vue';

import 'ag-charts-enterprise';
import { AgChartsVue } from 'ag-charts-vue';

// Series type data options
let start = [120, 150, 130, 140, 80];
let variance = 20;
let offset = 0;
let length = 8;
let seed = 1234;

const barOptions = {
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
            },
        },
    ],
};

const lineOptions = {
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};

const areaOptions = {
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};

const donutOptions = {
    series: [
        {
            type: 'pie',
            title: {
                text: 'One',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'one',
            outerRadiusRatio: 0.6,
        },
        {
            type: 'donut',
            title: {
                text: 'Two',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'two',
            innerRadiusRatio: 0.7,
            showInLegend: false,
        },
    ],
    axes: [],
};

function getGeneratedData() {
    return getData(start, variance, offset, length, seed);
}

const ChartExample = {
    template: `
        <div style="display: flex; flex-direction: column">
            <div style="flex: none; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 0.5em">
                <div style="display: flex; flex-direction: row; justify-content: center; gap: 0.5em">
                    <button v-on:click="changeSeriesBar()">Bar</button>
                    <button v-on:click="changeSeriesLine()">Line</button>
                    <button v-on:click="changeSeriesArea()">Area</button>
                    <button v-on:click="changeSeriesDonut()">Pie &amp; Donut</button>
                </div>
            </div>
            <div style="flex: none; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 0.5em">
                <div style="display: flex; flex-direction: row; justify-content: center; gap: 0.5em">
                    <button class="animation-data-updates__action" v-on:click="add()" v-bind:disabled="tickingUpdates">Add</button>
                    <button class="animation-data-updates__action" v-on:click="remove()" v-bind:disabled="tickingUpdates">Remove</button>
                    <button class="animation-data-updates__action" v-on:click="update()" v-bind:disabled="tickingUpdates">Update</button>
                </div>
                <button class="animation-data-updates__action" v-on:click="addRemoveUpdate()">Add &amp; Remove &amp; Update</button>
                <button class="animation-data-updates__toggle-ticking" v-on:click="toggleTickingUpdates()">
                    {{ tickingUpdates ? 'Stop Ticking Updates' : 'Start Ticking Updates' }}
                </button>
            </div>
            <ag-charts-vue
                ref="agCharts"
                :options="options"
            />
        </div>
    `,
    components: {
        'ag-charts-vue': AgChartsVue,
    },
    data() {
        return {
            options: {
                animation: {
                    enabled: true,
                },
                data: getGeneratedData(),
                ...barOptions,
            },
            tickingUpdates: false,
            interval: undefined,
        };
    },
    methods: {
        changeSeriesBar() {
            const options = { ...this.options };

            variance = 20;
            offset = 0;
            length = 8;
            seed = 1234;
            options.series = barOptions.series;
            options.axes = barOptions.axes;
            options.data = getGeneratedData();

            this.options = options;
        },
        changeSeriesLine() {
            const options = { ...this.options };

            variance = 4;
            offset = 0;
            length = 30;
            seed = 1234;
            options.series = lineOptions.series;
            options.axes = lineOptions.axes;
            options.data = getGeneratedData();

            this.options = options;
        },
        changeSeriesArea() {
            const options = { ...this.options };

            variance = 20;
            offset = 0;
            length = 30;
            seed = 1234;
            options.series = areaOptions.series;
            options.axes = areaOptions.axes;
            options.data = getGeneratedData();

            this.options = options;
        },
        changeSeriesDonut() {
            const options = { ...this.options };

            variance = 30;
            offset = 0;
            length = 6;
            seed = 1234;
            options.series = donutOptions.series;
            options.axes = donutOptions.axes;
            options.data = getGeneratedData();

            this.options = options;
        },
        updateTick() {
            const options = { ...this.options };

            offset++;
            options.data = getGeneratedData();

            this.options = options;
        },
        toggleTickingUpdates() {
            this.tickingUpdates = !this.tickingUpdates;

            if (this.tickingUpdates) {
                this.interval = setInterval(this.updateTick.bind(this), 2000);

                const options = { ...this.options };

                offset++;
                options.data = getGeneratedData();

                this.options = options;
            } else {
                clearInterval(this.interval);
                this.interval = undefined;
            }
        },
        add() {
            const options = { ...this.options };

            offset++;
            length++;
            options.data = getGeneratedData();

            this.options = options;
        },
        remove() {
            const options = { ...this.options };

            length = Math.max(0, length - 1);
            options.data = getGeneratedData();

            this.options = options;
        },
        update() {
            const options = { ...this.options };

            seed = Math.floor(random() * 1000);
            options.data = getGeneratedData();

            this.options = options;
        },
        addRemoveUpdate() {
            const options = { ...this.options };

            offset++;
            seed = Math.floor(random() * 1000);
            options.data = getGeneratedData();

            this.options = options;
        },
    },
};

new Vue({
    el: '#app',
    components: {
        'my-component': ChartExample,
    },
});
