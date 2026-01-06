interface ImportMetaEnv {
  readonly VITE_CANNY_FEATURES_TOKEN: string;
  readonly VITE_CANNY_BUGS_TOKEN: string;
  readonly VITE_CANNY_GENERAL_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
