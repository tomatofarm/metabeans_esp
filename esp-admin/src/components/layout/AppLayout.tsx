import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { usePermissionMatrix } from '../../api/system.api';
import { useUiStore } from '../../stores/uiStore';

function PermissionPrefetch() {
  usePermissionMatrix();
  return null;
}

export default function AppLayout() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <PermissionPrefetch />
      <Header />
      <Sidebar />
      <main
        className="main-content"
        style={{ marginLeft: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  );
}
