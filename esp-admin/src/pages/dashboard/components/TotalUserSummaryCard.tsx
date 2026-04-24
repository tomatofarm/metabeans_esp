import { TeamOutlined } from '@ant-design/icons';

/** `dashboard.total_users` — 어드민/역할 대시보드 공통 요약 칸 */
export default function TotalUserSummaryCard({ value, loading }: { value: number; loading?: boolean }) {
  return (
    <div className="summary-card">
      <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
        <TeamOutlined />
      </div>
      <div>
        <div className="summary-card-value">{loading ? '—' : value}</div>
        <div className="summary-card-label">총 사용자 수</div>
      </div>
    </div>
  );
}
