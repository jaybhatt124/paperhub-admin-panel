// ===== PAPERHUB APP.JS =====

let currentBoard = null;
let currentClass = null;
let currentStream = null;
let currentBranch = null;
let currentSemester = null;
let currentSubject = null;
let screenHistory = ['home'];
let pendingDownloadLink = null;

// ===== SCREEN MANAGEMENT =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');

  // bottom nav
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('bnav-' + name);
  if (nb) nb.classList.add('active');

  // top nav
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  const tn = document.getElementById('nav-' + name);
  if (tn) tn.classList.add('active');

  if (name === 'bookmarks') loadBookmarks();
  if (name === 'search') initSearchFilters();
  if (name === 'home') {
    updateStats();
    loadRecentlyViewed();
  }
}

function goBack() {
  screenHistory.pop();
  const prev = screenHistory[screenHistory.length - 1];
  if (!prev || prev === 'home') {
    showScreen('home');
    screenHistory = ['home'];
  } else {
    // Re-render previous filter
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-filter').classList.add('active');
    reRenderFilter(prev);
  }
}

function reRenderFilter(state) {
  if (state === 'board') renderClassSelection();
  else if (state === 'class') {
    if (currentBoard === 'GTU') renderBranchSelection();
    else renderSubjectOrStreamSelection();
  }
  else if (state === 'stream') renderSubjectSelection();
  else if (state === 'branch') renderSemesterSelection();
  else if (state === 'semester') renderSemesterSubjects();
}

// ===== BOARD SELECTION =====
function selectBoard(board) {
  currentBoard = board;
  currentClass = null; currentStream = null;
  currentBranch = null; currentSemester = null;
  screenHistory.push('board');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-filter').classList.add('active');
  if (board === 'GTU') renderBranchSelection();
  else renderClassSelection();
}

function renderClassSelection() {
  document.getElementById('breadcrumb').textContent = currentBoard + ' → Select Class';
  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Class</div>
    <div class="filter-grid">
      <button class="filter-btn" onclick="selectClass('10th')">
        <span class="fi">🏫</span>
        <span class="fl">10th</span>
        <span class="fs">Secondary</span>
      </button>
      <button class="filter-btn" onclick="selectClass('12th')">
        <span class="fi">🎓</span>
        <span class="fl">12th</span>
        <span class="fs">Higher Secondary</span>
      </button>
    </div>
  `;
}

function selectClass(cls) {
  currentClass = cls;
  screenHistory.push('class');
  if (cls === '12th') renderStreamSelection();
  else renderSubjectSelection();
}

function renderStreamSelection() {
  document.getElementById('breadcrumb').textContent = `${currentBoard} → ${currentClass} → Select Stream`;
  const streams = Object.keys(DATA.boards[currentBoard].classes['12th'].streams);
  const icons = { Science: '🔬', Commerce: '💼', Arts: '🎨' };
  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Stream</div>
    <div class="filter-grid">
      ${streams.map(s => `
        <button class="filter-btn" onclick="selectStream('${s}')">
          <span class="fi">${icons[s] || '📚'}</span>
          <span class="fl">${s}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function selectStream(stream) {
  currentStream = stream;
  screenHistory.push('stream');
  renderSubjectSelection();
}

function renderSubjectOrStreamSelection() {
  if (currentClass === '12th') renderStreamSelection();
  else renderSubjectSelection();
}

function renderSubjectSelection() {
  let subjects = [];
  const board = DATA.boards[currentBoard];
  if (currentBoard === 'GTU') return;
  const classData = board.classes[currentClass];
  if (currentClass === '12th') subjects = classData.streams[currentStream] || [];
  else subjects = classData.subjects || [];

  const label = currentClass === '12th'
    ? `${currentBoard} → ${currentClass} → ${currentStream} → Subject`
    : `${currentBoard} → ${currentClass} → Subject`;
  document.getElementById('breadcrumb').textContent = label;

  const subjectIcons = {
    Maths:'➗', Science:'🔬', Physics:'⚡', Chemistry:'⚗️',
    Biology:'🧬', English:'📖', Hindi:'🇮🇳', Gujarati:'🏵️',
    Sanskrit:'📜', History:'🏛️', Geography:'🌍',
    Accountancy:'📊', Economics:'💹', 'Business Studies':'💼',
    'Social Science':'🗺️', 'Political Science':'⚖️',
    'Computer Science':'💻', Sociology:'👥', Psychology:'🧠',
    Statistics:'📈'
  };

  const paperCounts = {};
  subjects.forEach(sub => {
    paperCounts[sub] = getPapersForSubject(sub).length;
  });

  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Subject</div>
    <div class="filter-grid">
      ${subjects.map(sub => `
        <button class="filter-btn" onclick="selectSubject('${sub}')">
          <span class="fi">${subjectIcons[sub] || '📄'}</span>
          <span class="fl">${sub}</span>
          <span class="fs">${paperCounts[sub]} papers</span>
        </button>
      `).join('')}
    </div>
  `;
}

function getPapersForSubject(sub) {
  return PAPERS.filter(p => {
    if (p.board !== currentBoard) return false;
    if (currentBoard !== 'GTU' && p.class !== currentClass) return false;
    if (currentClass === '12th' && p.stream !== currentStream) return false;
    if (p.subject !== sub) return false;
    return true;
  });
}

function selectSubject(sub) {
  currentSubject = sub;
  showPapers();
}

// GTU BRANCH & SEMESTER
function renderBranchSelection() {
  document.getElementById('breadcrumb').textContent = 'GTU Diploma → Select Branch';
  const branches = Object.keys(DATA.boards.GTU.branches);
  const icons = {
    'Computer Engineering':'💻','Mechanical Engineering':'⚙️',
    'Civil Engineering':'🏗️','Electrical Engineering':'⚡',
    'Electronics & Communication':'📡','Information Technology':'🌐'
  };
  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Branch</div>
    <div class="filter-grid">
      ${branches.map(b => `
        <button class="filter-btn" onclick="selectBranch('${b}')">
          <span class="fi">${icons[b] || '🎓'}</span>
          <span class="fl" style="font-size:0.8rem">${b}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function selectBranch(branch) {
  currentBranch = branch;
  currentClass = 'Diploma';
  screenHistory.push('branch');
  renderSemesterSelection();
}

function renderSemesterSelection() {
  document.getElementById('breadcrumb').textContent = `GTU → ${currentBranch} → Semester`;
  const sems = Object.keys(DATA.boards.GTU.branches[currentBranch].semesters);
  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Semester</div>
    <div class="filter-grid">
      ${sems.map(s => `
        <button class="filter-btn" onclick="selectSemester('${s}')">
          <span class="fi">📆</span>
          <span class="fl">${s}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function selectSemester(sem) {
  currentSemester = sem;
  screenHistory.push('semester');
  renderSemesterSubjects();
}

function renderSemesterSubjects() {
  document.getElementById('breadcrumb').textContent = `GTU → ${currentBranch} → ${currentSemester}`;
  const subjects = DATA.boards.GTU.branches[currentBranch].semesters[currentSemester];
  document.getElementById('filterContent').innerHTML = `
    <div class="filter-title">Select Subject</div>
    <div class="filter-grid">
      ${subjects.map(sub => {
        const count = PAPERS.filter(p => p.board === 'GTU' && p.branch === currentBranch && p.semester === currentSemester && p.subject === sub).length;
        return `<button class="filter-btn" onclick="selectSubject('${sub}')">
          <span class="fi">📄</span>
          <span class="fl" style="font-size:0.8rem">${sub}</span>
          <span class="fs">${count} papers</span>
        </button>`;
      }).join('')}
    </div>
  `;
}

// ===== PAPERS DISPLAY =====
function showPapers() {
  let papers = PAPERS.filter(p => {
    if (p.board !== currentBoard) return false;
    if (currentBoard === 'GTU') {
      return p.branch === currentBranch && p.semester === currentSemester && p.subject === currentSubject;
    }
    if (p.class !== currentClass) return false;
    if (currentClass === '12th' && p.stream !== currentStream) return false;
    return p.subject === currentSubject;
  });

  // Populate year filter
  const years = [...new Set(papers.map(p => p.year))].sort().reverse();
  const yearSel = document.getElementById('yearFilter');
  yearSel.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

  const crumb = currentBoard === 'GTU'
    ? `GTU → ${currentBranch} → ${currentSemester} → ${currentSubject}`
    : `${currentBoard} → ${currentClass}${currentStream ? ' → ' + currentStream : ''} → ${currentSubject}`;

  document.getElementById('papersBreadcrumb').textContent = crumb;
  document.getElementById('papersTitle').textContent = `${currentSubject} Papers`;

  screenHistory.push('papers');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-papers').classList.add('active');
  renderPaperCards(papers);
}

function filterPapers() {
  const yr = document.getElementById('yearFilter').value;
  let papers = PAPERS.filter(p => {
    if (p.board !== currentBoard) return false;
    if (currentBoard === 'GTU') {
      return p.branch === currentBranch && p.semester === currentSemester && p.subject === currentSubject;
    }
    if (p.class !== currentClass) return false;
    if (currentClass === '12th' && p.stream !== currentStream) return false;
    return p.subject === currentSubject;
  });
  if (yr) papers = papers.filter(p => p.year === yr);
  renderPaperCards(papers);
}

function renderPaperCards(papers) {
  const container = document.getElementById('papersList');
  if (!papers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No papers available yet.<br>Check back soon!</p>
      </div>`;
    return;
  }
  const bookmarks = getBookmarks();
  container.innerHTML = papers.map(p => {
    const saved = bookmarks.some(b => b.id === p.id);
    return `
    <div class="paper-card" id="card-${p.id}">
      <div class="paper-icon-wrap">📄</div>
      <div class="paper-info">
        <div class="paper-title">${p.title}</div>
        <div class="paper-meta">
          <span class="badge badge-blue">${p.board}</span>
          <span class="badge badge-amber">${p.year}</span>
          ${p.semester ? `<span class="badge badge-green">${p.semester}</span>` : ''}
        </div>
      </div>
      <div class="paper-actions">
        <button class="btn-bookmark ${saved ? 'saved' : ''}" onclick="toggleBookmark(${p.id})" title="Bookmark">
          ${saved ? '🔖' : '🏷️'}
        </button>
        <button class="btn-view" onclick="viewPaper('${p.view_link}', ${p.id})">👁 View</button>
        <button class="btn-download" onclick="downloadPaper('${p.download_link}', ${p.id})">⬇ Download</button>
      </div>
    </div>`;
  }).join('');
}

function viewPaper(link, id) {
  addRecentlyViewed(id);
  window.open(link, '_blank');
}

function downloadPaper(link, id) {
  addRecentlyViewed(id);
  pendingDownloadLink = link;
  showAd(() => { window.open(link, '_blank'); });
}

// ===== AD SYSTEM =====
function showAd(callback) {
  const modal = document.getElementById('adModal');
  const closeBtn = document.getElementById('adCloseBtn');
  const progressBar = document.getElementById('adProgressBar');
  modal.style.display = 'flex';
  closeBtn.disabled = true;
  closeBtn.textContent = 'Wait 5s';
  progressBar.style.width = '0%';
  let elapsed = 0;
  const total = 5000;
  const interval = setInterval(() => {
    elapsed += 100;
    progressBar.style.width = (elapsed / total * 100) + '%';
    const remaining = Math.ceil((total - elapsed) / 1000);
    if (elapsed < total) {
      closeBtn.textContent = `Wait ${remaining}s`;
    } else {
      clearInterval(interval);
      closeBtn.disabled = false;
      closeBtn.textContent = 'Close & Download';
      closeBtn.onclick = () => { closeAd(); if (callback) callback(); };
    }
  }, 100);
}

function closeAd() {
  document.getElementById('adModal').style.display = 'none';
  document.getElementById('adProgressBar').style.width = '0%';
}

// ===== BOOKMARKS =====
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('ph_bookmarks') || '[]'); } catch(e) { return []; }
}

function toggleBookmark(id) {
  const paper = PAPERS.find(p => p.id === id);
  if (!paper) return;
  let bm = getBookmarks();
  const idx = bm.findIndex(b => b.id === id);
  if (idx > -1) {
    bm.splice(idx, 1);
    const btn = document.querySelector(`#card-${id} .btn-bookmark`);
    if (btn) { btn.classList.remove('saved'); btn.textContent = '🏷️'; }
  } else {
    bm.push(paper);
    const btn = document.querySelector(`#card-${id} .btn-bookmark`);
    if (btn) { btn.classList.add('saved'); btn.textContent = '🔖'; }
  }
  localStorage.setItem('ph_bookmarks', JSON.stringify(bm));
}

function loadBookmarks() {
  const bm = getBookmarks();
  const container = document.getElementById('bookmarksList');
  if (!bm.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔖</div><p>No bookmarks yet.<br>Tap 🏷️ on any paper to save it!</p></div>`;
    return;
  }
  container.innerHTML = bm.map(p => `
    <div class="paper-card" id="card-${p.id}">
      <div class="paper-icon-wrap">📄</div>
      <div class="paper-info">
        <div class="paper-title">${p.title}</div>
        <div class="paper-meta">
          <span class="badge badge-blue">${p.board}</span>
          <span class="badge badge-amber">${p.year}</span>
        </div>
      </div>
      <div class="paper-actions">
        <button class="btn-bookmark saved" onclick="toggleBookmark(${p.id}); loadBookmarks()">🔖</button>
        <button class="btn-view" onclick="viewPaper('${p.view_link}', ${p.id})">👁 View</button>
        <button class="btn-download" onclick="downloadPaper('${p.download_link}', ${p.id})">⬇ Download</button>
      </div>
    </div>
  `).join('');
}

// ===== RECENTLY VIEWED =====
function addRecentlyViewed(id) {
  let rv = JSON.parse(localStorage.getItem('ph_recent') || '[]');
  rv = rv.filter(x => x !== id);
  rv.unshift(id);
  rv = rv.slice(0, 5);
  localStorage.setItem('ph_recent', JSON.stringify(rv));
}

function loadRecentlyViewed() {
  const rv = JSON.parse(localStorage.getItem('ph_recent') || '[]');
  const section = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!rv.length) { section.style.display = 'none'; return; }
  const papers = rv.map(id => PAPERS.find(p => p.id === id)).filter(Boolean);
  if (!papers.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = papers.map(p => `
    <div class="recent-item" onclick="quickViewPaper(${p.id})">
      <div class="recent-icon">📄</div>
      <div class="recent-info">
        <div class="recent-title">${p.title}</div>
        <div class="recent-meta">${p.board} • ${p.year}</div>
      </div>
      <span style="color:#9ca3af; font-size:0.8rem">→</span>
    </div>
  `).join('');
}

function quickViewPaper(id) {
  const p = PAPERS.find(x => x.id === id);
  if (p) viewPaper(p.view_link, id);
}

// ===== SEARCH =====
function liveSearch(val) {
  const dropdown = document.getElementById('heroDropdown');
  if (!val.trim()) { dropdown.innerHTML = ''; return; }
  const results = PAPERS.filter(p =>
    p.title.toLowerCase().includes(val.toLowerCase()) ||
    p.subject.toLowerCase().includes(val.toLowerCase()) ||
    p.board.toLowerCase().includes(val.toLowerCase())
  ).slice(0, 6);
  if (!results.length) { dropdown.innerHTML = '<div class="search-dropdown-item">No results found</div>'; return; }
  dropdown.innerHTML = results.map(p => `
    <div class="search-dropdown-item" onclick="viewPaper('${p.view_link}', ${p.id})">
      <strong>${p.board}</strong> ${p.title} <span style="color:#9ca3af">${p.year}</span>
    </div>
  `).join('');
}

function initSearchFilters() {
  const years = [...new Set(PAPERS.map(p => p.year))].sort().reverse();
  document.getElementById('filterYear').innerHTML = '<option value="">All Years</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
}

function mainSearchFn(val) {
  const board = document.getElementById('filterBoard').value;
  const year = document.getElementById('filterYear').value;
  let results = PAPERS.filter(p => {
    const matchText = !val.trim() ||
      p.title.toLowerCase().includes(val.toLowerCase()) ||
      p.subject.toLowerCase().includes(val.toLowerCase());
    const matchBoard = !board || p.board === board;
    const matchYear = !year || p.year === year;
    return matchText && matchBoard && matchYear;
  });
  const container = document.getElementById('searchResults');
  if (!results.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No papers found.<br>Try different keywords.</p></div>`;
    return;
  }
  const bookmarks = getBookmarks();
  container.innerHTML = results.map(p => {
    const saved = bookmarks.some(b => b.id === p.id);
    return `
    <div class="paper-card" id="card-${p.id}">
      <div class="paper-icon-wrap">📄</div>
      <div class="paper-info">
        <div class="paper-title">${p.title}</div>
        <div class="paper-meta">
          <span class="badge badge-blue">${p.board}</span>
          <span class="badge badge-amber">${p.year}</span>
        </div>
      </div>
      <div class="paper-actions">
        <button class="btn-bookmark ${saved ? 'saved' : ''}" onclick="toggleBookmark(${p.id})">
          ${saved ? '🔖' : '🏷️'}
        </button>
        <button class="btn-view" onclick="viewPaper('${p.view_link}', ${p.id})">👁 View</button>
        <button class="btn-download" onclick="downloadPaper('${p.download_link}', ${p.id})">⬇ Download</button>
      </div>
    </div>`;
  }).join('');
}

// ===== STATS =====
function updateStats() {
  document.getElementById('totalPapers').textContent = PAPERS.length;
}

// ===== MOBILE NAV =====
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.hero-search')) {
    document.getElementById('heroDropdown').innerHTML = '';
  }
});

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  updateStats();
  loadRecentlyViewed();
});
