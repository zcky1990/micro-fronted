/**
 * Shared theme helper for profile, cv-builder (cv-generator), and micro frontend host.
 * Use the same THEME_STORAGE_KEY as in config.js so all apps read/write the same localStorage key.
 *
 * Usage in profile or cv-builder:
 * 1. Include this script (or copy its logic) and use THEME_STORAGE_KEY when reading/writing theme.
 * 2. On load: apply theme from localStorage.getItem(THEME_STORAGE_KEY) ('light' | 'dark').
 * 3. Listen for postMessage({ type: 'THEME', payload: 'light'|'dark' }) when embedded in the shell.
 * 4. When your app changes theme: localStorage.setItem(THEME_STORAGE_KEY, value) and apply.
 */
(function () {
  var THEME_STORAGE_KEY = (typeof window !== 'undefined' && window.THEME_STORAGE_KEY) ? window.THEME_STORAGE_KEY : 'theme';

  function getStoredTheme() {
    try {
      var stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored === 'dark' || stored === 'light' ? stored : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function applyToDocument(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply on load from localStorage
  applyToDocument(getStoredTheme());

  // When embedded in shell, sync to THEME messages
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'THEME' && (event.data.payload === 'light' || event.data.payload === 'dark')) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, event.data.payload);
      } catch (e) {}
      applyToDocument(event.data.payload);
    }
  });

  window.getSharedTheme = getStoredTheme;
  window.applySharedTheme = function (theme) {
    var v = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, v);
    } catch (e) {}
    applyToDocument(v);
  };
})();
