(() => {
  const TURNSTILE_SITE_KEY = '0x4AAAAAACrp-vJ1dat6gVsL';

  const state = {
    user: null,
    idToken: null,
    theme: localStorage.getItem('theme') || 'dark',
    posts: [],
    apps: [],
    profiles: [],
    myProfile: null,
    files: []
  };

  const MB150 = 150 * 1024 * 1024;
  const ADMIN_EMAIL_HINT = 'imahmut979@gmail.com';

  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#0f1115;--panel:#161b22;--panel2:#1f2630;--line:#2b3440;--txt:#f5f7fb;--muted:#96a4b7;--accent:#4d8dff;--danger:#ff6b7d}
    :root.light{--bg:#f5f7fb;--panel:#ffffff;--panel2:#f3f6fa;--line:#dfe5ef;--txt:#162031;--muted:#607088;--accent:#336dff;--danger:#d94057}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font-family:Inter,system-ui,sans-serif}
    .top{position:sticky;top:0;height:66px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(8px);z-index:20}
    .top-inner{width:min(1120px,100%);display:flex;align-items:center;justify-content:space-between;padding:0 16px}
    .logo{font-weight:800;font-size:26px;letter-spacing:.3px}.logo span{font-weight:500;color:var(--muted)}
    .layout{display:grid;grid-template-columns:240px minmax(420px,620px) 320px;gap:24px;width:min(1180px,100%);margin:auto;padding:18px 14px}
    .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px}
    .side{display:grid;gap:10px;align-content:start;position:sticky;top:84px;height:max-content}
    .nav-btn{display:flex;gap:10px;align-items:center;border:1px solid transparent;background:transparent;color:var(--txt);padding:10px;border-radius:12px;font-weight:700}
    .nav-btn:hover{background:var(--panel2);border-color:var(--line)}
    .feed{display:grid;gap:16px}.stories{display:flex;gap:12px;overflow:auto;padding-bottom:4px}
    .story{min-width:76px;text-align:center;font-size:12px;color:var(--muted)}
    .ring{width:64px;height:64px;border-radius:50%;padding:2px;background:conic-gradient(#f9ce34,#ee2a7b,#6228d7,#f9ce34)}
    .ring img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid var(--panel)}
    .post{display:grid;gap:10px}.post-head{display:flex;align-items:center;gap:10px}.ava{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#334}
    .post img,.post video{width:100%;max-height:620px;border-radius:10px;object-fit:cover;border:1px solid var(--line)}
    .small{font-size:12px}.muted{color:var(--muted)}
    .btn{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel2);color:var(--txt);font-weight:700;cursor:pointer}
    .btn.primary{background:var(--accent);color:#fff;border-color:transparent}.btn.warn{background:var(--danger);color:#fff;border-color:transparent}
    input,textarea,select{width:100%;margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--txt)}
    textarea{min-height:90px}
    .profile{display:grid;gap:10px}.cover{height:90px;border-radius:10px;border:1px solid var(--line);background:#24334d center/cover no-repeat;position:relative}
    .avatar{position:absolute;left:10px;bottom:-16px;width:40px;height:40px;border-radius:50%;border:2px solid var(--panel);object-fit:cover;background:#22344f}
    .pbody{padding-top:18px}.divider{height:1px;background:var(--line);margin:8px 0}
    @media(max-width:1100px){.layout{grid-template-columns:1fr 320px}.side{display:none}}
    @media(max-width:850px){.layout{grid-template-columns:1fr}.right{order:-1}}
  `;
  document.head.appendChild(style);
  if (state.theme === 'light') document.documentElement.classList.add('light');

  const app = document.createElement('div');
  document.body.appendChild(app);

  const h = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };

  const fmt = (n) => {
    if (!n) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < u.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(1)} ${u[i]}`;
  };

  const api = async (url, opts = {}) => {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };

  const fileToBase64 = (file) => new Promise((ok, bad) => {
    const reader = new FileReader();
    reader.onload = () => ok(String(reader.result).split(',')[1]);
    reader.onerror = bad;
    reader.readAsDataURL(file);
  });

  const renderTurnstile = (container) => new Promise((resolve, reject) => {
    const waitAndRender = () => {
      if (!window.turnstile || !container) return setTimeout(waitAndRender, 80);
      const widgetId = window.turnstile.render(container, { sitekey: TURNSTILE_SITE_KEY, theme: state.theme === 'dark' ? 'dark' : 'light' });
      resolve({
        getToken: () => window.turnstile.getResponse(widgetId),
        reset: () => window.turnstile.reset(widgetId)
      });
    };
    try { waitAndRender(); } catch (e) { reject(e); }
  });

  async function upload(file, section, turnstileToken) {
    const base64 = await fileToBase64(file);
    const data = await api('/api/uploads/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: state.idToken, turnstileToken, fileName: file.name, mimeType: file.type, size: file.size, base64, section })
    });
    return data.file;
  }

  async function loadAll() {
    const [blog, apps, profiles] = await Promise.allSettled([api('/api/blog/list'), api('/api/apps/list'), api('/api/profile/list')]);
    state.posts = blog.status === 'fulfilled' ? blog.value.posts || [] : [];
    state.apps = apps.status === 'fulfilled' ? apps.value.apps || [] : [];
    state.profiles = profiles.status === 'fulfilled' ? profiles.value.profiles || [] : [];
    if (state.idToken) {
      try {
        state.myProfile = await api('/api/profile/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken }) });
      } catch {
        state.myProfile = null;
      }
    }
  }

  async function render() {
    app.innerHTML = '';

    const top = h('header', 'top');
    const topInner = h('div', 'top-inner');
    const logo = h('div', 'logo', 'OXI <span>Social</span>');
    const actions = h('div', '', `<button id='themeBtn' class='btn'>${state.theme === 'dark' ? '🌙' : '☀️'}</button>`);
    topInner.append(logo, actions);
    top.appendChild(topInner);

    const layout = h('section', 'layout');

    const side = h('aside', 'side card');
    ['🏠 Ana Sayfa', '🔎 Keşfet', '🎬 Reels', '✉️ Mesajlar', '❤️ Bildirimler', '➕ Oluştur', '👤 Profil'].forEach((label) => {
      side.appendChild(h('button', 'nav-btn', label));
    });

    const main = h('main', 'feed');
    const right = h('aside', 'right');

    const stories = h('div', 'card stories');
    const storyPool = state.profiles.length ? state.profiles : [{ username: 'you' }, { username: 'friend' }, { username: 'tech' }];
    storyPool.slice(0, 12).forEach((p) => {
      const s = h('div', 'story', `<div class='ring'><img src='${p.avatarUrl || 'https://picsum.photos/80'}' alt=''></div><div>${(p.username || 'user').slice(0, 9)}</div>`);
      stories.appendChild(s);
    });

    const feed = h('div', 'card', `<div id='posts'></div>`);
    const postsEl = feed.querySelector('#posts');
    if (!state.posts.length) postsEl.innerHTML = `<p class='muted small'>Henüz gönderi yok.</p>`;
    state.posts.forEach((p) => {
      const media = (p.media || []).map((m) => ((m.mimeType || '').startsWith('image/')
        ? `<img src='${m.url}' alt='media'>`
        : (m.mimeType || '').startsWith('video/')
          ? `<video controls src='${m.url}'></video>`
          : `<a href='${m.url}' target='_blank' rel='noreferrer'>📎 ${m.name} (${fmt(m.size)})</a>`)).join('');
      postsEl.appendChild(h('article', 'post', `<div class='post-head'><img class='ava' src='${p.author?.avatarUrl || 'https://picsum.photos/60'}'><div><strong>${p.author?.name || p.author?.email || 'üye'}</strong><div class='small muted'>${new Date(p.createdAt).toLocaleString('tr-TR')}</div></div></div><h3>${p.title}</h3><p>${p.content}</p>${media}`));
      postsEl.appendChild(h('div', 'divider'));
    });

    const composer = h('div', 'card', `<h3>Yeni gönderi</h3><p class='small muted'>Instagram hissiyatında paylaşım · dosya limiti 150MB</p>`);
    if (!state.idToken) {
      composer.appendChild(h('p', 'small muted', 'Paylaşım için Google ile giriş yapman gerekiyor.'));
    } else {
      const t = h('input');
      t.placeholder = 'Başlık';
      const c = h('textarea');
      c.placeholder = 'Ne düşünüyorsun?';
      const f = h('input');
      f.type = 'file';
      f.multiple = true;
      const info = h('p', 'small muted', '0 dosya');
      const turnstileBox = h('div', '');
      const b = h('button', 'btn primary', 'Paylaş');
      let turnstile;
      renderTurnstile(turnstileBox).then((x) => { turnstile = x; }).catch(() => {
        info.textContent = 'Turnstile yüklenemedi';
      });

      f.onchange = () => {
        state.files = [...f.files];
        info.textContent = `${state.files.length} dosya · ${fmt(state.files.reduce((a, x) => a + x.size, 0))}`;
      };
      b.onclick = async () => {
        try {
          const total = state.files.reduce((a, x) => a + x.size, 0);
          if (total > MB150) throw new Error('150MB sınırı aşıldı');
          const turnstileToken = turnstile?.getToken?.();
          if (!turnstileToken) throw new Error('Lütfen Turnstile doğrulamasını tamamla.');
          const media = [];
          for (const file of state.files) media.push(await upload(file, 'blog', turnstileToken));
          await api('/api/blog/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken, turnstileToken, title: t.value, content: c.value, media }) });
          await loadAll();
          state.files = [];
          render();
        } catch (e) {
          alert(e.message || 'Kaydedilemedi');
          turnstile?.reset?.();
        }
      };
      composer.append(t, c, f, info, turnstileBox, b);
    }

    const msg = h('div', 'card', `<strong>Mesajlar</strong><p class='muted small'>🔥 Tasarım, 🤖 AI, 🎮 oyun sohbetleri</p>`);

    const profileCard = h('div', 'card', `<h3>Önerilen Profiller</h3><div id='plist' class='profile'></div>`);
    const plist = profileCard.querySelector('#plist');
    state.profiles.forEach((p) => {
      plist.appendChild(h('div', 'profile', `<div class='cover' style="background-image:url('${p.coverUrl || ''}')">${p.avatarUrl ? `<img class='avatar' src='${p.avatarUrl}'>` : ''}</div><div class='pbody'><strong>${p.name || 'İsimsiz'}</strong> <span class='small muted'>@${p.username || 'user'}</span><div class='small'>${p.bio || ''}</div></div>`));
    });

    const me = h('div', 'card', '<h3>Profilimi düzenle</h3>');
    if (!state.idToken) {
      me.appendChild(h('p', 'small muted', 'Düzenleme için giriş yap.'));
    } else {
      const p = state.myProfile || {};
      const name = h('input');
      name.value = p.name || state.user?.name || '';
      const username = h('input');
      username.value = p.username || '';
      const bio = h('textarea');
      bio.value = p.bio || '';
      const privacy = h('select');
      privacy.innerHTML = `<option value='public' ${p.isPrivate ? '' : 'selected'}>Herkese Açık</option><option value='private' ${p.isPrivate ? 'selected' : ''}>Gizli</option>`;
      const avatar = h('input');
      avatar.type = 'file';
      avatar.accept = 'image/*';
      const cover = h('input');
      cover.type = 'file';
      cover.accept = 'image/*';
      const turnstileBox = h('div');
      const save = h('button', 'btn primary', 'Kaydet');
      let turnstile;
      renderTurnstile(turnstileBox).then((x) => { turnstile = x; });
      save.onclick = async () => {
        try {
          const turnstileToken = turnstile?.getToken?.();
          if (!turnstileToken) throw new Error('Lütfen Turnstile doğrulamasını tamamla.');
          let avatarUrl = p.avatarUrl || '';
          let coverUrl = p.coverUrl || '';
          if (avatar.files[0]) avatarUrl = (await upload(avatar.files[0], 'profile', turnstileToken)).url;
          if (cover.files[0]) coverUrl = (await upload(cover.files[0], 'profile', turnstileToken)).url;
          await api('/api/profile/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken, turnstileToken, profile: { name: name.value, username: username.value, bio: bio.value, avatarUrl, coverUrl, isPrivate: privacy.value === 'private' } }) });
          await loadAll();
          render();
        } catch (e) {
          alert(e.message || 'Profil kaydedilemedi');
          turnstile?.reset?.();
        }
      };
      me.append(name, username, bio, privacy, avatar, cover, turnstileBox, save);
    }

    const apps = h('div', 'card', '<h3>Uygulamalar</h3>');
    state.apps.forEach((a) => apps.appendChild(h('div', 'small', `<strong>${a.name}</strong> — ${a.description}`)));

    const appAdmin = h('div', 'card', '<h3>Uygulama ekle (sadece sen)</h3>');
    const canAdmin = state.user && ADMIN_EMAIL_HINT && state.user.email === ADMIN_EMAIL_HINT;
    if (!canAdmin) {
      appAdmin.appendChild(h('p', 'small muted', 'Bu alan sadece sana açık. Sunucu ayrıca ADMIN_EMAIL ile koruyor.'));
    } else {
      const name = h('input');
      name.placeholder = 'Uygulama adı';
      const desc = h('textarea');
      desc.placeholder = 'Açıklama';
      const url = h('input');
      url.placeholder = 'https://...';
      const turnstileBox = h('div');
      const save = h('button', 'btn primary', 'Ekle');
      let turnstile;
      renderTurnstile(turnstileBox).then((x) => { turnstile = x; });
      save.onclick = async () => {
        try {
          const turnstileToken = turnstile?.getToken?.();
          if (!turnstileToken) throw new Error('Turnstile doğrulaması gerekli.');
          await api('/api/apps/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken, turnstileToken, name: name.value, description: desc.value, url: url.value }) });
          await loadAll();
          render();
        } catch (e) {
          alert(e.message || 'Uygulama eklenemedi');
          turnstile?.reset?.();
        }
      };
      appAdmin.append(name, desc, url, turnstileBox, save);
    }

    main.append(stories, feed, composer);
    right.append(msg, profileCard, me, apps, appAdmin);
    layout.append(side, main, right);

    app.append(top, layout);

    document.getElementById('themeBtn').onclick = () => {
      document.documentElement.classList.toggle('light');
      state.theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
      render();
    };

    renderAuthButton(actions);
  }

  function renderAuthButton(actions) {
    if (!state.idToken) {
      const holder = h('div');
      holder.innerHTML = `<div id='g_id_onload' data-client_id='980583011173-nf81b7cj5k36b3m14v0gv7mv59asfk7t.apps.googleusercontent.com' data-callback='onGoogleSignIn'></div><div class='g_id_signin' data-type='standard'></div>`;
      actions.appendChild(holder);
      return;
    }
    const out = h('button', 'btn warn', 'Çıkış');
    out.onclick = async () => {
      state.user = null;
      state.idToken = null;
      state.myProfile = null;
      await loadAll();
      render();
    };
    actions.appendChild(out);
  }

  function decodeJwt(token) {
    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(p).split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join('')));
  }

  window.onGoogleSignIn = async (response) => {
    const user = decodeJwt(response.credential);
    state.user = { email: user.email, name: user.name };
    state.idToken = response.credential;
    await loadAll();
    render();
  };

  const gsi = document.createElement('script');
  gsi.src = 'https://accounts.google.com/gsi/client';
  gsi.async = true;
  gsi.defer = true;
  document.head.appendChild(gsi);

  const turnstileScript = document.createElement('script');
  turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  turnstileScript.async = true;
  turnstileScript.defer = true;
  document.head.appendChild(turnstileScript);

  loadAll().then(render);
})();
