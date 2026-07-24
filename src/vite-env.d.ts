/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_UID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
