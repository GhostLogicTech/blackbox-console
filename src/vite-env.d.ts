/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLACKBOX_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
