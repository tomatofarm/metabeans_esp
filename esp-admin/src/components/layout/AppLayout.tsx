import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { usePermissionMatrix } from '../../api/system.api';

/**
 * 앱 레이아웃 마운트 시 권한 매트릭스를 즉시 fetch.
 * Header의 useTopMenuSectionVisibility가 같은 queryKey를 구독하므로
 * 캐시가 채워진 후 메뉴를 렌더링 → "잠깐 보였다 사라지는" 깜빡임 방지.
 */
function PermissionPrefetch() {
  usePermissionMatrix(); // 캐시 채우기 전용, 반환값 불필요
  return null;
}

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <PermissionPrefetch />
      <Header />
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
