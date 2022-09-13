/**
 * Submodule of telemetry class
 */

import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartDataset, registerables } from 'chart.js';
import { dom } from '../app/domElements';
import { log } from '../shared/log';
import { settings } from '../settings';
import type { Telemetry } from './Telemetry';

const maxDataPoints = 30;
const updateFrequency = 500;
const lastUpdated: Record<string, number> = {};
let i = 0;

let chart: Chart;

const chartOptions: ChartOptions = {
  responsive: false,
  layout: {
    autoPadding: true,
  },
  plugins: {
    legend: {
      position: 'right',
      fullSize: true,
      labels: {
        padding: 14,
        color: 'rgb(200, 200, 200)',
        font: {
          family: 'CenturyGothic',
        },
      },
    },
    title: {
      color: 'rgb(255, 255, 255)',
      display: true,
      text: 'T E L E M E T R Y',
      align: 'center',
      font: {
        family: 'CenturyGothic',
        size: 16,
      },
    },
    subtitle: {
      color: 'rgb(200, 200, 200)',
      display: true,
      text: '  3D JOINT ROTATION (%)',
      align: 'start',
      font: {
        family: 'CenturyGothic',
        size: 14,
      },
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
      min: 0,
      max: 100,
    },
  },
};

const chartData: ChartData = {
  labels: [],
  datasets: [],
};

const chartConfig: ChartConfiguration = {
  type: 'line',
  data: chartData,
  options: chartOptions,
};

export function drawChart(t: Telemetry, show: boolean) {
  if (!t || !t.person || !t.person.skeleton) return;
  dom.chart.style.display = show ? 'block' : 'none';
  if (!show) return;
  if (!chart) {
    dom.chart.style.backgroundColor = settings.menu.backgroundColor;
    dom.chart.style.left = `${settings.menu.width + 40}px`;
    dom.chart.style.bottom = '10px';
    dom.chart.width = dom.video.offsetWidth;
    Chart.register(...registerables);
    chart = new Chart(dom.chart, chartConfig);
    log('telemetry chart', chart);
  }
  chart.update();
}

const rndColor = () => Math.round(255 * Math.random());

export function updateChartData(boneName: string, value: number) {
  if (!chartData.labels) return;
  const currentTime = Date.now();
  if (i > 0) {
    if (lastUpdated[boneName] && ((currentTime - lastUpdated[boneName]) < updateFrequency)) return;
  }
  let boneData: ChartDataset = chartData.datasets.find((d) => d.label === boneName) as ChartDataset;
  if (!boneData) {
    const color = `rgb(${rndColor()}, ${rndColor()}, ${rndColor()})`;
    boneData = {
      label: boneName,
      backgroundColor: color,
      borderColor: color,
      data: [],
      fill: false,
      showLine: true,
      pointRadius: 0,
      cubicInterpolationMode: 'monotone',
      tension: 0.4,
    };
    chartData.datasets.push(boneData);
  }
  lastUpdated[boneName] = currentTime;

  if (boneData.data.length >= maxDataPoints - 1) boneData.data.shift();
  while (boneData.data.length < maxDataPoints) boneData.data.push(value);

  if (chartData.labels.length >= maxDataPoints - 1) chartData.labels.shift();
  while (chartData.labels.length < maxDataPoints) chartData.labels.push(i++);
}

export const getChartVisibility = (t: Telemetry, boneName: string) => t.visibleChart[boneName] || false;

export const setChartVisibility = (t: Telemetry, boneName: string, shown: boolean) => {
  t.visibleChart[boneName] = shown;
  if (!shown) chartData.datasets = chartData.datasets.filter((d) => d.label !== boneName); // remove dataset
  t.person.shouldUpdate = true;
};
