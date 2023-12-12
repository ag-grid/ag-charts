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
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDY0IDQ4IiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij4KICA8c3R5bGU+CiAgICAuYXF1YSB7CiAgICAgIGZpbGw6ICM1NWI0Yzg7CiAgICB9CgogICAgLm9yYW5nZSB7CiAgICAgIGZpbGw6ICNmZjhjMDA7CiAgICB9CgogICAgLnJlZCB7CiAgICAgIGZpbGw6ICNmMDA7CiAgICB9CgogICAgLmdyZXkgewogICAgICBmaWxsOiAjYjRiZWJlOwogICAgfQogIDwvc3R5bGU+CiAgCiAgPHJlY3QgY2xhc3M9ImFxdWEgcmlnaHQtMSIgeD0iNTEiIHk9IjEwIiB3aWR0aD0iNyIgaGVpZ2h0PSI4Ii8+CiAgPHBhdGggY2xhc3M9ImFxdWEgcmlnaHQtMSIgZD0iTTU4LDEwbC0xNywwbC04LDhsMjUsMGwwLC04WiIvPgogIDxyZWN0IGNsYXNzPSJvcmFuZ2UgcmlnaHQtMiIgeD0iMzYiIHk9IjIyIiB3aWR0aD0iNyIgaGVpZ2h0PSI4Ii8+CiAgPHBhdGggY2xhc3M9Im9yYW5nZSByaWdodC0yIiBkPSJNNDMsMzBsMCwtNy45OTVsLTE0LC0wbC04LjAwOCw3Ljk5NWwyMi4wMDgsMFoiLz4KICA8cmVjdCBjbGFzcz0icmVkIHJpZ2h0LTMiIHg9IjI0IiB5PSIzNCIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJyZWQgcmlnaHQtMyIgZD0iTTEzLDM4LjAxbDQsLTQuMDFsMTQsMGwwLDhsLTE4LDBsMCwtMy45OVoiLz4KCiAgPHJlY3QgY2xhc3M9ImdyZXkgbGVmdC0xIiB4PSIxMSIgeT0iNiIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJncmV5IGxlZnQtMSIgZD0iTTQxLDEwbC00LDRsLTI2LDBsMCwtOGwzMCwwbDAsNFoiLz4KICA8cmVjdCBjbGFzcz0iZ3JleSBsZWZ0LTIiIHg9IjE2IiB5PSIxOCIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJncmV5IGxlZnQtMiIgZD0iTTE2LDI2bDksMGw4LC04bC0xNywtMGwwLDhaIi8+CiAgPHJlY3QgY2xhc3M9ImdyZXkgbGVmdC0zIiB4PSI2IiB5PSIzMCIgd2lkdGg9IjciIGhlaWdodD0iOCIvPgogIDxwYXRoIGNsYXNzPSJncmV5IGxlZnQtMyIgZD0iTTYsMzcuOTg4bDcsMC4wMTJsNy45OTIsLThsLTE0Ljk5MiwtMC4wNDdsLTAsOC4wMzVaIi8+Cgo8L3N2Zz4=';
}
