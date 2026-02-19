(function () {
  const AUTH_STORAGE_KEY = 'mfAuth';
  const sidebarList = document.getElementById('sidebar-list');
  // const authPanel = document.getElementById('auth-panel');
  const themePanel = document.getElementById('theme-panel');
  const frame = document.getElementById('main-frame');
  const THEME_KEY = typeof THEME_STORAGE_KEY !== 'undefined' ? THEME_STORAGE_KEY : 'theme';

  if (!sidebarList || !frame || typeof GITHUB_PAGES === 'undefined') {
    return;
  }

  const pages = GITHUB_PAGES;
  if (pages.length === 0) return;

  function getTheme() {
    try {
      var stored = localStorage.getItem(THEME_KEY);
      return stored === 'dark' || stored === 'light' ? stored : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function setTheme(value) {
    var theme = value === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    applyTheme(theme);
    sendThemeToFrame();
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    var html = document.documentElement;
    html.setAttribute('data-theme', theme);
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    // Force browser to recalculate styles so CSS variables update immediately
    void document.body.offsetHeight;
  }

  function sendThemeToFrame() {
    if (!frame.src || frame.src === 'about:blank') return;
    try {
      var targetOrigin = new URL(frame.src).origin;
      frame.contentWindow.postMessage(
        { type: 'THEME', payload: getTheme() },
        targetOrigin
      );
    } catch (e) {}
  }

  function renderThemeUI() {
    if (!themePanel) return;
    var theme = getTheme();
    themePanel.innerHTML =
      '<div class="flex items-center justify-between gap-2">' +
      '<span class="text-sm font-medium">Theme</span>' +
      '<button type="button" class="inline-flex h-8 items-center justify-center rounded-md border border-input bg-secondary px-3 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title="Toggle theme" aria-label="Toggle theme">' +
      (theme === 'dark' ? '☀️ Light' : '🌙 Dark') +
      '</button>' +
      '</div>';
    themePanel.querySelector('button').addEventListener('click', function () {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      renderThemeUI();
    });
  }

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
      sendThemeToFrame();
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

  // function renderAuthUI() {
  //   if (!authPanel) return;
  //   var auth = getAuth();
  //   if (auth) {
  //     authPanel.innerHTML =
  //       '<div class="mb-2 text-sm">' +
  //       '<strong class="block text-xs font-medium text-muted-foreground">Logged in as</strong> ' +
  //       escapeHtml(auth.user) +
  //       (auth.provider === 'google' ? ' <span class="text-xs text-muted-foreground">(Google)</span>' : '') +
  //       '</div>' +
  //       '<button type="button" class="inline-flex h-8 w-full items-center justify-center rounded-md border border-border bg-destructive/10 px-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Log out</button>';
  //     authPanel.querySelector('button').addEventListener('click', clearAuth);
  //   } else {
  //     authPanel.innerHTML =
  //       '<form id="auth-form" class="space-y-3">' +
  //       '<div><label for="auth-user" class="mb-1 block text-xs font-medium text-muted-foreground">Username</label>' +
  //       '<input type="text" id="auth-user" name="user" placeholder="Username" required autocomplete="username" class="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">' +
  //       '</div>' +
  //       '<div><label for="auth-password" class="mb-1 block text-xs font-medium text-muted-foreground">Password</label>' +
  //       '<input type="password" id="auth-password" name="password" placeholder="Password" autocomplete="current-password" class="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">' +
  //       '</div>' +
  //       '<button type="submit" class="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Log in</button>' +
  //       '</form>' +
  //       (typeof GOOGLE_CLIENT_ID !== 'undefined' && GOOGLE_CLIENT_ID
  //         ? '<p class="my-2 text-center text-xs text-muted-foreground">or</p><div id="google-button-container" class="google-button-container"></div>'
  //         : '');
  //     authPanel.querySelector('#auth-form').addEventListener('submit', function (e) {
  //       e.preventDefault();
  //       var user = document.getElementById('auth-user').value.trim();
  //       var password = document.getElementById('auth-password').value;
  //       if (user) setAuth(user, password || '', 'form');
  //     });
  //     if (typeof GOOGLE_CLIENT_ID !== 'undefined' && GOOGLE_CLIENT_ID) {
  //       whenGoogleReady(renderGoogleButton);
  //     }
  //   }
  // }

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

  applyTheme(getTheme());
  renderThemeUI();
  // renderAuthUI();

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
