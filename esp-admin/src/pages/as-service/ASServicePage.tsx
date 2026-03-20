import { useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import ASAlertListPage from './ASAlertListPage';
import ASRequestPage from './ASRequestPage';
import ASStatusPage from './ASStatusPage';
import ASDetailPage from './ASDetailPage';
import ASReportPage from './ASReportPage';
import ASReportFormPage from './ASReportFormPage';
import { useAuth } from '../../hooks/useAuth';
import { getVisibleAsServiceTabs, type AsServiceTabKey } from '../../utils/roleHelper';

const { Title } = Typography;

const TAB_DEF: { key: AsServiceTabKey; label: string; path: string }[] = [
  { key: 'alerts', label: '알림 현황', path: '/as-service' },
  { key: 'request', label: 'A/S 신청', path: '/as-service/request' },
  { key: 'status', label: '처리 현황', path: '/as-service/status' },
  { key: 'report', label: '완료 보고서', path: '/as-service/report' },
];

type SubView =
  | { type: 'list' }
  | { type: 'detail'; requestId: number }
  | { type: 'report'; requestId: number }
  | { type: 'report-form'; requestId: number };

function ASServiceTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const visibleTabs = useMemo(() => getVisibleAsServiceTabs(role), [role]);
  const visibleSet = useMemo(() => new Set(visibleTabs), [visibleTabs]);

  const tabItems = useMemo(
    () => TAB_DEF.filter((t) => visibleSet.has(t.key)).map(({ key, label }) => ({ key, label })),
    [visibleSet],
  );

  // 처리 현황 탭의 서브 뷰 상태
  const [statusSubView, setStatusSubView] = useState<SubView>({ type: 'list' });
  // 완료 보고서 탭의 서브 뷰 상태
  const [reportSubView, setReportSubView] = useState<SubView>({ type: 'list' });

  /** 권한 없는 URL로 직접 진입 시 리다이렉트 */
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/as-service/request') && !visibleSet.has('request')) {
      navigate('/as-service', { replace: true });
      return;
    }
    if (path.includes('/as-service/status') && !visibleSet.has('status')) {
      navigate('/as-service', { replace: true });
      return;
    }
    if (path.includes('/as-service/report') && !visibleSet.has('report')) {
      navigate('/as-service', { replace: true });
    }
  }, [location.pathname, navigate, visibleSet]);

  const getActiveTab = (): AsServiceTabKey => {
    if (location.pathname.includes('/as-service/request')) return 'request';
    if (location.pathname.includes('/as-service/status')) return 'status';
    if (location.pathname.includes('/as-service/report')) return 'report';
    return 'alerts';
  };

  const activeTab = getActiveTab();
  const safeActiveKey = visibleSet.has(activeTab) ? activeTab : visibleTabs[0] ?? 'alerts';

  const handleTabChange = (key: string) => {
    const k = key as AsServiceTabKey;
    const def = TAB_DEF.find((t) => t.key === k);
    if (!def || !visibleSet.has(k)) return;

    if (k === 'status') setStatusSubView({ type: 'list' });
    if (k === 'report') setReportSubView({ type: 'list' });

    navigate(def.path);
  };

  const showRequestButton = visibleSet.has('request') && safeActiveKey !== 'request';

  // 처리 현황 탭 내 서브 뷰 렌더링
  const renderStatusContent = () => {
    switch (statusSubView.type) {
      case 'detail':
        return (
          <ASDetailPage
            requestId={statusSubView.requestId}
            onBack={() => setStatusSubView({ type: 'list' })}
            onViewReport={(id) => setStatusSubView({ type: 'report', requestId: id })}
            onWriteReport={(id) => setStatusSubView({ type: 'report-form', requestId: id })}
          />
        );
      case 'report':
        return (
          <ASReportPage
            requestId={statusSubView.requestId}
            onBack={() => setStatusSubView({ type: 'detail', requestId: statusSubView.requestId })}
          />
        );
      case 'report-form':
        return (
          <ASReportFormPage
            requestId={statusSubView.requestId}
            onBack={() => setStatusSubView({ type: 'detail', requestId: statusSubView.requestId })}
            onSuccess={() => setStatusSubView({ type: 'list' })}
          />
        );
      default:
        return (
          <ASStatusPage
            onRowClick={(requestId) => setStatusSubView({ type: 'detail', requestId })}
          />
        );
    }
  };

  // 완료 보고서 탭 내 서브 뷰 렌더링
  const renderReportContent = () => {
    switch (reportSubView.type) {
      case 'detail':
        return (
          <ASDetailPage
            requestId={reportSubView.requestId}
            onBack={() => setReportSubView({ type: 'list' })}
            onViewReport={(id) => setReportSubView({ type: 'report', requestId: id })}
            onWriteReport={(id) => setReportSubView({ type: 'report-form', requestId: id })}
          />
        );
      case 'report':
        return (
          <ASReportPage
            requestId={reportSubView.requestId}
            onBack={() => setReportSubView({ type: 'list' })}
          />
        );
      case 'report-form':
        return (
          <ASReportFormPage
            requestId={reportSubView.requestId}
            onBack={() => setReportSubView({ type: 'detail', requestId: reportSubView.requestId })}
            onSuccess={() => setReportSubView({ type: 'list' })}
          />
        );
      default:
        return (
          <ASStatusPage
            onRowClick={(requestId) => setReportSubView({ type: 'report', requestId })}
          />
        );
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          A/S 관리
        </Title>
        {showRequestButton && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/as-service/request')}>
            A/S 신청
          </Button>
        )}
      </div>
      <Tabs
        activeKey={safeActiveKey}
        onChange={handleTabChange}
        items={tabItems}
        className="as-tabs"
      />
      {safeActiveKey === 'alerts' && <ASAlertListPage />}
      {safeActiveKey === 'request' && <ASRequestPage />}
      {safeActiveKey === 'status' && renderStatusContent()}
      {safeActiveKey === 'report' && renderReportContent()}
    </div>
  );
}

export default function ASServicePage() {
  return (
    <Routes>
      <Route path="*" element={<ASServiceTabs />} />
    </Routes>
  );
}
