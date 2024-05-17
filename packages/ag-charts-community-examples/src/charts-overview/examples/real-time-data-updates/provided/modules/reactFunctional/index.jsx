import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { time } from 'ag-charts-community';
import { AgChartsReact } from 'ag-charts-react';

const ChartExample = () => {
  const chartRef = useRef(null);
  const [options, setOptions] = useState({
    data: getData(),
    theme: {
      palette: {
        fills: ['#ec4d3d', '#4facf2'],
        strokes: ['#ec4d3d', '#4facf2'],
      },
      overrides: { area: { series: { fillOpacity: 0.5 } } },
    },
    title: {
      text: 'Simulated CPU Usage',
      fontSize: 18,
    },
    series: [
      { type: 'area', xKey: 'time', yKey: 'system', stacked: true, yName: 'System' },
      { type: 'area', xKey: 'time', yKey: 'user', stacked: true, yName: 'User' },
    ],
    axes: [
      {
        type: 'time',
        position: 'bottom',
        nice: false,
        tick: {
          interval: time.second.every(5, { snapTo: 0 }),
        },
      },
      {
        type: 'number',
        position: 'left',
        title: {
          text: 'Load (%)',
        },
        min: 0,
        max: 100,
      },
    ],
  });

  useEffect(() => {
    const updateData = () => {
      setOptions((currentOptions) => {
        const clone = { ...currentOptions };

        const now = Date.now();
        clone.data = getData();

        return clone;
      });
    };

    const interval = setInterval(updateData, refreshRateInMilliseconds);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <AgChartsReact ref={chartRef} options={options} />;
};

let systemLoad = 0;
let userLoad = 0;
const data = [];
const refreshRateInMilliseconds = 50;
const millisecondsOfData = 30 * 1000;

function calculateRandomDelta(maxChange) {
  return maxChange / 2 - Math.floor(Math.random() * Math.floor(maxChange + 1));
}

function ensureBounds(load, max) {
  if (load > max) {
    return max;
  } else if (load < 0) {
    return 0;
  }
  return load;
}

function calculateCpuUsage() {
  systemLoad = ensureBounds(systemLoad + calculateRandomDelta(2), 30);
  userLoad = ensureBounds(userLoad + calculateRandomDelta(4), 70);
}

function getData() {
  const dataCount = millisecondsOfData / refreshRateInMilliseconds;
  data.shift();
  let timeDelta = (dataCount - data.length - 1) * refreshRateInMilliseconds;
  const now = Date.now();
  while (data.length < dataCount) {
    calculateCpuUsage();
    data.push({ time: now - timeDelta, system: systemLoad, user: userLoad });
    timeDelta -= refreshRateInMilliseconds;
  }
  return data;
}

const root = createRoot(document.getElementById('root'));
root.render(<ChartExample />);
