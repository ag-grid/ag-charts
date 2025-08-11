import { Canvas } from 'skia-canvas';

const canvas = new Canvas(600, 600);
const ctx = canvas.getContext('2d');

const seriesAreaSize = 400;
const seriesX0 = (canvas.width - seriesAreaSize) / 2;
const seriesY0 = (canvas.height - seriesAreaSize) / 2;
const markerSize = 10;

function calculateOpacity(x0, y0, x1, y1) {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.ceil(x1);
    y1 = Math.ceil(y1);

    if (x0 >= x1 || y0 >= y1) {
        return 0;
    }

    const imageData = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const { data, width, height } = imageData;
    let opacitySum = 0;
    let opacityTotal = 0;
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            const i = (y * width + x) << 2;
            const opacity = data[i + 3] / 255;

            opacitySum += opacity;
            opacityTotal += 1;
        }
    }

    return opacitySum / opacityTotal;
}

export function getOpacity(aggregation, fillOpacity) {
    ctx.globalAlpha = fillOpacity;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x0 = seriesX0 + aggregation.x0 * seriesAreaSize - markerSize / 2;
    const y0 = seriesY0 + aggregation.y0 * seriesAreaSize - markerSize / 2;
    const x1 = seriesX0 + aggregation.x1 * seriesAreaSize + markerSize / 2;
    const y1 = seriesY0 + aggregation.y1 * seriesAreaSize + markerSize / 2;

    for (const datum of aggregation.data) {
        const x = x0 + datum.x * (x1 - x0);
        const y = y0 + datum.y * (y1 - y0);

        ctx.beginPath();
        ctx.arc(x, y, markerSize, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    const opacity = calculateOpacity(x0, y0, x1, y1);

    return opacity;
}
