import { useEffect, type ReactNode } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import koKR from 'antd/locale/ko_KR';
import AppRoutes from './routes/AppRoutes';
import { runAuthRestore } from './auth/runAuthRestore';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBootstrap({ children }: { children: ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) {
          await runAuthRestore();
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAuthReady]);

  if (!authReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={koKR}
        theme={{
          token: {
            colorPrimary: '#4A6CF7',
            borderRadius: 8,
            fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <AuthBootstrap>
            <AppRoutes />
          </AuthBootstrap>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
