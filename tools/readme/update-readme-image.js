const sharp = require('sharp');
const fs = require('fs');

const sources = [
    'stacked-horizontal-bar',
    'stacked-area',
    'map-kitchen-sink',
    'scatter-with-large-data',
    'simple-donut',
    'sunburst-with-nesting',
    'simple-radar-area',
    'multiple-box-plots',
    'range-bar-with-labels',
];

const targetDimensions = {
    width: 800,
    height: 600,
};
const background = { r: 0, g: 0, b: 0, alpha: 0 };
const padding = 5;

const columns = 3;
const rows = 3;
const sourceWidth = Math.floor(targetDimensions.width / columns);
const sourceHeight = Math.floor(targetDimensions.height / rows);

async function compose(suffix = '', outputPath) {
    const sourceObjects = sources.map((s) => {
        return sharp(`./dist/generated-thumbnails/ag-charts-website/gallery/_examples/${s}/ag-default${suffix}.png`)
            .resize(sourceWidth - padding * 2, sourceHeight - padding * 2)
            .toBuffer();
    });

    console.info(`Reading source images...`);
    const resolvedSources = await Promise.all(sourceObjects);

    console.info(`Composing images...`);
    await sharp({ create: { ...targetDimensions, channels: 4, background } })
        .composite(
            resolvedSources.map((s, i) => {
                return {
                    input: s,
                    top: Math.floor(i / columns) * sourceHeight + padding,
                    left: (i % columns) * sourceWidth + padding,
                };
            })
        )
        .png()
        .toFile(outputPath);

    console.info(`Updated ${outputPath}.`);
}

compose('', './.github/example-1-light.png').catch((e) => {
    console.error(e);
    process.exit(1);
});

compose('-dark', './.github/example-1-dark.png').catch((e) => {
    console.error(e);
    process.exit(1);
});
