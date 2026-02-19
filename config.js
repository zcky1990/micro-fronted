/**
 * Shared theme key for profile, cv-builder (cv-generator), and this micro frontend host.
 * Use this same key when reading/writing theme to localStorage so all apps stay in sync.
 * Values: 'light' | 'dark'
 */
const THEME_STORAGE_KEY = 'theme';

/**
 * List of GitHub Pages to show in the wrapper.
 * Add your real URLs here; id and label are used for the sidebar and deep linking.
 */
const GITHUB_PAGES = [
  { id: 'profile', label: 'Profile', url: 'https://zcky1990.github.io/profile/' },
  { id: 'cv-generator', label: 'CV Generator', url: 'https://zcky1990.github.io/cv-generator/' },
  { id: 'expenses', label: 'Expenses', url: 'https://zcky1990.github.io/expense-tracker/' },
];

/**
 * Google Sign-In: set via env (see env.js, generated from GOOGLE_CLIENT_ID env var).
 * Create a Web application OAuth 2.0 Client ID at
 * https://console.cloud.google.com/apis/credentials and add your origins to Authorized JavaScript origins.
 */
const GOOGLE_CLIENT_ID = (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID != null) ? window.GOOGLE_CLIENT_ID : '';
