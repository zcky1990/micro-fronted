/**
 * Example: use this in your embedded GitHub Page (same origin) to read auth
 * set by the wrapper (form or Google). Same origin = same *.github.io so localStorage is shared.
 *
 * Auth payload: { user, token, provider: 'form'|'google', idToken?, at }
 * - provider === 'google' and idToken: use idToken for Google APIs or verify on your backend.
 *
 * Usage: add <script src="https://YOUR-USER.github.io/micro-front-end/embedded-auth-example.js"></script>
 *        then call getSharedAuth() or listen for postMessage / 'mfAuth' event.
 */
(function () {
  var AUTH_STORAGE_KEY = 'mfAuth';

  window.getSharedAuth = function () {
    try {
      var raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'AUTH') {
      window.dispatchEvent(new CustomEvent('mfAuth', { detail: event.data.payload }));
    }
  });
})();
