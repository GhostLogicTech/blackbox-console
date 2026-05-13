/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_BLACKBOX_URL: string;
  readonly VITE_MOCK_ENROLLMENT_REQUEST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
