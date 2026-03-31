import {
  ShopOutlined,
  DesktopOutlined,
  ToolOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { DashboardSummary } from '../../../types/dashboard.types';
import { STATUS_COLORS } from '../../../utils/constants';

interface SummaryCardsProps {
  data?: DashboardSummary;
  /** 권한 없으면 false — 전체 매장 카드 숨김 */
  showTotalStores?: boolean;
  totalUsers?: number;
  loading?: boolean;
}

export default function SummaryCards({ data, showTotalStores = true, totalUsers }: SummaryCardsProps) {
  const pendingAs = data?.pendingAsRequests ?? 0;
  const showTotalUsers = totalUsers !== undefined;
  const visibleCount =
    (showTotalStores ? 1 : 0) + 2 + (showTotalUsers ? 1 : 0);
  const gridCols = Math.min(4, Math.max(2, visibleCount));

  return (
    <div className={`summary-grid summary-grid-${gridCols}`}>
      {showTotalStores && (
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
      )}

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

      {showTotalUsers && (
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
            <TeamOutlined />
          </div>
          <div>
            <div className="summary-card-value">{totalUsers}</div>
            <div className="summary-card-label">총 사용자 수</div>
          </div>
        </div>
      )}
    </div>
  );
}
