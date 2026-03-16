(() => {
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
  const ADMIN_EMAIL_HINT = '';

  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#0a0f17;--panel:#101722;--panel2:#0e1520;--line:#202d42;--txt:#ebf2ff;--muted:#98abc8;--accent:#6ab5ff;}
    :root.light{--bg:#f3f6fb;--panel:#fff;--panel2:#f7faff;--line:#d6e0ee;--txt:#0f1d34;--muted:#5f7697;--accent:#2f6fff}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font-family:Inter,system-ui,sans-serif}
    .top{height:72px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:var(--panel)}
    .logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:40px;letter-spacing:1px}.logo span{color:#65c234}
    .menu{display:flex;gap:34px;font-weight:700;font-size:36px}
    .layout{display:grid;grid-template-columns:88px 1fr 340px;gap:14px;max-width:1700px;margin:auto;padding:16px}
    .side{background:#070d17;border:1px solid var(--line);border-radius:14px;padding:14px;display:grid;gap:18px;align-content:start;justify-items:center}
    .ico{width:42px;height:42px;border:1px solid var(--line);border-radius:12px;display:grid;place-items:center;color:var(--muted);font-size:20px}
    .main,.right{display:grid;gap:14px}
    .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px}
    .stories{display:flex;gap:12px;overflow:auto;padding-bottom:8px}.story{min-width:86px;text-align:center;font-size:12px;color:var(--muted)}
    .ring{width:74px;height:74px;border-radius:50%;padding:2px;background:conic-gradient(#ffb000,#ff2c7d,#7f4dff,#ffb000)}
    .ring img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid var(--panel)}
    .post img,.post video{width:100%;max-height:560px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
    .muted{color:var(--muted)} .small{font-size:12px}
    .btn{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel2);color:var(--txt);font-weight:700;cursor:pointer}
    .btn.primary{background:var(--accent);color:#05101f;border:none}
    input,textarea,select{width:100%;margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--txt)}
    textarea{min-height:90px}.profile{display:grid;gap:10px}.cover{height:108px;border-radius:10px;border:1px solid var(--line);background:#1f2e47 center/cover no-repeat;position:relative}
    .avatar{position:absolute;left:12px;bottom:-22px;width:48px;height:48px;border-radius:50%;border:2px solid var(--panel);object-fit:cover;background:#22344f}
    .pbody{padding-top:26px}.msg{display:flex;justify-content:space-between;align-items:center;border-radius:999px;padding:14px 18px;background:var(--panel2);border:1px solid var(--line)}
    @media(max-width:1200px){.layout{grid-template-columns:72px 1fr}.right{grid-column:1/-1}}
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
    let i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${u[i]}`;
  };

  const api = async (url, opts = {}) => {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };

  const fileToBase64 = (file) => new Promise((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = bad;
    r.readAsDataURL(file);
  });

  async function upload(file, section) {
    const base64 = await fileToBase64(file);
    const data = await api('/api/uploads/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: state.idToken, fileName: file.name, mimeType: file.type, size: file.size, base64, section })
    });
    return data.file;
  }

  async function loadAll() {
    const [blog, apps, profiles] = await Promise.allSettled([
      api('/api/blog/list'), api('/api/apps/list'), api('/api/profile/list')
    ]);
    state.posts = blog.status === 'fulfilled' ? blog.value.posts || [] : [];
    state.apps = apps.status === 'fulfilled' ? apps.value.apps || [] : [];
    state.profiles = profiles.status === 'fulfilled' ? profiles.value.profiles || [] : [];
    if (state.idToken) {
      try {
        state.myProfile = await api('/api/profile/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken }) });
      } catch { state.myProfile = null; }
    }
  }

  async function render() {
    app.innerHTML = '';
    const top = h('header', 'top');
    const logo = h('div', 'logo', `TECHN<span>O</span>PAT`);
    const menu = h('nav', 'menu', `<span>HABER</span><span>YAPAY ZEKA</span><span>TAVSİYELER</span><span>OYUN</span><span>VİDEO</span><span>TEKNOLOJİ</span><span>SOSYAL</span>`);
    const actions = h('div', '', `<button id='themeBtn' class='btn'>${state.theme === 'dark' ? '🌙' : '☀️'}</button>`);
    top.append(logo, menu, actions);

    const layout = h('section', 'layout');
    const side = h('aside', 'side', `<div class='ico'>⌂</div><div class='ico'>▶</div><div class='ico'>✈</div><div class='ico'>⌕</div><div class='ico'>♡</div><div class='ico'>＋</div><div class='ico'>☰</div>`);
    const main = h('main', 'main');
    const right = h('aside', 'right');

    const stories = h('div', 'card', `<div class='muted small'>Senin için · Takip ettiklerin</div><div class='stories' id='stories'></div>`);
    const storiesWrap = stories.querySelector('#stories');
    state.profiles.slice(0, 10).forEach((p) => {
      const s = h('div', 'story', `<div class='ring'><img src='${p.avatarUrl || 'https://picsum.photos/100'}' alt=''></div><div>${(p.username || 'user').slice(0, 9)}</div>`);
      storiesWrap.appendChild(s);
    });

    const feed = h('div', 'card', `<div id='posts'></div>`);
    const postsEl = feed.querySelector('#posts');
    if (!state.posts.length) postsEl.innerHTML = `<p class='muted small'>Henüz gönderi yok.</p>`;
    state.posts.forEach((p) => {
      const media = (p.media || []).map((m) => (m.mimeType || '').startsWith('image/')
        ? `<img src='${m.url}' alt='media'>`
        : (m.mimeType || '').startsWith('video/')
          ? `<video controls src='${m.url}'></video>`
          : `<a href='${m.url}' target='_blank'>📎 ${m.name} (${fmt(m.size)})</a>`).join('');
      postsEl.appendChild(h('article', 'post', `<h3>${p.title}</h3><p class='small muted'>${p.author?.name || p.author?.email || 'üye'} · ${new Date(p.createdAt).toLocaleString('tr-TR')}</p><p>${p.content}</p>${media}`));
    });

    const composer = h('div', 'card', `<h3>Blog gönderisi oluştur</h3><p class='small muted'>Giriş yapan herkes paylaşabilir. Toplam dosya sınırı: 150MB.</p>`);
    if (!state.idToken) {
      composer.appendChild(h('p', 'small muted', 'Google ile giriş yapman gerekiyor.'));
    } else {
      const t = h('input'); t.placeholder = 'Başlık';
      const c = h('textarea'); c.placeholder = 'İçerik';
      const f = h('input'); f.type = 'file'; f.multiple = true;
      const info = h('p', 'small muted');
      const b = h('button', 'btn primary', 'Yayınla');
      f.onchange = () => {
        state.files = [...f.files];
        info.textContent = `${state.files.length} dosya · ${fmt(state.files.reduce((a, x) => a + x.size, 0))}`;
      };
      b.onclick = async () => {
        try {
          const total = state.files.reduce((a, x) => a + x.size, 0);
          if (total > MB150) throw new Error('150MB sınırı aşıldı');
          const media = [];
          for (const file of state.files) media.push(await upload(file, 'blog'));
          await api('/api/blog/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken, title: t.value, content: c.value, media }) });
          await loadAll();
          render();
        } catch (e) { alert(e.message || 'Kaydedilemedi'); }
      };
      composer.append(t, c, f, info, b);
    }

    const msg = h('div', 'msg', `<strong>Mesajlar</strong><span>🔥 🎮 🤖</span>`);

    const profileCard = h('div', 'card', `<h3>Profil (Instagram benzeri)</h3><div id='plist' class='profile'></div>`);
    const plist = profileCard.querySelector('#plist');
    state.profiles.forEach((p) => {
      plist.appendChild(h('div', 'profile', `<div class='cover' style="background-image:url('${p.coverUrl || ''}')">${p.avatarUrl ? `<img class='avatar' src='${p.avatarUrl}'>` : ''}</div><div class='pbody'><strong>${p.name || 'İsimsiz'}</strong> <span class='small muted'>@${p.username || 'user'}</span><div class='small'>${p.bio || ''}</div></div>`));
    });

    const me = h('div', 'card', '<h3>Profilimi düzenle</h3>');
    if (!state.idToken) {
      me.appendChild(h('p', 'small muted', 'Düzenleme için giriş yap.'));
    } else {
      const p = state.myProfile || {};
      const name = h('input'); name.value = p.name || state.user?.name || '';
      const username = h('input'); username.value = p.username || '';
      const bio = h('textarea'); bio.value = p.bio || '';
      const privacy = h('select'); privacy.innerHTML = `<option value='public' ${p.isPrivate ? '' : 'selected'}>Herkese Açık</option><option value='private' ${p.isPrivate ? 'selected' : ''}>Gizli</option>`;
      const avatar = h('input'); avatar.type = 'file'; avatar.accept = 'image/*';
      const cover = h('input'); cover.type = 'file'; cover.accept = 'image/*';
      const save = h('button', 'btn primary', 'Kaydet');
      save.onclick = async () => {
        try {
          let avatarUrl = p.avatarUrl || '';
          let coverUrl = p.coverUrl || '';
          if (avatar.files[0]) avatarUrl = (await upload(avatar.files[0], 'profile')).url;
          if (cover.files[0]) coverUrl = (await upload(cover.files[0], 'profile')).url;
          await api('/api/profile/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: state.idToken, profile: { name: name.value, username: username.value, bio: bio.value, avatarUrl, coverUrl, isPrivate: privacy.value === 'private' } }) });
          await loadAll();
          render();
        } catch (e) { alert(e.message || 'Profil kaydedilemedi'); }
      };
      me.append(name, username, bio, privacy, avatar, cover, save);
    }

    const apps = h('div', 'card', '<h3>Uygulamalar</h3>');
    state.apps.forEach((a) => apps.appendChild(h('div', 'small', `<strong>${a.name}</strong> — ${a.description}`)));

    const appAdmin = h('div', 'card', '<h3>Uygulama ekle (sadece sen)</h3>');
    const canAdmin = state.user && ADMIN_EMAIL_HINT && state.user.email === ADMIN_EMAIL_HINT;
    if (!canAdmin) appAdmin.appendChild(h('p', 'small muted', 'Bu alan sadece sana açık. Sunucu ayrıca ADMIN_EMAIL ile koruyor.'));

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
    const out = h('button', 'btn', 'Çıkış');
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

  loadAll().then(render);
})();
