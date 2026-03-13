import { useMemo } from 'react';
import { Card } from 'antd';
import type { SensorHistoryDataPoint } from '../../types/sensor.types';
import TimeSeriesChart from './TimeSeriesChart';
import type { TimeSeriesLine } from './TimeSeriesChart';
import { CHART_COLORS } from '../../utils/constants';

interface BoardTempChartProps {
  historyData: SensorHistoryDataPoint[];
  height?: number;
}

export default function BoardTempChart({ historyData, height = 300 }: BoardTempChartProps) {
  const lines: TimeSeriesLine[] = useMemo(() => {
    const grouped = new Map<string, { timestamp: number; value: number }[]>();
    for (const point of historyData) {
      const key = point.controllerName;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ timestamp: point.timestamp, value: point.ppTemp });
    }
    return Array.from(grouped.entries()).map(([name, data], idx) => ({
      name,
      data,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [historyData]);

  if (!historyData.length) {
    return (
      <Card title="보드 온도 추이" size="small">
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          데이터 없음
        </div>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <TimeSeriesChart
        title="보드 온도 추이"
        lines={lines}
        yAxisName="°C"
        height={height}
        warningZones={[
          { min: 60, max: 80, color: 'rgba(250,173,20,0.08)' },
          { min: 80, max: 120, color: 'rgba(255,77,79,0.08)' },
        ]}
      />
    </Card>
  );
}
