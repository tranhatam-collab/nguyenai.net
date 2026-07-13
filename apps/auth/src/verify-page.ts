/**
 * Email verification page — GET /verify?token=...
 *
 * Token is a ONE-TIME email secret (not a public certificate verification_id).
 * After reading query, strip token from address bar via history.replaceState.
 */
export function renderVerifyPage(opts: {
  token: string | null;
  status?: 'pending' | 'ok' | 'error';
  message?: string;
}): string {
  const token = opts.token ?? '';
  const tokenJson = JSON.stringify(token);
  const status = opts.status ?? 'pending';
  const msg = opts.message ?? '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <meta name="referrer" content="no-referrer" />
  <title>Xác minh email · Nguyễn AI</title>
  <style>
    :root { --bg:#0c0a09; --card:#1c1917; --text:#fafaf9; --muted:#a8a29e; --gold:#d4a017; --ok:#4ade80; --err:#f87171; }
    * { box-sizing: border-box; }
    body {
      margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      padding:1.5rem; font-family:"Segoe UI",system-ui,sans-serif; color:var(--text);
      background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,160,23,.18), transparent), var(--bg);
    }
    .card { width:100%; max-width:24rem; background:var(--card); border:1px solid #44403c; border-radius:.75rem; padding:1.5rem; text-align:center; }
    h1 { margin:0 0 .75rem; font-size:1.25rem; }
    p { color:var(--muted); font-size:.95rem; line-height:1.5; }
    .ok { color:var(--ok); }
    .err { color:var(--err); }
    a { color:var(--gold); }
    .btn {
      display:inline-block; margin-top:1.25rem; padding:.7rem 1.1rem; border-radius:.5rem;
      background:var(--gold); color:#1c1917; font-weight:600; text-decoration:none;
      min-height:44px; min-width:44px; line-height:1.2; padding-top:.85rem; padding-bottom:.85rem;
    }
  </style>
</head>
<body>
  <div class="card" id="box">
    <h1>Xác minh email</h1>
    <p id="msg" role="status" aria-live="polite">${status === 'pending' ? 'Đang xác minh…' : escapeHtml(msg)}</p>
    <p id="extra" hidden></p>
  </div>
  <script>
    (async () => {
      const token = ${tokenJson};
      // Strip secret from address bar immediately (history / referrer risk).
      // Covers both /verify?token=… and path form /verify/<token>.
      try {
        const u = new URL(window.location.href);
        if (u.searchParams.has('token') || u.pathname !== '/verify') {
          window.history.replaceState({}, '', '/verify');
        }
      } catch (_) {}

      const msg = document.getElementById('msg');
      const extra = document.getElementById('extra');
      if (!token) {
        msg.className = 'err';
        msg.textContent = 'Thiếu mã xác minh. Mở lại liên kết trong email.';
        return;
      }
      try {
        const res = await fetch('/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          referrerPolicy: 'no-referrer',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.verified) {
          msg.className = 'ok';
          msg.textContent = 'Email đã được xác minh thành công.';
          extra.hidden = false;
          extra.innerHTML = '';
          const a = document.createElement('a');
          a.className = 'btn';
          a.href = '/auth?redirect=' + encodeURIComponent('https://app.nguyenai.net/dashboard');
          a.textContent = 'Đăng nhập';
          extra.appendChild(a);
          return;
        }
        msg.className = 'err';
        // Generic message — do not distinguish used vs missing (enumeration)
        msg.textContent = 'Không xác minh được. Liên kết có thể đã dùng, hết hạn hoặc không hợp lệ.';
        extra.hidden = false;
        extra.innerHTML = '';
        const a = document.createElement('a');
        a.href = '/auth';
        a.textContent = 'Về trang đăng nhập';
        extra.appendChild(a);
      } catch {
        msg.className = 'err';
        msg.textContent = 'Tạm thời chưa thể kiểm tra. Vui lòng thử lại sau.';
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
