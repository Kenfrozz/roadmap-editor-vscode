// @kairos/shared — Ana export dosyasi

// Core
export { setProjectRoot, getRoot, consumeSuppression, suppressNextFileChange, FileType } from './_core/db';

// Types
export * from './types';

// Platform arayuzleri
export * from './platform';

// API
export { handleMessage, setHost, getHost } from './api';
