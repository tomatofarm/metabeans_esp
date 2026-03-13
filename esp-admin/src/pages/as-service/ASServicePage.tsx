import { useState } from 'react';
import { Tabs, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import ASAlertListPage from './ASAlertListPage';
import ASRequestPage from './ASRequestPage';
import ASStatusPage from './ASStatusPage';
import ASDetailPage from './ASDetailPage';
import ASReportPage from './ASReportPage';
import ASReportFormPage from './ASReportFormPage';

const { Title } = Typography;

type SubView =
  | { type: 'list' }
  | { type: 'detail'; requestId: number }
  | { type: 'report'; requestId: number }
  | { type: 'report-form'; requestId: number };

function ASServiceTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  // 처리 현황 탭의 서브 뷰 상태
  const [statusSubView, setStatusSubView] = useState<SubView>({ type: 'list' });
  // 완료 보고서 탭의 서브 뷰 상태
  const [reportSubView, setReportSubView] = useState<SubView>({ type: 'list' });

  const getActiveTab = () => {
    if (location.pathname.includes('/as-service/request')) return 'request';
    if (location.pathname.includes('/as-service/status')) return 'status';
    if (location.pathname.includes('/as-service/report')) return 'report';
    return 'alerts';
  };

  const handleTabChange = (key: string) => {
    // 탭 전환 시 서브 뷰 초기화
    if (key === 'status') setStatusSubView({ type: 'list' });
    if (key === 'report') setReportSubView({ type: 'list' });

    switch (key) {
      case 'alerts':
        navigate('/as-service');
        break;
      case 'request':
        navigate('/as-service/request');
        break;
      case 'status':
        navigate('/as-service/status');
        break;
      case 'report':
        navigate('/as-service/report');
        break;
    }
  };

  const tabItems = [
    { key: 'alerts', label: '알림 현황' },
    { key: 'request', label: 'A/S 신청' },
    { key: 'status', label: '처리 현황' },
    { key: 'report', label: '완료 보고서' },
  ];

  const activeTab = getActiveTab();

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
        {activeTab !== 'request' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/as-service/request')}
          >
            A/S 신청
          </Button>
        )}
      </div>
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} className="as-tabs" />
      {activeTab === 'alerts' && <ASAlertListPage />}
      {activeTab === 'request' && <ASRequestPage />}
      {activeTab === 'status' && renderStatusContent()}
      {activeTab === 'report' && renderReportContent()}
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
