/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `true`이면 `VITE_API_BASE_URL`이 있어도 Mock API만 사용 */
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_DEBUG_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
