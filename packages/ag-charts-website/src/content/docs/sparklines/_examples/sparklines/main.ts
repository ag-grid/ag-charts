import { AgCharts, AgSparklineOptions } from 'ag-charts-community';

import { data } from './data';

function marketCapData(marketCap: number) {
    return [{ index: 0, marketCap }];
}

const marketCapFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
});

const marketCapOptions: AgSparklineOptions = {
    width: 250,
    height: 30,
    type: 'bar',
    mainAxis: { paddingOuter: 0 },
    crossAxis: { min: 0, max: 2500000000000 },
    background: {
        fill: 'transparent',
    },
    xKey: 'index',
    yKey: 'marketCap',
    direction: 'horizontal',
    highlightStyle: {
        item: {
            fillOpacity: 0,
            strokeOpacity: 0,
        },
    },
    label: {
        enabled: true,
        placement: 'inside-end',
        spacing: 6,
        formatter: ({ value }) => marketCapFormatter.format(value),
    },
    tooltip: {
        enabled: false,
    },
};

const marketCapOutsideLabel: Partial<AgSparklineOptions> = {
    label: {
        ...marketCapOptions.label,
        placement: 'outside-end',
        color: '#8888',
    },
};

const priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const priceOptions: AgSparklineOptions = {
    width: 200,
    height: 30,
    background: {
        fill: 'transparent',
    },
    type: 'line',
    xKey: 'date',
    yKey: 'price',
    tooltip: {
        renderer: ({ datum, yKey }) => ({ content: priceFormatter.format(datum[yKey]) }),
    },
};

const priceChangeFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
});

const priceChangeOptions: AgSparklineOptions = {
    width: 200,
    height: 30,
    background: {
        fill: 'transparent',
    },
    type: 'area',
    xKey: 'date',
    yKey: 'change',
    crossAxis: { min: -10, max: 10 },
    tooltip: {
        renderer: ({ datum, yKey }) => ({ content: priceChangeFormatter.format(datum[yKey]) }),
    },
};

// AAPL

const sparklineAaplMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineAaplMarketCap'),
    data: marketCapData(data.AAPL.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineAaplMarketCap);

const sparklineAaplPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineAaplPrice'),
    data: data.AAPL.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineAaplPrice);

const sparklineAaplPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineAaplPriceChange'),
    data: data.AAPL.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineAaplPriceChange);

// MSFT

const sparklineMsftMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineMsftMarketCap'),
    data: marketCapData(data.MSFT.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineMsftMarketCap);

const sparklineMsftPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineMsftPrice'),
    data: data.MSFT.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineMsftPrice);

const sparklineMsftPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineMsftPriceChange'),
    data: data.MSFT.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineMsftPriceChange);

// AMZN

const sparklineAmznMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineAmznMarketCap'),
    data: marketCapData(data.AMZN.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineAmznMarketCap);

const sparklineAmznPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineAmznPrice'),
    data: data.AMZN.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineAmznPrice);

const sparklineAmznPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineAmznPriceChange'),
    data: data.AMZN.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineAmznPriceChange);

// GOOGL

const sparklineGooglMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineGooglMarketCap'),
    data: marketCapData(data.GOOGL.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineGooglMarketCap);

const sparklineGooglPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineGooglPrice'),
    data: data.GOOGL.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineGooglPrice);

const sparklineGooglPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineGooglPriceChange'),
    data: data.GOOGL.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineGooglPriceChange);

// FB

const sparklineFbMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineFbMarketCap'),
    data: marketCapData(data.FB.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineFbMarketCap);

const sparklineFbPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineFbPrice'),
    data: data.FB.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineFbPrice);

const sparklineFbPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineFbPriceChange'),
    data: data.FB.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineFbPriceChange);

// TSLA

const sparklineTslaMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineTslaMarketCap'),
    data: marketCapData(data.TSLA.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineTslaMarketCap);

const sparklineTslaPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineTslaPrice'),
    data: data.TSLA.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineTslaPrice);

const sparklineTslaPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineTslaPriceChange'),
    data: data.TSLA.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineTslaPriceChange);

// NVDA

const sparklineNvdaMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineNvdaMarketCap'),
    data: marketCapData(data.NVDA.marketCap),
    ...marketCapOptions,
};

AgCharts.__createSparkline(sparklineNvdaMarketCap);

const sparklineNvdaPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineNvdaPrice'),
    data: data.NVDA.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineNvdaPrice);

const sparklineNvdaPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineNvdaPriceChange'),
    data: data.NVDA.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineNvdaPriceChange);

// DIS

const sparklineDisMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineDisMarketCap'),
    data: marketCapData(data.DIS.marketCap),
    ...marketCapOptions,
    ...marketCapOutsideLabel,
};

AgCharts.__createSparkline(sparklineDisMarketCap);

const sparklineDisPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineDisPrice'),
    data: data.DIS.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineDisPrice);

const sparklineDisPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineDisPriceChange'),
    data: data.DIS.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineDisPriceChange);

// NFLX

const sparklineNflxMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineNflxMarketCap'),
    data: marketCapData(data.NFLX.marketCap),
    ...marketCapOptions,
    ...marketCapOutsideLabel,
};

AgCharts.__createSparkline(sparklineNflxMarketCap);

const sparklineNflxPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineNflxPrice'),
    data: data.NFLX.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineNflxPrice);

const sparklineNflxPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineNflxPriceChange'),
    data: data.NFLX.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineNflxPriceChange);

// VZ

const sparklineVzMarketCap: AgSparklineOptions = {
    container: document.getElementById('sparklineVzMarketCap'),
    data: marketCapData(data.VZ.marketCap),
    ...marketCapOptions,
    ...marketCapOutsideLabel,
};

AgCharts.__createSparkline(sparklineVzMarketCap);

const sparklineVzPrice: AgSparklineOptions = {
    container: document.getElementById('sparklineVzPrice'),
    data: data.VZ.priceData,
    ...priceOptions,
};

AgCharts.__createSparkline(sparklineVzPrice);

const sparklineVzPriceChange: AgSparklineOptions = {
    container: document.getElementById('sparklineVzPriceChange'),
    data: data.VZ.priceData,
    ...priceChangeOptions,
};

AgCharts.__createSparkline(sparklineVzPriceChange);
