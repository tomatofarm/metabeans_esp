import {
  ShopOutlined,
  DesktopOutlined,
  ToolOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import type { DashboardSummary } from '../../../types/dashboard.types';
import { STATUS_COLORS } from '../../../utils/constants';

interface SummaryCardsProps {
  data?: DashboardSummary;
  loading?: boolean;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  const pendingAs = data?.pendingAsRequests ?? 0;
  const emergencyAlarms = data?.emergencyAlarms ?? 0;

  return (
    <div className="summary-grid summary-grid-4">
      {/* Card 1: 전체 매장 */}
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #4A6CF7, #6B7CFF)' }}>
          <ShopOutlined />
        </div>
        <div>
          <div className="summary-card-value">{data?.totalStores ?? 0}</div>
          <div className="summary-card-label">전체 매장</div>
          <div className="summary-card-sub">활성 {data?.activeStores ?? 0}</div>
        </div>
      </div>

      {/* Card 2: 전체 장비 */}
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>
          <DesktopOutlined />
        </div>
        <div>
          <div className="summary-card-value">{data?.totalEquipments ?? 0}</div>
          <div className="summary-card-label">전체 장비</div>
          <div className="summary-card-sub">정상 {data?.normalEquipments ?? 0}</div>
        </div>
      </div>

      {/* Card 3: A/S 요청 */}
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}>
          <ToolOutlined />
        </div>
        <div>
          <div
            className="summary-card-value"
            style={pendingAs > 0 ? { color: STATUS_COLORS.WARNING.color } : undefined}
          >
            {pendingAs}
          </div>
          <div className="summary-card-label">A/S 요청 (미처리)</div>
        </div>
      </div>

      {/* Card 4: 긴급 알람 */}
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}>
          <AlertOutlined />
        </div>
        <div>
          <div
            className="summary-card-value"
            style={{ color: emergencyAlarms > 0 ? STATUS_COLORS.DANGER.color : STATUS_COLORS.GOOD.color }}
          >
            {emergencyAlarms}
          </div>
          <div className="summary-card-label">긴급 알람</div>
        </div>
      </div>
    </div>
  );
}
