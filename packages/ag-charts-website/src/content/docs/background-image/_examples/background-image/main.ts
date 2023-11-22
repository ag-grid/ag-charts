import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
        },
    ],
    background: {
        image: {
            width: 128,
            height: 96,
            right: 16,
            bottom: 16,
            url: getImageURL(),
        },
    },
};

const chart = AgCharts.create(options);

function getImageURL() {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2NCIgaGVpZ2h0PSIiIHZpZXdCb3g9IjAgMCA2NCA0OCIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgPHN0eWxlPgogICAgLmFxdWEgewogICAgICBmaWxsOiAjNTViNGM4OwogICAgfQoKICAgIC5vcmFuZ2UgewogICAgICBmaWxsOiAjZmY4YzAwOwogICAgfQoKICAgIC5yZWQgewogICAgICBmaWxsOiAjZjAwOwogICAgfQoKICAgIC5ncmV5IHsKICAgICAgZmlsbDogI2I0YmViZTsKICAgIH0KICA8L3N0eWxlPgogIAogIDxyZWN0IGNsYXNzPSJhcXVhIHJpZ2h0LTEiIHg9IjUxIiB5PSIxMCIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJhcXVhIHJpZ2h0LTEiIGQ9Ik01OCwxMGwtMTcsMGwtOCw4bDI1LDBsMCwtOFoiLz4KICA8cmVjdCBjbGFzcz0ib3JhbmdlIHJpZ2h0LTIiIHg9IjM2IiB5PSIyMiIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJvcmFuZ2UgcmlnaHQtMiIgZD0iTTQzLDMwbDAsLTcuOTk1bC0xNCwtMGwtOC4wMDgsNy45OTVsMjIuMDA4LDBaIi8+CiAgPHJlY3QgY2xhc3M9InJlZCByaWdodC0zIiB4PSIyNCIgeT0iMzQiIHdpZHRoPSI3IiBoZWlnaHQ9IjgiLz4KICA8cGF0aCBjbGFzcz0icmVkIHJpZ2h0LTMiIGQ9Ik0xMywzOC4wMWw0LC00LjAxbDE0LDBsMCw4bC0xOCwwbDAsLTMuOTlaIi8+CgogIDxyZWN0IGNsYXNzPSJncmV5IGxlZnQtMSIgeD0iMTEiIHk9IjYiIHdpZHRoPSI3IiBoZWlnaHQ9IjgiLz4KICA8cGF0aCBjbGFzcz0iZ3JleSBsZWZ0LTEiIGQ9Ik00MSwxMGwtNCw0bC0yNiwwbDAsLThsMzAsMGwwLDRaIi8+CiAgPHJlY3QgY2xhc3M9ImdyZXkgbGVmdC0yIiB4PSIxNiIgeT0iMTgiIHdpZHRoPSI3IiBoZWlnaHQ9IjgiLz4KICA8cGF0aCBjbGFzcz0iZ3JleSBsZWZ0LTIiIGQ9Ik0xNiwyNmw5LDBsOCwtOGwtMTcsLTBsMCw4WiIvPgogIDxyZWN0IGNsYXNzPSJncmV5IGxlZnQtMyIgeD0iNiIgeT0iMzAiIHdpZHRoPSI3IiBoZWlnaHQ9IjgiLz4KICA8cGF0aCBjbGFzcz0iZ3JleSBsZWZ0LTMiIGQ9Ik02LDM3Ljk4OGw3LDAuMDEybDcuOTkyLC04bC0xNC45OTIsLTAuMDQ3bC0wLDguMDM1WiIvPgoKPC9zdmc+';
}
