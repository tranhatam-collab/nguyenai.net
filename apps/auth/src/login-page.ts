/**
 * HTML login UI for GET /auth?redirect=...
 * Used when invest/console gate unauthenticated users to auth.nguyenai.net/auth.
 */

const ALLOWED_REDIRECT =
  /^https:\/\/([a-z0-9-]+\.)*nguyenai\.net(\/.*)?$/i;

/** Returns a safe post-login URL, or null if the redirect is not allowed. */
export function sanitizeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!ALLOWED_REDIRECT.test(decoded)) return null;
  // Block javascript: and other schemes via URL parse
  try {
    const u = new URL(decoded);
    if (u.protocol !== 'https:') return null;
    if (!u.hostname.endsWith('nguyenai.net')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function renderLoginPage(opts: {
  redirect: string | null;
  error?: string | null;
}): string {
  const redirect = opts.redirect ?? 'https://app.nguyenai.net/dashboard';
  const errorBlock = opts.error
    ? `<p class="err" role="alert">${escapeHtml(opts.error)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>Đăng nhập · Nguyễn AI</title>
  <style>
    :root {
      --bg: #0c0a09;
      --card: #1c1917;
      --text: #fafaf9;
      --muted: #a8a29e;
      --gold: #d4a017;
      --gold-hover: #e8b82a;
      --border: #44403c;
      --err: #f87171;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,160,23,0.18), transparent),
        var(--bg);
      color: var(--text);
    }
    .wrap { width: 100%; max-width: 24rem; }
    .brand { text-align: center; margin-bottom: 1.75rem; }
    .mark {
      width: 3.25rem; height: 3.25rem; margin: 0 auto 0.75rem;
      display: flex; align-items: center; justify-content: center;
      border-radius: 0.75rem; background: var(--gold); color: #1c1917;
      font-weight: 700; font-size: 1.35rem;
    }
    h1 { margin: 0; font-size: 1.35rem; font-weight: 700; }
    .sub { margin: 0.35rem 0 0; font-size: 0.875rem; color: var(--muted); }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    h2 { margin: 0; font-size: 1.1rem; }
    label {
      display: block; margin: 1rem 0 0.35rem;
      font-size: 0.8rem; color: var(--muted);
    }
    input {
      width: 100%; padding: 0.65rem 0.75rem;
      border: 1px solid var(--border); border-radius: 0.5rem;
      background: #0c0a09; color: var(--text); font-size: 1rem;
    }
    input:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
    button {
      width: 100%; margin-top: 1.25rem; padding: 0.7rem 1rem;
      border: none; border-radius: 0.5rem; cursor: pointer;
      font-size: 0.95rem; font-weight: 600;
    }
    .primary { background: var(--gold); color: #1c1917; }
    .primary:hover { background: var(--gold-hover); }
    .primary:disabled { opacity: 0.6; cursor: wait; }
    .secondary {
      margin-top: 0.75rem;
      background: transparent; color: var(--text);
      border: 1px solid var(--border);
    }
    .secondary:hover { border-color: var(--gold); color: var(--gold); }
    .divider {
      display: flex; align-items: center; gap: 0.75rem;
      margin: 1.25rem 0; color: var(--muted); font-size: 0.75rem;
    }
    .divider::before, .divider::after {
      content: ""; flex: 1; height: 1px; background: var(--border);
    }
    .err { color: var(--err); font-size: 0.875rem; margin: 0.75rem 0 0; }
    .foot {
      margin-top: 1.25rem; text-align: center;
      font-size: 0.75rem; color: var(--muted);
    }
    a { color: var(--gold); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <div class="mark" aria-hidden="true">N</div>
      <h1>Nguyễn AI</h1>
      <p class="sub">Đăng nhập để tiếp tục</p>
    </div>
    <div class="card">
      <h2>Đăng nhập</h2>
      <form id="login-form" novalidate>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" required placeholder="you@example.com" />
        <label for="password">Mật khẩu</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
        ${errorBlock}
        <p id="form-error" class="err" role="alert" hidden></p>
        <button type="submit" class="primary" id="submit-btn">Đăng nhập</button>
      </form>
      <div class="divider">hoặc</div>
      <button type="button" class="secondary" id="google-login">Đăng nhập với Google</button>
    </div>
    <p class="foot">
      Phòng đầu tư riêng tư ·
      <a href="https://invest.nguyenai.net/disclosure">Công bố rủi ro</a>
    </p>
  </div>
  <script>
    const REDIRECT = ${JSON.stringify(redirect)};
    const AUTH_BASE = '/v1/auth';
    const form = document.getElementById('login-form');
    const errEl = document.getElementById('form-error');
    const btn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.hidden = true;
      btn.disabled = true;
      const fd = new FormData(form);
      try {
        const res = await fetch(AUTH_BASE + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: fd.get('email'),
            password: fd.get('password'),
          }),
        });
        if (res.ok) {
          window.location.href = REDIRECT;
          return;
        }
        const payload = await res.json().catch(() => ({}));
        errEl.textContent = payload.error || 'Đăng nhập thất bại. Kiểm tra email và mật khẩu.';
        errEl.hidden = false;
      } catch {
        errEl.textContent = 'Không kết nối được máy chủ xác thực.';
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById('google-login').addEventListener('click', async () => {
      try {
        const begin = new URL(AUTH_BASE + '/oauth/google/begin', window.location.origin);
        begin.searchParams.set('redirect', REDIRECT);
        const res = await fetch(begin.toString(), { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (data.authorize_url) {
          window.location.href = data.authorize_url;
          return;
        }
        errEl.textContent = data.error || 'Google đăng nhập chưa cấu hình trên máy chủ.';
        errEl.hidden = false;
      } catch {
        errEl.textContent = 'Không bắt đầu được Google đăng nhập.';
        errEl.hidden = false;
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
