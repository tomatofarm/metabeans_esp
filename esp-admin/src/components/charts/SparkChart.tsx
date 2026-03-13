import { useMemo } from 'react';
import { Card } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import type { SensorHistoryDataPoint } from '../../types/sensor.types';
import { CHART_COLORS, STATUS_COLORS } from '../../utils/constants';

interface SparkChartProps {
  historyData: SensorHistoryDataPoint[];
  height?: number;
}

export default function SparkChart({ historyData, height = 300 }: SparkChartProps) {
  const option: EChartsOption = useMemo(() => {
    const grouped = new Map<string, [number, number][]>();
    for (const point of historyData) {
      const key = point.controllerName;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push([point.timestamp * 1000, point.ppSpark]);
    }

    const series = Array.from(grouped.entries()).map(([name, data], idx) => ({
      name,
      type: 'scatter' as const,
      data,
      symbolSize: 4,
      itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
    }));

    return {
      title: {
        text: '스파크 발생 현황',
        textStyle: { fontSize: 14, fontWeight: 500 },
        left: 0,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { seriesName: string; value: [number, number]; color: string };
          const time = dayjs(p.value[0]).format('HH:mm:ss');
          return `${p.seriesName}<br/>${time}: <strong>${p.value[1]}</strong>`;
        },
      },
      legend: {
        show: grouped.size > 1,
        bottom: 30,
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: 50,
        right: 20,
        top: 40,
        bottom: grouped.size > 1 ? 80 : 55,
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
        name: '스파크',
        nameTextStyle: { fontSize: 11 },
        min: 0,
        max: 99,
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { fontSize: 11 },
      },
      visualMap: [
        {
          show: false,
          type: 'piecewise',
          dimension: 1,
          pieces: [
            { min: 0, max: 29, color: STATUS_COLORS.GOOD.color },
            { min: 30, max: 69, color: STATUS_COLORS.WARNING.color },
            { min: 70, max: 99, color: STATUS_COLORS.DANGER.color },
          ],
          seriesIndex: series.map((_, i) => i),
        },
      ],
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
  }, [historyData]);

  if (!historyData.length) {
    return (
      <Card title="스파크 발생 현황" size="small">
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          데이터 없음
        </div>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        notMerge
        lazyUpdate
      />
    </Card>
  );
}
