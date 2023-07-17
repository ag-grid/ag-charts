import { AgEnterpriseCharts, AgPolarChartOptions } from 'ag-charts-enterprise'

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        {value: 56.9},
        {value: 22.5},
        {value: 6.8},
        {value: 8.5},
        {value: 2.6},
        {value: 1.9},
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'value',
        },
    ],
    background: {
        image: {
            width: 50,
            height: 50,
            right: 10,
            bottom: 10,
            url: getImageURL(),
        },
    },
};

const chart = AgEnterpriseCharts.create(options);

function getImageURL() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEq2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjMyIgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iMzIiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgdGlmZjpJbWFnZVdpZHRoPSIzMiIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMzIiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLjAiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLjAiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjEtMDItMDJUMTc6NTM6MjhaIgogICB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAyLTAyVDE3OjUzOjI4WiI+CiAgIDx4bXBNTTpIaXN0b3J5PgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InByb2R1Y2VkIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZmZpbml0eSBEZXNpZ25lciAoTm92IDExIDIwMjApIgogICAgICBzdEV2dDp3aGVuPSIyMDIxLTAyLTAyVDE3OjUzOjI4WiIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+XkwPBAAAAYBpQ0NQc1JHQiBJRUM2MTk2Ni0yLjEAACiRdZHPK0RRFMc/3hD5EWJhYfESVkaMmtgoIw0laYwy2Lx580vNm3m9N5Jsla2ixMavBX8BW2WtFJGSnbImNug5z0zNJHNv957P/d5zTueeC0o4rRt2ZR8YmZwVCgbUuci8Wv2MIrOZLro13TZHpqcnKTs+7qhw7Y3XzVXe799RF4vbOlTUCA/rppUTHheeXMmZLm8Lt+opLSZ8KtxjSYHCt64ezfOLy8k8f7lshUOjoDQJq8kSjpawnrIMYXk5nUZ6WS/U476kPp6ZnRHbIasdmxBBAqhMMMYofvoZkt2PFx+9cqJMfN9v/BRZidVlN1nFYokkKXL0iLos2eNiE6LHZaZZdfv/t692YsCXz14fgKonx3nrguot+N50nM9Dx/k+As8jXGSK8dkDGHwXfbOode5D4zqcXRa16A6cb0Dbg6lZ2q/kkaUkEvB6Ag0RaLmG2oV8zwr3HN9DeE2+6gp296Bb/BsXfwBIdWfYViN73wAAAAlwSFlzAAALEwAACxMBAJqcGAAAAddJREFUWIXtkztIW1Ecxn/34dDVQQeXgikpuDgY1NIgDm4GpEVBBxcHdRPUCh26FBEaF62big/UwUUJcQqSgG8i4gMXsWInNV18gFSj93QIgmhy77k317rkB3c453zn/333nPOHHDleGeXxIByJdgDFLtT9XltTnZAR6k/Gn4GPLgQYBBwFcIWlW720PrRaJCHdczuA2E5qy0f32qykPuBmAGMrqa3s3el+O5ueBmgC3th1TgrUhZu83guhfrK7V7GWmFMfWtWASVLh7RLIGCAciTYCVRYF7mI3+txvQyt3YA4wa/YG/ECryfo90Nxf618EFh0GcNyGRuH5Un/Z8bc/IkhNBs2G0s3lSwQQ3pORuOdsugfoMdH5gE2rYqpd83en4xues2mnd/4MsxPoA0YfBqrxVy0/7Pqaf71f55Y5SLahCKIAw0CLjdo+pdv6CvRwJOoBGkw0RuLXl/WCq3iC1KnIciIj0oH3QG+GdQG0F7bFY0DMhrk0Zm9A5O/u/Kjs7NgRUJFBs6/A1UsEEJ6pyU3vxJhVq30A1rIJkK4NRfHM1Lp3YsyXTWFZdFJ/UP0wUfJzoOxtaD74P8zTIqBJgJD8KrP1S/cGDoAhyf2n2QbIkePV+QdZcZGr6u0rEgAAAABJRU5ErkJggg==';
}
