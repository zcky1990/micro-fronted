(function () {
  const AUTH_STORAGE_KEY = 'mfAuth';
  const sidebarList = document.getElementById('sidebar-list');
  const authPanel = document.getElementById('auth-panel');
  const frame = document.getElementById('main-frame');

  if (!sidebarList || !frame || typeof GITHUB_PAGES === 'undefined') {
    return;
  }

  const pages = GITHUB_PAGES;
  if (pages.length === 0) return;

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setAuth(user, token, provider, options) {
    var data = {
      user: user,
      token: token || '',
      provider: provider || 'form',
      at: Date.now()
    };
    if (options && options.idToken) data.idToken = options.idToken;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    renderAuthUI();
    sendAuthToFrame();
  }

  function clearAuth() {
    var auth = getAuth();
    if (auth && auth.provider === 'google' && window.google && window.google.accounts && window.google.accounts.id) {
      try { window.google.accounts.id.disableAutoSelect(); } catch (e) {}
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    renderAuthUI();
    sendAuthToFrame();
  }

  function sendAuthToFrame() {
    if (!frame.src || frame.src === 'about:blank') return;
    try {
      var targetOrigin = new URL(frame.src).origin;
      frame.contentWindow.postMessage(
        { type: 'AUTH', payload: getAuth() },
        targetOrigin
      );
    } catch (e) {}
  }

  function parseJwtPayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
      return null;
    }
  }

  function renderGoogleButton() {
    var container = document.getElementById('google-button-container');
    if (!container || typeof GOOGLE_CLIENT_ID === 'undefined' || !GOOGLE_CLIENT_ID) return;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: function (response) {
        var payload = parseJwtPayload(response.credential);
        var user = (payload && (payload.email || payload.name)) || 'Google user';
        setAuth(user, response.credential, 'google', { idToken: response.credential });
      }
    });
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'medium',
      width: container.offsetWidth || 168
    });
  }

  function whenGoogleReady(cb) {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      cb();
      return;
    }
    var attempts = 0;
    var t = setInterval(function () {
      attempts++;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(t);
        cb();
      } else if (attempts > 50) clearInterval(t);
    }, 100);
  }

  function renderAuthUI() {
    if (!authPanel) return;
    var auth = getAuth();
    if (auth) {
      authPanel.innerHTML =
        '<div class="auth-logged-in">' +
        '<strong>Logged in as</strong> ' +
        escapeHtml(auth.user) +
        (auth.provider === 'google' ? ' <span class="auth-provider">(Google)</span>' : '') +
        '</div>' +
        '<button type="button" class="auth-logout">Log out</button>';
      authPanel.querySelector('.auth-logout').addEventListener('click', clearAuth);
    } else {
      authPanel.innerHTML =
        '<form class="auth-form" id="auth-form">' +
        '<label for="auth-user">Username</label>' +
        '<input type="text" id="auth-user" name="user" placeholder="Username" required autocomplete="username">' +
        '<label for="auth-password">Password</label>' +
        '<input type="password" id="auth-password" name="password" placeholder="Password" autocomplete="current-password">' +
        '<button type="submit" class="auth-login">Log in</button>' +
        '</form>' +
        (typeof GOOGLE_CLIENT_ID !== 'undefined' && GOOGLE_CLIENT_ID
          ? '<div class="auth-divider">or</div><div id="google-button-container" class="google-button-container"></div>'
          : '');
      authPanel.querySelector('#auth-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var user = document.getElementById('auth-user').value.trim();
        var password = document.getElementById('auth-password').value;
        if (user) setAuth(user, password || '', 'form');
      });
      if (typeof GOOGLE_CLIENT_ID !== 'undefined' && GOOGLE_CLIENT_ID) {
        whenGoogleReady(renderGoogleButton);
      }
    }
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getPageIdFromQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get('page');
  }

  function loadPage(entry, setActive) {
    frame.src = entry.url;
    if (setActive) {
      sidebarList.querySelectorAll('button').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-id') === entry.id);
      });
      var newUrl = new URL(window.location);
      newUrl.searchParams.set('page', entry.id);
      window.history.replaceState({}, '', newUrl);
    }
  }

  frame.addEventListener('load', function () {
    sendAuthToFrame();
  });

  renderAuthUI();

  pages.forEach(function (entry) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-id', entry.id);
    btn.setAttribute('data-url', entry.url);
    btn.textContent = entry.label;
    btn.addEventListener('click', function () {
      loadPage(entry, true);
    });
    li.appendChild(btn);
    sidebarList.appendChild(li);
  });

  var requestedId = getPageIdFromQuery();
  var initial = requestedId
    ? pages.find(function (p) { return p.id === requestedId; }) || pages[0]
    : pages[0];

  loadPage(initial, true);
})();
