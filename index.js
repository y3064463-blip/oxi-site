// OXI HUB - Pure JS Real Instagram Clone (v3 - Gerçek Dosya Yükleme)

const style = document.createElement('style');
style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { background-color: #000; color: #fff; display: flex; justify-content: center; overflow-x: hidden; }
    #app { width: 100%; max-width: 470px; min-height: 100vh; position: relative; border-left: 1px solid #262626; border-right: 1px solid #262626; padding-bottom: 60px; }
    
    /* Doğrulama Ekranı */
    #auth-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    #auth-screen h1 { font-family: 'Brush Script MT', cursive; font-style: italic; font-size: 48px; margin-bottom: 20px; }
    .auth-box { background: #121212; padding: 30px; border-radius: 12px; border: 1px solid #262626; text-align: center; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #262626; position: sticky; top: 0; background: #000; z-index: 10; }
    .header h1 { font-size: 24px; font-family: 'Brush Script MT', cursive; font-style: italic; }
    .header-icons { font-size: 22px; display: flex; gap: 16px; cursor: pointer; }

    /* Hikayeler */
    .stories { display: flex; gap: 15px; padding: 12px 16px; border-bottom: 1px solid #262626; overflow-x: auto; scrollbar-width: none; }
    .story-wrapper { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0; }
    .story-ring { width: 66px; height: 66px; border-radius: 50%; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); padding: 3px; }
    .story-inner { width: 100%; height: 100%; background: #121212; border-radius: 50%; border: 2px solid #000; overflow: hidden; }
    .story-inner img, .story-inner video { width: 100%; height: 100%; object-fit: cover; }
    .story-name { font-size: 12px; color: #a8a8a8; max-width: 66px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .add-story-ring { background: transparent; border: 2px dashed #444; padding: 2px; }
    .add-story-inner { display: flex; align-items: center; justify-content: center; font-size: 32px; color: #a8a8a8; }

    /* Feed ve Postlar */
    .feed { display: flex; flex-direction: column; }
    .post { margin-bottom: 16px; border-bottom: 1px solid #262626; padding-bottom: 12px; }
    .post-header { display: flex; align-items: center; padding: 10px 16px; gap: 10px; }
    .post-avatar { width: 32px; height: 32px; border-radius: 50%; background: #444; }
    .post-author { font-weight: 600; font-size: 14px; }
    
    /* Medya (Resim/Video) İçeriği */
    .post-media { width: 100%; max-height: 580px; background: #000; display: flex; align-items: center; justify-content: center; border-top: 1px solid #262626; border-bottom: 1px solid #262626; overflow: hidden; }
    .post-media img, .post-media video { width: 100%; max-height: 580px; object-fit: contain; }
    
    .post-actions { padding: 12px 16px; display: flex; gap: 16px; font-size: 24px; cursor: pointer; }
    .post-likes { padding: 0 16px 6px 16px; font-size: 14px; font-weight: 600; }
    .post-caption { padding: 0 16px; font-size: 14px; line-height: 1.4; }
    .post-caption span.author { font-weight: 600; margin-right: 6px; }
    
    /* Bottom Nav */
    .bottom-nav { position: fixed; bottom: 0; width: 100%; max-width: 470px; display: flex; justify-content: space-around; padding: 12px; background: #000; border-top: 1px solid #262626; z-index: 10; font-size: 26px; }
    .nav-item { cursor: pointer; transition: transform 0.2s; }
    .nav-item:active { transform: scale(0.9); }
`;
document.head.appendChild(style);

// Sadece ilk girişte sorulacak doğrulama
const isVerified = sessionStorage.getItem('oxi_verified') === 'true';

if (!isVerified) {
    const authScreen = document.createElement('div');
    authScreen.id = 'auth-screen';
    authScreen.innerHTML = `
        <h1>OXI HUB</h1>
        <div class="auth-box">
            <p style="margin-bottom: 15px; color: #a8a8a8;">Devam etmek için robot olmadığınızı doğrulayın.</p>
            <div id="cf-widget"></div>
        </div>
    `;
    document.body.appendChild(authScreen);

    const cfScript = document.createElement('script');
    cfScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    cfScript.async = true;
    document.head.appendChild(cfScript);

    cfScript.onload = () => {
        turnstile.render('#cf-widget', {
            sitekey: '0x4AAAAAACrp-vJ1dat6gVsL', // Anahtarını buraya eklemeyi unutma
            callback: function(token) {
                sessionStorage.setItem('oxi_verified', 'true');
                document.getElementById('auth-screen').style.display = 'none';
                initApp();
            }
        });
    };
} else {
    initApp();
}

function initApp() {
    let app = document.getElementById('app');
    if (!app) {
        app = document.createElement('div');
        app.id = 'app';
        document.body.appendChild(app);
    }

    // Header
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `<h1>OXI HUB</h1><div class="header-icons"><span>🤍</span><span>💬</span></div>`;
    app.appendChild(header);

    // Hikayeler Konteyneri
    const stories = document.createElement('div');
    stories.className = 'stories';
    app.appendChild(stories);

    // Gizli Dosya Seçiciler (Kamera/Galeri için)
    const storyUploader = document.createElement('input');
    storyUploader.type = 'file';
    storyUploader.accept = 'image/*,video/*';
    storyUploader.style.display = 'none';
    document.body.appendChild(storyUploader);

    const postUploader = document.createElement('input');
    postUploader.type = 'file';
    postUploader.accept = 'image/*,video/*';
    postUploader.style.display = 'none';
    document.body.appendChild(postUploader);

    // Hikaye Ekle (+) Butonu
    const addStoryWrapper = document.createElement('div');
    addStoryWrapper.className = 'story-wrapper';
    addStoryWrapper.innerHTML = `
        <div class="story-ring add-story-ring">
            <div class="story-inner add-story-inner">+</div>
        </div>
        <div class="story-name">Hikayen</div>
    `;
    
    // Artık prompt değil, galeri açılıyor
    addStoryWrapper.addEventListener('click', () => {
        storyUploader.click();
    });
    stories.appendChild(addStoryWrapper);

    // Cihazdan hikaye seçildiğinde
    storyUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const mediaUrl = URL.createObjectURL(file); // Dosyayı geçici olarak tarayıcıya yükler
            const isVideo = file.type.startsWith('video/');
            addStoryToUI('Sen', mediaUrl, isVideo);
            // TODO: İleride bu file verisini Fetch ile backend'e (upload.js) yollayacağız
        }
    });

    // Hikayeyi Ekrana Basma Fonksiyonu (Gerçek Medya ile)
    window.addStoryToUI = function(name, mediaUrl, isVideo) {
        const userStory = document.createElement('div');
        userStory.className = 'story-wrapper';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'story-inner';
        
        if (isVideo) {
            innerDiv.innerHTML = `<video src="${mediaUrl}" autoplay muted loop playsinline></video>`;
        } else {
            innerDiv.innerHTML = `<img src="${mediaUrl}" alt="story">`;
        }

        const ring = document.createElement('div');
        ring.className = 'story-ring';
        ring.appendChild(innerDiv);

        userStory.appendChild(ring);
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'story-name';
        nameDiv.textContent = name;
        userStory.appendChild(nameDiv);

        // "Hikayen" butonunun sağına ekle
        stories.insertBefore(userStory, stories.children[1]);
    }

    // Gönderi Akışı (Feed) - İçi başlangıçta tamamen boş
    const feed = document.createElement('div');
    feed.className = 'feed';
    app.appendChild(feed);

    // Post Ekrana Basma Fonksiyonu (Gerçek Medya ile)
    function createPost(author, mediaUrl, isVideo, captionText) {
        const post = document.createElement('article');
        post.className = 'post';

        const pHeader = document.createElement('div');
        pHeader.className = 'post-header';
        pHeader.innerHTML = `<div class="post-avatar"></div><div class="post-author">${author}</div>`;
        post.appendChild(pHeader);

        // Gerçek Resim/Video Alanı
        const pMedia = document.createElement('div');
        pMedia.className = 'post-media';
        if (isVideo) {
            pMedia.innerHTML = `<video src="${mediaUrl}" controls playsinline></video>`;
        } else {
            pMedia.innerHTML = `<img src="${mediaUrl}" alt="post">`;
        }
        post.appendChild(pMedia);

        const pActions = document.createElement('div');
        pActions.className = 'post-actions';
        pActions.innerHTML = `<span>🤍</span><span>💬</span><span>✈️</span>`;
        post.appendChild(pActions);

        const pLikes = document.createElement('div');
        pLikes.className = 'post-likes';
        pLikes.textContent = `0 beğenme`;
        post.appendChild(pLikes);

        if(captionText) {
            const pCaption = document.createElement('div');
            pCaption.className = 'post-caption';
            
            const authorSpan = document.createElement('span');
            authorSpan.className = 'author';
            authorSpan.textContent = author; // XSS Korumalı
            
            const safeCaption = document.createElement('span');
            safeCaption.textContent = " " + captionText; // XSS Korumalı
            
            pCaption.appendChild(authorSpan);
            pCaption.appendChild(safeCaption);
            post.appendChild(pCaption);
        }

        feed.prepend(post); // Akışın en üstüne ekler
    }

    // Alt Navigasyon Barı
    const nav = document.createElement('div');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
        <div class="nav-item" title="Ana Sayfa">🏠</div>
        <div class="nav-item" title="Ara">🔍</div>
        <div class="nav-item" id="add-post-btn" title="Yeni Gönderi">➕</div>
        <div class="nav-item" id="add-reels-btn" title="Reels">🎬</div>
        <div class="nav-item" title="Profil">👤</div>
    `;
    app.appendChild(nav);

    // Yeni Gönderi (Post) Yükleme Olayı
    document.getElementById('add-post-btn').addEventListener('click', () => {
        postUploader.accept = 'image/*,video/*'; // Hem resim hem video seçilebilir
        postUploader.click();
    });

    // Reels Yükleme Olayı (Sadece Video)
    document.getElementById('add-reels-btn').addEventListener('click', () => {
        postUploader.accept = 'video/*'; // Sadece video seçilebilir
        postUploader.click();
    });

    // Cihazdan Post/Reels seçildiğinde
    postUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const mediaUrl = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            const caption = prompt("Bu gönderi için bir açıklama yaz (isteğe bağlı):");
            
            createPost('senin_hesabin', mediaUrl, isVideo, caption);
            // TODO: İleride FormData kullanıp bu dosyayı backend API'sine kaydedeceğiz
        }
    });
}