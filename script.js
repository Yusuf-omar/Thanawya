/* ========================================
   Thanwya Amma — Results Search
   Pure vanilla JS, no dependencies
   ======================================== */

(function () {
  'use strict';

  // ── Constants ────────────────────────────────────
  var MAX_TOTAL = 410;

  var DATA_PATHS = {
    modern: 'data/modern.json',
    old: 'data/old.json'
  };

  var SYSTEM_LABELS = {
    modern: 'النظام الحديث',
    old: 'النظام القديم'
  };

  // ── State ────────────────────────────────────────
  var state = {
    system: null,        // 'modern' | 'old' | null
    searchMode: 'name',  // 'name' | 'seat'
    cache: {},           // { modern: [...], old: [...] }
    loading: false
  };

  // ── DOM References ───────────────────────────────
  var $ = function (id) { return document.getElementById(id); };

  var dom = {
    themeToggle:   $('theme-toggle'),
    btnModern:     $('btn-modern'),
    btnOld:        $('btn-old'),
    searchSection: $('search-section'),
    btnModeName:   $('btn-mode-name'),
    btnModeSeat:   $('btn-mode-seat'),
    searchInput:   $('search-input'),
    searchBtn:     $('search-btn'),
    loader:        $('loader'),
    emptyState:    $('empty-state'),
    errorState:    $('error-state'),
    results:       $('results'),
    resultsCount:  $('results-count'),
    resultsList:   $('results-list'),
    year:          $('year')
  };

  // ── Initialization ───────────────────────────────

  function init() {
    dom.year.textContent = new Date().getFullYear();
    loadTheme();
    bindEvents();
  }

  // ── Theme ────────────────────────────────────────

  function loadTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function toggleTheme() {
    var html = document.documentElement;
    var current = html.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  // ── Arabic Text Normalization ────────────────────

  function normalizeArabic(text) {
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Event Bindings ───────────────────────────────

  function bindEvents() {
    dom.themeToggle.addEventListener('click', toggleTheme);

    dom.btnModern.addEventListener('click', function () {
      selectSystem('modern');
    });

    dom.btnOld.addEventListener('click', function () {
      selectSystem('old');
    });

    dom.btnModeName.addEventListener('click', function () {
      setSearchMode('name');
    });

    dom.btnModeSeat.addEventListener('click', function () {
      setSearchMode('seat');
    });

    dom.searchBtn.addEventListener('click', performSearch);

    dom.searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // ── System Selection ─────────────────────────────

  function selectSystem(system) {
    state.system = system;

    // Update active card
    dom.btnModern.classList.toggle('active', system === 'modern');
    dom.btnOld.classList.toggle('active', system === 'old');

    // Show search section
    dom.searchSection.classList.remove('hidden');

    // Clear previous results
    clearResults();

    // Reset input
    dom.searchInput.value = '';
    dom.searchInput.focus();

    // Pre-load data if not cached
    if (!state.cache[system]) {
      loadData(system);
    }
  }

  // ── Search Mode ──────────────────────────────────

  function setSearchMode(mode) {
    state.searchMode = mode;

    dom.btnModeName.classList.toggle('active', mode === 'name');
    dom.btnModeSeat.classList.toggle('active', mode === 'seat');

    if (mode === 'name') {
      dom.searchInput.type = 'text';
      dom.searchInput.placeholder = 'اكتب الاسم الكامل...';
      dom.searchInput.inputMode = 'text';
    } else {
      dom.searchInput.type = 'tel';
      dom.searchInput.placeholder = 'اكتب رقم الجلوس...';
      dom.searchInput.inputMode = 'numeric';
    }

    dom.searchInput.value = '';
    dom.searchInput.focus();
    clearResults();
  }

  // ── Data Loading ─────────────────────────────────

  function loadData(system) {
    if (state.loading) return;
    if (state.cache[system]) return;

    // fetch does not work with file:// protocol
    if (window.location.protocol === 'file:') {
      showError('لا يمكن تحميل البيانات من file://\nيرجى استخدام Live Server أو خادم محلي');
      return;
    }

    state.loading = true;
    showLoader(true);
    hideMessages();

    var path = DATA_PATHS[system];

    fetch(path)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        state.cache[system] = data;
        state.loading = false;
        showLoader(false);
      })
      .catch(function (err) {
        console.error('Failed to load ' + path + ':', err);
        state.loading = false;
        showLoader(false);
        showError();
      });
  }

  // ── Search ───────────────────────────────────────

  function performSearch() {
    var query = dom.searchInput.value.trim();
    if (!query || !state.system) return;

    hideMessages();
    clearResults();

    // Ensure data is loaded
    var system = state.system;
    if (!state.cache[system]) {
      loadData(system);
      // Wait for load, then search
      waitForData(system, function () {
        executeSearch(query, system);
      });
      return;
    }

    executeSearch(query, system);
  }

  function waitForData(system, callback) {
    var interval = setInterval(function () {
      if (state.cache[system]) {
        clearInterval(interval);
        callback();
      }
      // If loading stopped without data, abort
      if (!state.loading && !state.cache[system]) {
        clearInterval(interval);
      }
    }, 100);
  }

  function executeSearch(query, system) {
    var data = state.cache[system];
    if (!data) return;

    var results;

    if (state.searchMode === 'seat') {
      results = searchBySeat(data, query);
    } else {
      results = searchByName(data, query);
    }

    if (results.length === 0) {
      showEmpty();
    } else {
      renderResults(results, system);
    }
  }

  // ── Search by Seat Number (exact) ────────────────

  function searchBySeat(data, query) {
    var seatNo = parseInt(query, 10);
    if (isNaN(seatNo)) return [];

    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i].s === seatNo) {
        return [data[i]];
      }
    }
    return [];
  }

  // ── Search by Name (normalized) ──────────────────

  function searchByName(data, query) {
    var normalizedQuery = normalizeArabic(query);
    var results = [];

    for (var i = 0, len = data.length; i < len; i++) {
      var normalizedName = normalizeArabic(data[i].n);
      if (normalizedName.indexOf(normalizedQuery) !== -1) {
        results.push(data[i]);
      }
    }
    return results;
  }

  // ── Rendering ────────────────────────────────────

  function renderResults(results, system) {
    dom.resultsCount.textContent =
      'تم العثور على ' + results.length + (results.length === 1 ? ' نتيجة' : ' نتيجة');

    var fragment = document.createDocumentFragment();

    // Limit displayed results to prevent DOM overload
    var displayLimit = Math.min(results.length, 50);
    for (var i = 0; i < displayLimit; i++) {
      fragment.appendChild(createResultCard(results[i], system));
    }

    if (results.length > displayLimit) {
      dom.resultsCount.textContent +=
        ' — يتم عرض أول ' + displayLimit + ' نتيجة فقط. حاول تضييق البحث.';
    }

    dom.resultsList.appendChild(fragment);
    dom.results.classList.remove('hidden');
  }

  function createResultCard(student, system) {
    var card = document.createElement('div');
    card.className = 'result-card glass';

    var badgeClass = getBadgeClass(student.c);
    var percentage = MAX_TOTAL > 0 ? ((student.d / MAX_TOTAL) * 100).toFixed(1) : '0';

    card.innerHTML =
      '<div class="result-card__header">' +
        '<span class="result-card__name">' + escapeHtml(student.n) + '</span>' +
        '<span class="result-card__badge ' + badgeClass + '">' +
          escapeHtml(student.c) +
        '</span>' +
      '</div>' +
      '<div class="result-card__details">' +
        '<div class="detail-item">' +
          '<span class="detail-item__label">رقم الجلوس</span>' +
          '<span class="detail-item__value">' + student.s + '</span>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span class="detail-item__label">المجموع الكلي</span>' +
          '<span class="detail-item__value detail-item__value--highlight">' +
            student.d + ' / ' + MAX_TOTAL +
          '</span>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span class="detail-item__label">النسبة المئوية</span>' +
          '<span class="detail-item__value">' + percentage + '%</span>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span class="detail-item__label">النظام</span>' +
          '<span class="detail-item__value">' + SYSTEM_LABELS[system] + '</span>' +
        '</div>' +
      '</div>';

    return card;
  }

  function getBadgeClass(caseDesc) {
    if (!caseDesc) return 'result-card__badge--warning';

    if (caseDesc.indexOf('ناجح') !== -1) {
      return 'result-card__badge--success';
    }
    if (caseDesc.indexOf('راسب') !== -1 || caseDesc.indexOf('غياب') !== -1) {
      return 'result-card__badge--danger';
    }
    return 'result-card__badge--warning';
  }

  // ── UI Helpers ───────────────────────────────────

  function showLoader(show) {
    dom.loader.classList.toggle('visible', show);
  }

  function showEmpty() {
    dom.emptyState.classList.add('visible');
  }

  function showError(msg) {
    var sub = dom.errorState.querySelector('.message-state__sub');
    if (sub) {
      sub.textContent = msg || 'يرجى التحقق من الاتصال والمحاولة مرة أخرى';
    }
    dom.errorState.classList.add('visible');
  }

  function hideMessages() {
    dom.emptyState.classList.remove('visible');
    dom.errorState.classList.remove('visible');
  }

  function clearResults() {
    dom.resultsList.innerHTML = '';
    dom.resultsCount.textContent = '';
    dom.results.classList.add('hidden');
    hideMessages();
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Boot ─────────────────────────────────────────
  init();

})();
