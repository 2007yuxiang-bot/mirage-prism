/* ════════════════════════════════════════════════
   MIRAGE PRISM — app.js
   FFXIV Glamour Sharing Platform
   - XIVAPI live gear search
   - localStorage publish & gallery
   - Favorites system & Report system
   - Leaderboard & Admin backend
════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────
   CONSTANTS
───────────────────────────────────── */
const STORAGE_KEY     = 'all_posts';
const FAVORITES_KEY   = 'my_favorites';
const XIVAPI          = 'https://v2.xivapi.com';

// Supabase 雲端資料庫連線資訊 (填入後自動啟用全球分享，未填寫則自動使用 LocalStorage 本地版)
const SUPABASE_URL     = 'https://asfxnvkowtaewijzdrrv.supabase.co';
const SUPABASE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZnhudmtvd3RhZXdpanpkcnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTE4MjIsImV4cCI6MjA5NjgyNzgyMn0.ZVE001GMeEil6lZxK0jL9j3prQqnKFuhOexqsLY207w';

let supabase = null;
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
  if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('YOUR_') && SUPABASE_URL.trim() !== '') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

function isSupabaseConfigured() {
  return supabase !== null;
}

const SLOTS = [
  { id: 'weapon', label: '武器',   icon: 'fa-khanda'       },
  { id: 'head',   label: '頭部',   icon: 'fa-crown'        },
  { id: 'body',   label: '身體',   icon: 'fa-shirt'        },
  { id: 'hands',  label: '手部',   icon: 'fa-mitten'       },
  { id: 'legs',   label: '腿部',   icon: 'fa-socks'        },
  { id: 'feet',   label: '腳部',   icon: 'fa-shoe-prints'  },
];

const ROLE_COLORS = {
  '坦克':    { accent: '#5b9bd5', grad: 'linear-gradient(135deg,#0d2a5e,#1e4fa8)' },
  '治療':    { accent: '#5bcc85', grad: 'linear-gradient(135deg,#0d3d1e,#1e8045)' },
  '近戰輸出':{ accent: '#e8825a', grad: 'linear-gradient(135deg,#5e1a05,#c04020)' },
  '遠程物理':{ accent: '#60a8e0', grad: 'linear-gradient(135deg,#0f2040,#2558a8)' },
  '法系輸出':{ accent: '#a06ae0', grad: 'linear-gradient(135deg,#2a0d5e,#6020c0)' },
  '通用':    { accent: '#d4a020', grad: 'linear-gradient(135deg,#3a2200,#a06000)' },
};

// Default posts cleared out as requested
const DEFAULT_POSTS = [];

/* ─────────────────────────────────────
   STATE
───────────────────────────────────── */
const state = {
  view:            'gallery',
  activeSlot:      'head',
  race:            'hyur',
  gender:          'female',
  screenshot:      null,        // base64 data URL
  posts:           [],
  favorites:       [],
  currentDetailId: null,
  editingPostId:   null,        // ID of post currently being edited
  equipped: Object.fromEntries(SLOTS.map(s => [s.id, null])),
};

/* ─────────────────────────────────────
   DOM HELPER
───────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ─────────────────────────────────────
   ENTRY POINT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadFavorites();
  buildSlotTabs();
  buildSlotPips();
  bindEvents();
  bindUploadEvents();
  renderEquippedList();
  switchView('gallery');
});

/* ════════════════════════════════════════════════
   VIEW SWITCHING
════════════════════════════════════════════════ */
function switchView(view) {
  state.view = view;
  const isGallery    = view === 'gallery';
  const isFavorites  = view === 'favorites';
  const isMyGlamours = view === 'my_glamours';
  const isEditor     = view === 'editor';
  const isAdmin      = view === 'admin';

  $('tab-gallery').classList.toggle('active', isGallery);
  $('tab-favorites').classList.toggle('active', isFavorites);
  $('btn-my-glamours').classList.toggle('active', isMyGlamours);
  $('tab-editor').classList.toggle('active', isEditor);
  $('btn-admin').classList.toggle('active', isAdmin);

  $('gallery-container').style.display     = (isGallery || isFavorites) ? 'block' : 'none';
  $('my-glamours-container').style.display  = isMyGlamours ? 'block' : 'none';
  $('editor-container').style.display      = isEditor ? 'block' : 'none';
  $('admin-container').style.display       = isAdmin ? 'block' : 'none';
  $('editor-actions').style.display        = isEditor ? 'flex' : 'none';

  // Customize Gallery Hero text depending on Gallery vs Favorites
  if (isFavorites) {
    document.querySelector('.gallery-hero h2').textContent = '✦ MY FAVORITES ✦';
    document.querySelector('.gallery-hero p').textContent = '您的個人收藏幻化搭配';
  } else if (isGallery) {
    document.querySelector('.gallery-hero h2').textContent = '✦ EORZEA GLAMOURS ✦';
    document.querySelector('.gallery-hero p').textContent = '探索光之戰士的時尚穿搭方案';
  }

  if (isGallery || isFavorites) {
    renderGallery();
  } else if (isMyGlamours) {
    renderMyGlamours();
  } else if (isAdmin) {
    renderAdminPanel();
  }

  // Restore editor save button if switching away from editor while not editing
  if (view !== 'editor' && !state.editingPostId) {
    const saveBtn = $('btn-save-set');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>發布幻化至大廳</span>';
      saveBtn.style.background = '';
    }
  }
}

/* ════════════════════════════════════════════════
   GALLERY — Render cards from localStorage
════════════════════════════════════════════════ */
function renderGallery() {
  const search = $('gallery-search').value.trim().toLowerCase();
  const role   = $('gallery-role-filter').value;
  const sort   = $('gallery-sort-filter').value;
  const grid   = $('gallery-grid');

  let filtered = [...state.posts];

  // 1. Filter out reported posts for normal viewing
  filtered = filtered.filter(p => !p.reported);

  // 2. Filter by role
  if (role !== '全部') {
    filtered = filtered.filter(p => p.role === role);
  }

  // 3. Filter by search query
  if (search) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
  }

  // 4. Filter by Favorites view
  if (state.view === 'favorites') {
    filtered = filtered.filter(p => state.favorites.includes(p.id));
  }

  // 5. Rank / Leaderboard sorting
  const now = new Date();
  if (sort === 'weekly') {
    // Within last 7 days
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= oneWeekAgo);
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sort === 'monthly') {
    // Within last 30 days
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= oneMonthAgo);
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sort === 'most_liked') {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else {
    // newest: sort by createdAt descending
    filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  // Render empty state
  if (!filtered.length) {
    if (state.view === 'favorites') {
      grid.innerHTML = `
        <div class="gallery-empty">
          <i class="fa-solid fa-star" style="color:var(--faint);"></i>
          <span>您的收藏夾目前空空如也</span>
          <small>快去大廳探索並點擊 ⭐ 收藏吧！</small>
        </div>`;
    } else {
      grid.innerHTML = `
        <div class="gallery-empty">
          <i class="fa-solid fa-scroll"></i>
          <span>目前尚無幻化分享，快去發布第一篇吧！</span>
          <small>點擊右上角「發布穿搭」上傳您的幻化。</small>
        </div>`;
    }
    return;
  }

  grid.innerHTML = filtered.map(post => {
    const rc    = ROLE_COLORS[post.role] || ROLE_COLORS['通用'];
    const count = Object.values(post.equipped).filter(Boolean).length;
    const isFav = state.favorites.includes(post.id);

    const imgHtml = post.screenshot
      ? `<img src="${post.screenshot}" alt="${post.name}" loading="lazy">`
      : `<div class="card-placeholder" style="background:${rc.grad}">
           <i class="fa-solid fa-shirt" style="color:${rc.accent}"></i>
         </div>`;

    return `
      <div class="glamour-card" data-post-id="${post.id}">
        <div class="glamour-card-image">
          ${imgHtml}
          <div class="card-action-overlay">
            <button class="card-overlay-btn fav-btn ${isFav ? 'active' : ''}" data-post-id="${post.id}" title="${isFav ? '取消收藏' : '收藏'}">
              <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
            <button class="card-overlay-btn report-btn" data-post-id="${post.id}" title="檢舉此穿搭">
              <i class="fa-solid fa-circle-exclamation"></i>
            </button>
          </div>
        </div>
        <div class="glamour-card-content">
          <h3 class="glamour-card-title">${escHtml(post.name)}</h3>
          <div class="glamour-card-footer">
            <span class="glamour-card-role" style="border-color:${rc.accent};color:${rc.accent}">${post.role}</span>
            <span class="glamour-card-meta"><i class="fa-solid fa-shirt"></i> ${count}/6</span>
            <button class="card-like-btn ${getLikedPosts().includes(post.id) ? 'liked' : ''}" data-post-id="${post.id}" title="推薦此穿搭">
              <i class="${getLikedPosts().includes(post.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span>${post.likes || 0}</span>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.glamour-card').forEach(card => {
    card.addEventListener('click', e => {
      // Prevent opening modal if clicking overlay action buttons or like button
      if (e.target.closest('.fav-btn') || e.target.closest('.report-btn') || e.target.closest('.card-like-btn')) {
        return;
      }
      openDetailModal(card.dataset.postId);
    });
  });

  // Attach separate listeners for buttons
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.postId);
    });
  });

  grid.querySelectorAll('.report-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      reportPost(btn.dataset.postId);
    });
  });

  grid.querySelectorAll('.card-like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      likeCardPost(btn.dataset.postId);
    });
  });
}

/* ════════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════════ */
function openDetailModal(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  state.currentDetailId = postId;

  const rc = ROLE_COLORS[post.role] || ROLE_COLORS['通用'];

  // Screenshot vs placeholder
  const img         = $('detail-image');
  const placeholder = $('detail-visual-placeholder');
  if (post.screenshot) {
    img.src          = post.screenshot;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.style.display         = 'none';
    placeholder.style.display = 'flex';
    placeholder.style.background = rc.grad;
    placeholder.innerHTML = `<i class="fa-solid fa-shirt" style="font-size:64px;color:${rc.accent};opacity:.4"></i>`;
  }

  // Text fields
  $('detail-title-text').textContent = post.name;
  $('detail-role').textContent        = post.role;
  $('detail-role').style.cssText      = `border-color:${rc.accent};color:${rc.accent}`;
  $('detail-date').innerHTML          = `<i class="fa-solid fa-clock"></i> ${post.date}`;
  $('detail-author').querySelector('span').textContent = post.author || '光之戰士';
  $('detail-likes-text').textContent  = `推薦此幻化 (${post.likes || 0})`;

  // 同步推薦按鈕狀態
  const likeBtn = $('btn-like-post');
  if (getLikedPosts().includes(post.id)) {
    likeBtn.classList.add('liked');
  } else {
    likeBtn.classList.remove('liked');
  }

  updateDetailModalFavoriteButton();

  // Gear rows
  $('detail-gear-list').innerHTML = SLOTS.map(slot => {
    const item = post.equipped[slot.id];
    if (!item) {
      return `
        <div class="detail-gear-row empty">
          <div class="slot-icon-mini"><i class="fa-solid ${slot.icon}"></i></div>
          <div class="detail-gear-info">
            <span class="detail-gear-slot">${slot.label}</span>
            <span class="detail-gear-name empty-text">尚未裝備</span>
          </div>
        </div>`;
    }
    return `
      <div class="detail-gear-row">
        <img class="gear-icon-sm" src="${item.icon}" alt="${item.name}"
             onerror="this.style.opacity='.2'">
        <div class="detail-gear-info">
          <span class="detail-gear-slot">${slot.label}</span>
          <span class="detail-gear-name">${escHtml(item.name)}</span>
        </div>
        <span class="detail-ilvl">iLvl ${item.level ?? '—'}</span>
      </div>`;
  }).join('');

  const modal = $('detail-modal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeDetailModal() {
  state.currentDetailId = null;
  $('detail-modal').classList.remove('show');
  $('detail-modal').setAttribute('aria-hidden', 'true');
}

/* ════════════════════════════════════════════════
   LIKE HELPERS
════════════════════════════════════════════════ */
const LIKED_KEY = 'liked_posts';

function getLikedPosts() {
  try { return JSON.parse(localStorage.getItem(LIKED_KEY)) || []; } catch { return []; }
}

function saveLikedPosts(arr) {
  try { localStorage.setItem(LIKED_KEY, JSON.stringify(arr)); } catch {}
}

async function likePost() {
  if (!state.currentDetailId) return;
  const post = state.posts.find(p => p.id === state.currentDetailId);
  if (!post) return;

  const liked = getLikedPosts();
  const alreadyLiked = liked.includes(post.id);
  
  let newLikes = post.likes || 0;
  if (alreadyLiked) {
    newLikes = Math.max(0, newLikes - 1);
  } else {
    newLikes = newLikes + 1;
  }

  post.likes = newLikes;
  if (alreadyLiked) {
    saveLikedPosts(liked.filter(id => id !== post.id));
    $('detail-likes-text').textContent = `推薦此幻化 (${post.likes})`;
    $('btn-like-post').classList.remove('liked');
    showToast('已取消推薦');
  } else {
    saveLikedPosts([...liked, post.id]);
    $('detail-likes-text').textContent = `推薦此幻化 (${post.likes})`;
    $('btn-like-post').classList.add('liked');
    showToast('感謝您的推薦！❤');
  }

  savePosts();
  renderGallery();

  if (isSupabaseConfigured()) {
    try {
      await apiUpdateLikes(post.id, newLikes);
    } catch (err) {
      console.error("Failed to sync likes to Supabase:", err);
    }
  }
}

async function likeCardPost(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;

  const liked = getLikedPosts();
  const alreadyLiked = liked.includes(postId);

  let newLikes = post.likes || 0;
  if (alreadyLiked) {
    newLikes = Math.max(0, newLikes - 1);
  } else {
    newLikes = newLikes + 1;
  }

  post.likes = newLikes;
  if (alreadyLiked) {
    saveLikedPosts(liked.filter(id => id !== postId));
    showToast('已取消推薦');
  } else {
    saveLikedPosts([...liked, postId]);
    showToast('感謝您的推薦！❤');
  }

  savePosts();
  renderGallery();

  if (isSupabaseConfigured()) {
    try {
      await apiUpdateLikes(postId, newLikes);
    } catch (err) {
      console.error("Failed to sync likes to Supabase:", err);
    }
  }
}

/* ════════════════════════════════════════════════
   FAVORITES SYSTEM
════════════════════════════════════════════════ */
function toggleFavorite(postId) {
  const idx = state.favorites.indexOf(postId);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
    showToast('已從收藏夾移除');
  } else {
    state.favorites.push(postId);
    showToast('已加入收藏夾 ⭐');
  }
  saveFavorites();
  renderGallery();
  updateDetailModalFavoriteButton();
}

function updateDetailModalFavoriteButton() {
  if (!state.currentDetailId) return;
  const isFav = state.favorites.includes(state.currentDetailId);
  const favBtn = $('btn-fav-post');
  if (favBtn) {
    favBtn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i> <span>${isFav ? '已收藏' : '收藏'}</span>`;
    favBtn.style.color = isFav ? '#0c0f14' : '';
    favBtn.style.background = isFav ? 'linear-gradient(135deg, #dfa525, #b8861d)' : 'rgba(255,255,255,0.06)';
    favBtn.style.border = isFav ? 'none' : '1px solid var(--line)';
  }
}

/* ════════════════════════════════════════════════
   REPORT SYSTEM & ADMIN BACKEND
════════════════════════════════════════════════ */
async function reportPost(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;

  // 防止同一瀏覽器重複檢舉
  const reportedKey = 'reported_posts';
  let reportedByMe = [];
  try { reportedByMe = JSON.parse(localStorage.getItem(reportedKey)) || []; } catch { reportedByMe = []; }
  if (reportedByMe.includes(postId)) {
    showToast('⚠️ 您已經檢舉過這篇穿搭了');
    return;
  }

  const reason = prompt('請輸入檢舉原因（不能為空）：');
  if (reason === null) return;
  if (!reason.trim()) {
    showToast('❗ 檢舉原因不能為空');
    return;
  }

  // 累計檢舉次數
  if (!post.reportCount) post.reportCount = 0;
  if (!post.reportReasons) post.reportReasons = [];
  post.reportCount += 1;
  post.reportReasons.push(reason.trim());

  // 超過 5 次才進後台
  const REPORT_THRESHOLD = 5;
  if (post.reportCount >= REPORT_THRESHOLD) {
    post.reported = true;
    post.reportReason = post.reportReasons.join('、');
  }

  // 記錄此瀏覽器已檢舉
  reportedByMe.push(postId);
  try { localStorage.setItem(reportedKey, JSON.stringify(reportedByMe)); } catch {}

  savePosts();

  if (post.reported && state.currentDetailId === postId) {
    closeDetailModal();
  }
  renderGallery();

  const remaining = REPORT_THRESHOLD - post.reportCount;
  if (remaining > 0) {
    showToast(`🚨 檢舉已送出（${post.reportCount}/${REPORT_THRESHOLD}）`);
  } else {
    showToast('🚨 檢舉次數已達標準，已送交管理員審核');
  }

  if (isSupabaseConfigured()) {
    try {
      await apiReportPost(postId, post.reported, post.reportCount, post.reportReasons, post.reportReason);
    } catch (err) {
      console.error("Failed to sync report to Supabase:", err);
    }
  }
}

function renderAdminPanel() {
  const tbody = $('admin-table-body');
  if (!tbody) return;
  
  const reportedPosts = state.posts.filter(p => p.reported);
  
  if (!reportedPosts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="admin-empty">
          <i class="fa-solid fa-shield-halved"></i>
          <span>目前無被檢舉的貼文</span>
        </td>
      </tr>`;
    return;
  }
  
  tbody.innerHTML = reportedPosts.map(post => {
    const thumbHtml = post.screenshot
      ? `<img class="admin-thumb" src="${post.screenshot}" alt="thumb">`
      : `<div class="admin-thumb-empty"><i class="fa-solid fa-shirt"></i></div>`;
      
    return `
      <tr>
        <td>${thumbHtml}</td>
        <td style="font-weight:600;">${escHtml(post.name)}</td>
        <td>${post.role}</td>
        <td>${post.date}</td>
        <td style="color:var(--rose); max-width: 250px; word-break: break-all;">${escHtml(post.reportReason || '無原因')}</td>
        <td>
          <button class="admin-btn-keep" data-keep-id="${post.id}">保留</button>
          <button class="admin-btn-delete" data-delete-id="${post.id}">一鍵刪除</button>
        </td>
      </tr>`;
  }).join('');
  
  // Attach event listeners
  tbody.querySelectorAll('[data-keep-id]').forEach(btn => {
    btn.addEventListener('click', () => dismissReport(btn.dataset.keepId));
  });
  
  tbody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => deletePost(btn.dataset.deleteId));
  });
}

async function dismissReport(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (post) {
    post.reported = false;
    post.reportCount = 0;
    post.reportReasons = [];
    delete post.reportReason;
    savePosts();
    renderAdminPanel();
    showToast('已保留貼文，檢舉已撤銷');

    if (isSupabaseConfigured()) {
      try {
        await apiDismissReport(postId);
      } catch (err) {
        console.error("Failed to dismiss report on Supabase:", err);
      }
    }
  }
}

async function deletePost(postId) {
  if (!confirm('確定要永久刪除此穿搭貼文嗎？刪除後將無法恢復。')) return;
  
  state.posts = state.posts.filter(p => p.id !== postId);
  savePosts();
  
  // Clean from favorites if present
  const favIdx = state.favorites.indexOf(postId);
  if (favIdx > -1) {
    state.favorites.splice(favIdx, 1);
    saveFavorites();
  }
  
  renderAdminPanel();
  showToast('🗑 貼文已永久刪除');

  if (isSupabaseConfigured()) {
    try {
      await apiDeletePost(postId);
    } catch (err) {
      console.error("Failed to delete post from Supabase:", err);
    }
  }
}

/* ════════════════════════════════════════════════
   UPLOAD — Screenshot Drag & Drop
════════════════════════════════════════════════ */
function bindUploadEvents() {
  const zone      = $('upload-zone');
  const fileInput = $('screenshot-input');

  // Click to select file (ignore clicks on the remove button)
  zone.addEventListener('click', e => {
    if (e.target.closest('#btn-remove-screenshot')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  $('btn-remove-screenshot').addEventListener('click', e => {
    e.stopPropagation();
    removeScreenshot();
  });
}

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('請上傳圖片檔案（JPG / PNG）'); return; }
  if (file.size > 10 * 1024 * 1024)   { showToast('圖片不能超過 10MB'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    state.screenshot = e.target.result;   // base64 data URL
    $('screenshot-preview').src          = state.screenshot;
    $('screenshot-preview').style.display = 'block';
    $('upload-prompt').style.display      = 'none';
    $('btn-remove-screenshot').style.display = 'flex';
    updateSummary();
    showToast('截圖上傳成功！');
  };
  reader.readAsDataURL(file);
}

function removeScreenshot() {
  state.screenshot = null;
  $('screenshot-preview').src             = '';
  $('screenshot-preview').style.display   = 'none';
  $('upload-prompt').style.display        = 'flex';
  $('btn-remove-screenshot').style.display = 'none';
  $('screenshot-input').value             = '';
  updateSummary();
  showToast('截圖已移除');
}

/* ════════════════════════════════════════════════
   SLOT TABS & PIPS
════════════════════════════════════════════════ */
function buildSlotTabs() {
  $('slot-tabs').innerHTML = SLOTS.map(s => `
    <button class="slot-tab" data-slot="${s.id}" title="${s.label}">
      <i class="fa-solid ${s.icon}"></i>
      <span>${s.label}</span>
    </button>`).join('');

  $('slot-tabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-slot]');
    if (btn) setActiveSlot(btn.dataset.slot);
  });

  setActiveSlot('head');
}

function buildSlotPips() {
  $('slot-pips').innerHTML = SLOTS.map(s => `
    <div class="slot-pip" id="pip-${s.id}" title="${s.label}">
      <i class="fa-solid ${s.icon}"></i>
    </div>`).join('');
}

function setActiveSlot(slotId) {
  state.activeSlot = slotId;

  // Sync slot tabs
  document.querySelectorAll('.slot-tab').forEach(btn => {
    const s = btn.dataset.slot;
    btn.classList.toggle('active', s === slotId);
    btn.classList.toggle('equipped', Boolean(state.equipped[s]));
  });

  // Update hint
  const slotLabel = SLOTS.find(s => s.id === slotId)?.label || '';
  const current   = state.equipped[slotId];
  const hint      = $('slot-hint');
  if (current) {
    hint.textContent = `${slotLabel}：已綁定「${current.name}」— 點擊其他裝備可替換`;
    hint.classList.add('active-hint');
  } else {
    hint.textContent = `${slotLabel}：搜尋後點選裝備綁定到此插槽`;
    hint.classList.remove('active-hint');
  }

  // Re-highlight gear list if results exist
  refreshGearListHighlight();
}

/* ════════════════════════════════════════════════
   EQUIPPED LIST — Left Panel
════════════════════════════════════════════════ */
function renderEquippedList() {
  $('equipped-list').innerHTML = SLOTS.map(slot => {
    const item = state.equipped[slot.id];
    if (!item) {
      return `
        <div class="equipped-row empty">
          <div class="slot-icon empty"><i class="fa-solid ${slot.icon}"></i></div>
          <div class="equipped-info">
            <span class="item-name muted">${slot.label}</span>
            <span class="item-meta">尚未綁定</span>
          </div>
        </div>`;
    }
    return `
      <div class="equipped-row">
        <img class="slot-icon" src="${item.icon}" alt="${item.name}"
             onerror="this.style.opacity='.2'">
        <div class="equipped-info">
          <span class="item-name" title="${escHtml(item.name)}">${escHtml(item.name)}</span>
          <span class="item-meta">${slot.label} · iLvl ${item.level ?? '—'}</span>
        </div>
        <button class="mini-action" data-remove-slot="${slot.id}" title="卸下裝備">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  }).join('');

  document.querySelectorAll('[data-remove-slot]').forEach(btn =>
    btn.addEventListener('click', () => unbindSlot(btn.dataset.removeSlot))
  );

  updateSlotTabStates();
  updateSlotPips();
  updateSummary();
}

function updateSlotTabStates() {
  SLOTS.forEach(slot => {
    document.querySelectorAll(`.slot-tab[data-slot="${slot.id}"]`).forEach(el =>
      el.classList.toggle('equipped', Boolean(state.equipped[slot.id]))
    );
  });
  setActiveSlot(state.activeSlot); // refresh hint
}

function updateSlotPips() {
  SLOTS.forEach(slot => {
    const pip = $(`pip-${slot.id}`);
    if (pip) pip.classList.toggle('active', Boolean(state.equipped[slot.id]));
  });
}

function unbindSlot(slotId) {
  const item = state.equipped[slotId];
  state.equipped[slotId] = null;
  renderEquippedList();
  refreshGearListHighlight();
  if (item) showToast(`已卸下：${item.name}`);
}

/* ════════════════════════════════════════════════
   XIVAPI — Live Gear Search
════════════════════════════════════════════════ */
let _searchAbort = null;

async function searchGearFromXIVAPI(keyword) {
  const errorNotice = document.getElementById('api-error-notice'); // 紅色的錯誤提示
  const gearListContainer = document.getElementById('gear-list');
  const gearCountContainer = document.getElementById('gear-count');
  
  if (errorNotice) {
    errorNotice.style.display = 'none'; // 每次搜尋前先隱藏錯誤提示
  }
  
  keyword = keyword.trim();
  if (!keyword) {
    gearListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>搜尋 FF14 全遊戲裝備</span>
        <small>輸入英文裝備名稱開始搜尋，<br>例如：Neo-Ishgardian、Calfskin Rider</small>
      </div>`;
    if (gearCountContainer) gearCountContainer.textContent = '';
    return;
  }
  
  // Abort previous in-flight request
  if (_searchAbort) { _searchAbort.abort(); }
  _searchAbort = new AbortController();
  
  // 顯示 Loading 狀態
  gearListContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>正在搜尋 XIVAPI…</span></div>';
  if (gearCountContainer) gearCountContainer.textContent = '';
  
  try {
    // 插槽 → EquipSlotCategory 欄位對照表
    const SLOT_TO_ESC = {
      head:   'Head',
      body:   'Body',
      hands:  'Gloves',
      legs:   'Legs',
      feet:   'Feet',
      weapon: 'MainHand',
    };

    // 根據當前插槽加上部位過濾
    const escField = SLOT_TO_ESC[state.activeSlot];
    const slotFilter = escField ? ` +EquipSlotCategory.${escField}=1` : '';
    const query = `Name~"${keyword}"${slotFilter}`;
    const url = `https://v2.xivapi.com/api/search?sheets=Item&fields=Name,Icon,LevelItem,EquipSlotCategory&query=${encodeURIComponent(query)}&limit=20`;
    
    console.log("正在請求 XIVAPI v2:", url);
    
    const response = await fetch(url, { signal: _searchAbort.signal });
    if (!response.ok) {
      throw new Error(`伺服器回應錯誤 (HTTP ${response.status})`);
    }
    
    const data = await response.json();
    console.log("XIVAPI v2 回傳資料:", data);
    
    // v2 回傳結構：data.results[]
    // LevelItem 是物件，實際等級數字在 row_id
    const results = (data.results || []).map(r => ({
      ID:        r.row_id,
      Name:      r.fields?.Name ?? '',
      IconPath:  r.fields?.Icon?.path_hr1 ?? r.fields?.Icon?.path ?? null,
      LevelItem: r.fields?.LevelItem?.row_id ?? null,  // ← 取 row_id 才是數字
    })).filter(r => r.Name); // 過濾掉空名稱的條目
    
    gearListContainer._results = results;
    
    if (results.length === 0) {
      gearListContainer.innerHTML = '<div class="empty-state" style="color: #aaa; text-align: center; padding: 20px;"><i class="fa-solid fa-circle-question"></i><span>找不到符合的裝備，請嘗試英文關鍵字</span></div>';
      return;
    }
    
    // 清空列表，準備渲染新資料
    gearListContainer.innerHTML = '';
    if (gearCountContainer) {
      gearCountContainer.textContent = `找到 ${results.length} 件裝備（搜尋：${keyword}）`;
    }
    
    results.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'gear-card';
      itemElement.setAttribute('data-item-id', item.ID);
      
      // v2 圖片網址格式：https://v2.xivapi.com/api/asset?path=...&format=png
      const iconUrl = item.IconPath
        ? `https://v2.xivapi.com/api/asset?path=${encodeURIComponent(item.IconPath)}&format=png`
        : '';
      const isEq = state.equipped[state.activeSlot]?.id === item.ID;
      if (isEq) itemElement.classList.add('equipped');
      
      itemElement.innerHTML = `
        <img class="gear-icon" src="${iconUrl}" alt="${escHtml(item.Name)}" loading="lazy" style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #e2b76c;">
        <div class="gear-info" style="display: flex; flex-direction: column;">
          <span class="item-name" style="color: #fff; font-size: 14px;">${escHtml(item.Name)}</span>
          <span class="item-meta" style="color: #888; font-size: 12px;">iLvl ${item.LevelItem ?? '—'}</span>
        </div>
        <button class="btn-bind-gear" style="background: ${isEq ? 'rgba(255,255,255,0.15)' : '#e2b76c'}; color: ${isEq ? 'var(--muted)' : '#000'}; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">
          ${isEq ? '已綁定' : '綁定'}
        </button>
      `;
      
      const bindBtn = itemElement.querySelector('.btn-bind-gear');
      if (bindBtn) {
        bindBtn.addEventListener('click', () => {
          bindGear({
            ID:        item.ID,
            Name:      item.Name,
            IconPath:  item.IconPath,
            LevelItem: item.LevelItem,
          });
        });
      }
      
      gearListContainer.appendChild(itemElement);
    });

  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error("XIVAPI 連線失敗:", error);
    // 如果失敗，再把畫面中間那個紅色的驚嘆號警報調出來顯示
    if (errorNotice) {
      errorNotice.style.display = 'flex';
      const errorText = errorNotice.querySelector('p') || errorNotice;
      errorText.innerHTML = `無法連線至 XIVAPI<br><small style="font-size:12px; color:rgba(255,255,255,0.5);">${error.message}</small>`;
    }
    gearListContainer.innerHTML = '<div class="empty-state error-state" style="color: #ff6b6b; text-align: center; padding: 20px;"><i class="fa-solid fa-circle-exclamation"></i><span>資料載入失敗</span></div>';
    if (gearCountContainer) gearCountContainer.textContent = '';
  }
}

/* ════════════════════════════════════════════════
   GEAR BINDING
════════════════════════════════════════════════ */
function bindGear(apiItem) {
  // v2 圖片網址：用 path_hr1 組成完整 asset URL
  const iconUrl = apiItem.IconPath
    ? `https://v2.xivapi.com/api/asset?path=${encodeURIComponent(apiItem.IconPath)}&format=png`
    : '';
  const level   = apiItem.LevelItem ?? '—';

  state.equipped[state.activeSlot] = {
    id:    apiItem.ID,
    name:  apiItem.Name,
    icon:  iconUrl,
    level: level,
  };

  renderEquippedList();
  refreshGearListHighlight();

  const slotLabel = SLOTS.find(s => s.id === state.activeSlot)?.label || '';
  showToast(`已將「${apiItem.Name}」綁定至 ${slotLabel}`);
}

function refreshGearListHighlight() {
  const list = $('gear-list');
  if (!list._results) return;

  list.querySelectorAll('[data-item-id]').forEach(btn => {
    const id   = Number(btn.dataset.itemId);
    const isEq = state.equipped[state.activeSlot]?.id === id;
    btn.classList.toggle('equipped', isEq);

    const bindBtn = btn.querySelector('.btn-bind-gear');
    if (bindBtn) {
      if (isEq) {
        bindBtn.textContent = '已綁定';
        bindBtn.style.background = 'rgba(255,255,255,0.15)';
        bindBtn.style.color = 'var(--muted)';
      } else {
        bindBtn.textContent = '綁定';
        bindBtn.style.background = '#e2b76c';
        bindBtn.style.color = '#000';
      }
    }
  });
}

/* ════════════════════════════════════════════════
   PUBLISH — Package & Save to localStorage
════════════════════════════════════════════════ */
async function publishPost() {
  const name = $('save-name-input').value.trim();
  const role = $('editor-role-select').value;

  // Validation
  if (!name)                                          { showToast('❗ 請輸入套裝名稱'); return; }
  if (!state.screenshot)                              { showToast('❗ 請先上傳遊戲截圖'); return; }
  if (!Object.values(state.equipped).some(Boolean))  { showToast('❗ 請至少綁定一件裝備'); return; }

  const isUpdate = Boolean(state.editingPostId);

  // Build post object (timestamp added)
  const post = {
    id:         isUpdate ? state.editingPostId : `post_${Date.now()}`,
    name,
    role,
    race:       state.race,
    gender:     state.gender,
    date:       new Date().toLocaleDateString('zh-TW').replace(/\//g, '-'),
    createdAt:  new Date().toISOString(), // time stamp for rank sorting
    author:     '光之戰士',
    likes:      0,
    reported:   false,
    isAuthor:   true,
    screenshot: state.screenshot,           // base64 data URL
    equipped:   { ...state.equipped },      // snapshot of 6 slots
  };

  // Change Publish button to Loading/Disabled state during sync
  const saveBtn = $('btn-save-set');
  let originalHtml = '';
  if (saveBtn) {
    originalHtml = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>正在上傳至雲端…</span>';
  }

  try {
    if (isSupabaseConfigured()) {
      if (isUpdate) {
        const oldPost = state.posts.find(p => p.id === state.editingPostId);
        if (oldPost) {
          post.likes = oldPost.likes || 0;
          post.isAuthor = oldPost.isAuthor !== undefined ? oldPost.isAuthor : true;
          post.reported = oldPost.reported !== undefined ? oldPost.reported : false;
          post.reportCount = oldPost.reportCount || 0;
          post.reportReasons = oldPost.reportReasons || [];
          post.reportReason = oldPost.reportReason || null;
          post.createdAt = oldPost.createdAt || post.createdAt;
        }
        const postToSync = { ...post };
        delete postToSync.isAuthor;
        await apiUpdatePost(state.editingPostId, postToSync);
      } else {
        const postToSync = { ...post };
        delete postToSync.isAuthor;
        await apiCreatePost(postToSync);
      }
    }
  } catch (err) {
    console.error("Supabase publish failed:", err);
    showToast("⚠️ 雲端上傳失敗，已存入本地瀏覽器");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
    }
  }

  if (isUpdate) {
    const idx = state.posts.findIndex(p => p.id === state.editingPostId);
    if (idx > -1) {
      const oldPost = state.posts[idx];
      post.likes = oldPost.likes || 0;
      post.isAuthor = oldPost.isAuthor !== undefined ? oldPost.isAuthor : true;
      post.reported = oldPost.reported !== undefined ? oldPost.reported : false;
      post.reportCount = oldPost.reportCount || 0;
      post.reportReasons = oldPost.reportReasons || [];
      post.reportReason = oldPost.reportReason || null;
      post.createdAt = oldPost.createdAt || post.createdAt;
      state.posts[idx] = post;
    }
    state.editingPostId = null;

    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>發布幻化至大廳</span>';
      saveBtn.style.background = '';
    }
  } else {
    state.posts.unshift(post);
    saveMyPublishedId(post.id);
  }

  savePosts();

  // Reset editor
  $('save-name-input').value = '';
  removeScreenshot();
  SLOTS.forEach(s => { state.equipped[s.id] = null; });
  renderEquippedList();
  $('gear-list').innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-magnifying-glass"></i>
      <span>搜尋 FF14 全遊戲裝備</span>
      <small>輸入英文裝備名稱開始搜尋</small>
    </div>`;
  $('gear-count').textContent   = '';
  $('search-input').value       = '';
  if ($('gear-list')._results) delete $('gear-list')._results;

  if (isUpdate) {
    showToast(`✨ 已更新「${name}」幻化方案！`);
    switchView('my_glamours');
  } else {
    showToast(`✨ 已發布「${name}」至幻化大廳！`);
    switchView('gallery');
  }
}

/* ════════════════════════════════════════════════
   EVENT BINDING
════════════════════════════════════════════════ */
function bindEvents() {
  // View tabs
  $('tab-gallery').addEventListener('click', () => switchView('gallery'));
  $('tab-favorites').addEventListener('click', () => switchView('favorites'));
  $('btn-my-glamours').addEventListener('click', () => switchView('my_glamours'));
  $('tab-editor').addEventListener('click',  () => switchView('editor'));
  $('btn-admin').addEventListener('click', () => {
    const ADMIN_PASSWORD = 'mirage2025'; // ← 可自行修改密碼
    const input = prompt('請輸入管理員密碼：');
    if (input === null) return;
    if (input !== ADMIN_PASSWORD) {
      showToast('❌ 密碼錯誤，無法進入後台');
      return;
    }
    switchView('admin');
  });

  // Publish
  $('btn-save-set').addEventListener('click', publishPost);

  // Reset
  $('btn-reset').addEventListener('click', () => {
    SLOTS.forEach(s => { state.equipped[s.id] = null; });
    renderEquippedList();
    
    if (state.editingPostId) {
      state.editingPostId = null;
      $('save-name-input').value = '';
      removeScreenshot();
      const saveBtn = $('btn-save-set');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>發布幻化至大廳</span>';
        saveBtn.style.background = '';
      }
      showToast('已取消編輯並重置');
    } else {
      showToast('已重置所有綁定裝備');
    }
  });

  // Gallery filters & sorting
  $('gallery-search').addEventListener('input', renderGallery);
  $('gallery-role-filter').addEventListener('change', renderGallery);
  $('gallery-sort-filter').addEventListener('change', renderGallery);

  // Race / Gender toggles
  $('race-group').addEventListener('click', e => {
    const btn = e.target.closest('.btn-option');
    if (!btn || !btn.dataset.race) return;
    $('race-group').querySelectorAll('.btn-option').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    state.race = btn.dataset.race;
  });
  
  $('gender-group').addEventListener('click', e => {
    const btn = e.target.closest('.segment');
    if (!btn || !btn.dataset.gender) return;
    $('gender-group').querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    state.gender = btn.dataset.gender;
  });

  // Summary live-update on name input
  $('save-name-input').addEventListener('input', updateSummary);

  // XIVAPI Search — debounce on input + immediate on Enter/button
  let _searchTimer;
  $('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(_searchTimer);
      searchGearFromXIVAPI($('search-input').value);
    }
  });
  $('search-input').addEventListener('input', () => {
    clearTimeout(_searchTimer);
    const q = $('search-input').value.trim();
    if (q.length >= 2) {
      _searchTimer = setTimeout(() => searchGearFromXIVAPI(q), 600);
    }
  });
  $('btn-search').addEventListener('click', () => searchGearFromXIVAPI($('search-input').value));

  // Detail modal
  $('close-detail-modal').addEventListener('click', closeDetailModal);
  $('detail-modal').addEventListener('click', e => {
    if (e.target === $('detail-modal')) closeDetailModal();
  });
  $('btn-like-post').addEventListener('click', likePost);
  $('btn-fav-post').addEventListener('click', () => {
    if (state.currentDetailId) toggleFavorite(state.currentDetailId);
  });
  $('btn-report-post').addEventListener('click', () => {
    if (state.currentDetailId) reportPost(state.currentDetailId);
  });

  // Refresh Gallery Sync Button
  const refreshBtn = $('btn-refresh-gallery');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const icon = refreshBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      
      try {
        await loadPosts();
        if (isSupabaseConfigured()) {
          showToast('🔄 雲端資料同步成功！');
        } else {
          showToast('🔄 本地資料重新載入成功！');
        }
      } catch (err) {
        console.error(err);
        showToast('❌ 同步失敗，請檢查網路或金鑰');
      } finally {
        if (icon) icon.classList.remove('fa-spin');
      }
    });
  }
}

/* ════════════════════════════════════════════════
   SUPABASE CLOUD DATABASE API
════════════════════════════════════════════════ */
async function apiFetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*');
  if (error) throw error;
  return data;
}

async function apiCreatePost(post) {
  const { error } = await supabase
    .from('posts')
    .insert([post]);
  if (error) throw error;
}

async function apiUpdatePost(id, post) {
  const { error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id);
  if (error) throw error;
}

async function apiUpdateLikes(id, likes) {
  const { error } = await supabase
    .from('posts')
    .update({ likes })
    .eq('id', id);
  if (error) throw error;
}

async function apiReportPost(id, reported, reportCount, reportReasons, reportReason) {
  const { error } = await supabase
    .from('posts')
    .update({
      reported,
      reportCount,
      reportReasons,
      reportReason
    })
    .eq('id', id);
  if (error) throw error;
}

async function apiDismissReport(id) {
  const { error } = await supabase
    .from('posts')
    .update({
      reported: false,
      reportCount: 0,
      reportReasons: [],
      reportReason: null
    })
    .eq('id', id);
  if (error) throw error;
}

async function apiDeletePost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ════════════════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════════════════ */
function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
  } catch (e) {
    showToast('⚠ 儲存失敗：本地空間可能已滿，請清除舊貼文後重試');
    console.error('[Storage]', e);
  }
}

async function loadPosts() {
  if (isSupabaseConfigured()) {
    try {
      const posts = await apiFetchPosts();
      if (posts) {
        state.posts = posts;
        state.posts.forEach(p => {
          if (!p.createdAt) p.createdAt = new Date(p.date || Date.now()).toISOString();
          if (p.likes === undefined) p.likes = 0;
          if (p.reported === undefined) p.reported = false;
          if (p.reportCount === undefined) p.reportCount = 0;
          if (p.reportReasons === undefined) p.reportReasons = [];
        });
        renderGallery();
        return;
      }
    } catch (err) {
      console.error("Failed to load posts from Supabase, falling back to LocalStorage:", err);
      showToast("無法連線至雲端資料庫，已切換至本地模式");
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    state.posts = Array.isArray(arr) ? arr : [];
    
    // Ensure all loaded posts have required fields
    state.posts.forEach(p => {
      if (!p.createdAt) p.createdAt = new Date(p.date || Date.now()).toISOString();
      if (p.likes === undefined) p.likes = 0;
      if (p.reported === undefined) p.reported = false;
      if (p.reportCount === undefined) p.reportCount = 0;
      if (p.reportReasons === undefined) p.reportReasons = [];
    });
  } catch {
    state.posts = [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
  } catch (e) {
    console.error('[Favorites]', e);
  }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    state.favorites = raw ? JSON.parse(raw) : [];
  } catch {
    state.favorites = [];
  }
}

/* ════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════ */
function updateSummary() {
  const count = Object.values(state.equipped).filter(Boolean).length;
  const name  = $('save-name-input')?.value?.trim() || '';

  $('summary-title').textContent = name || '尚未命名的幻化';
  $('summary-meta').textContent  = count
    ? `已綁定 ${count}/6 件裝備${state.screenshot ? '  ·  截圖已上傳 ✓' : ''}`
    : '在右側搜尋並綁定裝備，上傳截圖後發布';
}

let _toastTimer;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/** Simple XSS-safe HTML escape */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════════
   MY GLAMOURS FUNCTIONS
════════════════════════════════════════════════ */
function loadMyPublishedIds() {
  try {
    const raw = localStorage.getItem('my_published_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMyPublishedId(postId) {
  try {
    const ids = loadMyPublishedIds();
    if (!ids.includes(postId)) {
      ids.push(postId);
      localStorage.setItem('my_published_ids', JSON.stringify(ids));
    }
  } catch (e) {
    console.error('[PublishedIds]', e);
  }
}

function renderMyGlamours() {
  const grid = $('my-glamours-grid');
  if (!grid) return;

  const publishedIds = loadMyPublishedIds();
  const filtered = state.posts.filter(post => post.isAuthor || publishedIds.includes(post.id));

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="gallery-empty" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; color: var(--faint);">
        <i class="fa-solid fa-user-gear" style="font-size: 40px; margin-bottom: 12px; color: var(--line);"></i>
        <span>你尚未發布過任何幻化方案，快去發布一篇文章吧！</span>
        <small style="margin-top: 6px; font-size: 13px;">點擊右上角「發布穿搭」上傳您的幻化。</small>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(post => {
    const rc    = ROLE_COLORS[post.role] || ROLE_COLORS['通用'];
    const count = Object.values(post.equipped).filter(Boolean).length;

    const imgHtml = post.screenshot
      ? `<img src="${post.screenshot}" alt="${post.name}" loading="lazy">`
      : `<div class="card-placeholder" style="background:${rc.grad}">
           <i class="fa-solid fa-shirt" style="color:${rc.accent}"></i>
         </div>`;

    return `
      <div class="glamour-card" data-post-id="${post.id}">
        <div class="glamour-card-image">${imgHtml}</div>
        <div class="glamour-card-content">
          <h3 class="glamour-card-title">${escHtml(post.name)}</h3>
          <div class="glamour-card-footer" style="margin-bottom: 8px;">
            <span class="glamour-card-role" style="border-color:${rc.accent};color:${rc.accent}">${post.role}</span>
            <span class="glamour-card-meta"><i class="fa-solid fa-shirt"></i> ${count}/6</span>
          </div>
          <div class="my-glamour-actions" style="display: flex; gap: 6px; border-top: 1px solid var(--line-soft); padding-top: 8px;">
            <button class="btn-edit-glamour" data-post-id="${post.id}">
              <i class="fa-solid fa-pen"></i> 編輯
            </button>
            <button class="btn-delete-glamour" data-post-id="${post.id}">
              <i class="fa-solid fa-trash-can"></i> 下架
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.glamour-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-edit-glamour') || e.target.closest('.btn-delete-glamour')) {
        return;
      }
      openDetailModal(card.dataset.postId);
    });
  });

  // Attach separate listeners for My Glamour buttons
  grid.querySelectorAll('.btn-edit-glamour').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      editGlamourPost(btn.dataset.postId);
    });
  });

  grid.querySelectorAll('.btn-delete-glamour').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteGlamourPost(btn.dataset.postId);
    });
  });
}

async function deleteGlamourPost(postId) {
  if (!confirm('確定要下架並刪除此幻化方案嗎？這個動作將會永久刪除此搭配。')) return;

  state.posts = state.posts.filter(p => p.id !== postId);
  savePosts();

  // Also clean from favorites
  const favIdx = state.favorites.indexOf(postId);
  if (favIdx > -1) {
    state.favorites.splice(favIdx, 1);
    saveFavorites();
  }

  // Also remove from my_published_ids
  try {
    const raw = localStorage.getItem('my_published_ids');
    if (raw) {
      let ids = JSON.parse(raw);
      ids = ids.filter(id => id !== postId);
      localStorage.setItem('my_published_ids', JSON.stringify(ids));
    }
  } catch (e) {
    console.error(e);
  }

  renderMyGlamours();
  showToast('🗑 貼文已成功下架與刪除');

  if (isSupabaseConfigured()) {
    try {
      await apiDeletePost(postId);
    } catch (err) {
      console.error("Failed to delete post from Supabase:", err);
    }
  }
}

function editGlamourPost(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;

  // 1. Mark state as editing
  state.editingPostId = postId;

  // 2. Set UI fields in Editor
  $('save-name-input').value = post.name;
  $('editor-role-select').value = post.role;

  // 3. Set Race
  state.race = post.race || 'hyur';
  const raceBtn = $('race-group').querySelector(`[data-race="${state.race}"]`);
  if (raceBtn) {
    $('race-group').querySelectorAll('.btn-option').forEach(s => s.classList.remove('active'));
    raceBtn.classList.add('active');
  }

  // 4. Set Gender
  state.gender = post.gender || 'female';
  const genderBtn = $('gender-group').querySelector(`[data-gender="${state.gender}"]`);
  if (genderBtn) {
    $('gender-group').querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
    genderBtn.classList.add('active');
  }

  // 5. Load screenshot preview
  if (post.screenshot) {
    state.screenshot = post.screenshot;
    $('screenshot-preview').src = post.screenshot;
    $('screenshot-preview').style.display = 'block';
    $('upload-prompt').style.display = 'none';
    $('btn-remove-screenshot').style.display = 'flex';
  } else {
    removeScreenshot();
  }

  // 6. Fill state.equipped
  SLOTS.forEach(slot => {
    const item = post.equipped[slot.id];
    state.equipped[slot.id] = item ? { ...item } : null;
  });

  // 7. Render editor UI
  renderEquippedList();

  // 8. Change publish button text to "更新幻化方案"
  const saveBtn = $('btn-save-set');
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span>更新幻化方案</span>';
    saveBtn.style.background = 'linear-gradient(135deg, #dfa525, #b8861d)';
  }

  // 9. Switch to editor view
  switchView('editor');
  showToast('✏️ 已載入貼文資料，您可以進行修改');
}
