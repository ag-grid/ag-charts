export const backgroundRegionStyle = {
    fill: { $ref: 'foregroundColor' },
    fillOpacity: 0.08,
    stroke: { $ref: 'backgroundColor' },
    strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
    label: {
        fontSize: { $ref: 'fontSize' },
        fontFamily: { $ref: 'fontFamily' },
        fontWeight: { $ref: 'fontWeight' },
        padding: {
            $applyPadding: {
                $if: [{ $path: './border/enabled' }, { left: 12, right: 12, top: 8, bottom: 8 }, 5],
            },
        },
        color: { $ref: 'textColor' },
        cornerRadius: 4,
        border: {
            enabled: false,
            stroke: { $ref: 'foregroundColor' },
            strokeOpacity: 1,
            strokeWidth: 1,
        },
    },
    marker: {
        strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
    },
};

const backgroundRegionsPath = {
    $pathString: ['/$seriesType/seriesArea/backgroundRegions', { seriesType: { $path: ['/series/0/type', 'line'] } }],
};

export const backgroundRegionsTheme = {
    $apply: [backgroundRegionStyle, undefined, backgroundRegionsPath],
};
