import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';

export interface TimeSeriesLine {
  name: string;
  data: { timestamp: number; value: number }[];
  color?: string;
}

interface TimeSeriesChartProps {
  title: string;
  lines: TimeSeriesLine[];
  yAxisName?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  height?: number;
  warningZones?: { min: number; max: number; color: string }[];
}

export default function TimeSeriesChart({
  title,
  lines,
  yAxisName,
  yAxisMin,
  yAxisMax,
  height = 280,
  warningZones,
}: TimeSeriesChartProps) {
  const option: EChartsOption = useMemo(() => {
    const series = lines.map((line) => ({
      name: line.name,
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: line.color },
      itemStyle: { color: line.color },
      data: line.data.map((d) => [d.timestamp * 1000, d.value]),
    }));

    const markAreaData = warningZones?.map((zone) => [
      {
        yAxis: zone.min,
        itemStyle: { color: zone.color },
        label: { show: false },
      },
      { yAxis: zone.max },
    ]);

    if (markAreaData && series.length > 0 && series[0]) {
      (series[0] as Record<string, unknown>).markArea = {
        silent: true,
        data: markAreaData,
      };
    }

    return {
      title: {
        text: title,
        textStyle: { fontSize: 14, fontWeight: 500 },
        left: 0,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const items = params as { seriesName: string; value: [number, number]; color: string }[];
          if (!items || !items.length) return '';
          const time = dayjs(items[0]!.value[0]).format('HH:mm:ss');
          const rows = items.map(
            (item) =>
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:4px"></span>${item.seriesName}: <strong>${item.value[1]}</strong>`,
          );
          return `${time}<br/>${rows.join('<br/>')}`;
        },
      },
      legend: {
        show: lines.length > 1,
        bottom: 30,
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: 50,
        right: 20,
        top: 40,
        bottom: lines.length > 1 ? 80 : 55,
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (val: number) => dayjs(val).format('HH:mm'),
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
        nameTextStyle: { fontSize: 11, padding: [0, 0, 0, -10] },
        min: yAxisMin,
        max: yAxisMax,
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { fontSize: 11 },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          height: 20,
          bottom: 5,
          start: 0,
          end: 100,
        },
      ],
      series,
    };
  }, [title, lines, yAxisName, yAxisMin, yAxisMax, warningZones]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
