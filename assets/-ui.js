/* Ronak SCSS – UI (vanilla JS)
 * - Uses markup from pages/snippets.php (no shell injection).
 * - Accordion (only non-empty categories), search, CRUD (mock/localStorage).
 * - Code editor: prefer wp.codeEditor; fallback to CDN CodeMirror 5.
 * - Validation: only blocks Save when SCSS is empty (no syntax validation here).
 * - Logs important events/errors to console for debugging.
 */
(function () {
  'use strict';

  if (!document.body.classList.contains('is-ronak-scss-plugin')) return;

  // Namespace console helpers
  var NS = '[Ronak SCSS]';
  var log = function () {
    try {
      console.log.apply(console, [NS].concat([].slice.call(arguments)));
    } catch (_) {}
  };
  var warn = function () {
    try {
      console.warn.apply(console, [NS].concat([].slice.call(arguments)));
    } catch (_) {}
  };
  var error = function () {
    try {
      console.error.apply(console, [NS].concat([].slice.call(arguments)));
    } catch (_) {}
  };

  // Constants
  var LS_KEY = 'ronak_scss_state_v1';
  var PAGE_PARAM = new URLSearchParams(window.location.search).get('page') || '';
  var PAGES = { SNIPPETS: 'ronak-scss' };
  var CATEGORIES = [
    'Uncategorized',
    'Vars',
    'Mixins',
    'Presets',
    'Components',
    'Sections',
    'Layouts',
    'Utilities'
  ];

  // DOM helpers
  var qs = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var el = function (tag, opts) {
    var n = document.createElement(tag);
    if (opts) {
      if (opts.className) n.className = opts.className;
      if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) {
        n.setAttribute(k, opts.attrs[k]);
      });
      if (opts.text != null) n.textContent = opts.text;
      if (opts.html != null) n.innerHTML = opts.html;
    }
    return n;
  };

  // Storage/state
  function uuid(prefix) {
    return (prefix || 'id_') + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  }
  function saveState(s) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(s || state));
    } catch (e) {
      warn('Failed to save state', e);
    }
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      warn('Failed to load state', e);
      return null;
    }
  }

  var DEFAULT_SNIPPETS = [
    {
      id: 'snp_vars_base',
      title: 'Base Vars',
      category: 'Vars',
      scss: '$color-primary: #2f81f7;\n$spacing-base: 1rem;',
      updatedAt: Date.now() - 86400000
    },
    {
      id: 'snp_mixins_media',
      title: 'Media Mixins',
      category: 'Mixins',
      scss:
        '@mixin respond($break) {\n' +
        '  @if $break == sm { @media (min-width: 640px) { @content; } }\n' +
        '  @if $break == md { @media (min-width: 768px) { @content; } }\n' +
        '}',
      updatedAt: Date.now() - 720000
    },
    {
      id: 'snp_presets_typo',
      title: 'Typography Presets',
      category: 'Presets',
      scss: 'h1 { font-size: 2rem; }\nh2 { font-size: 1.5rem; }',
      updatedAt: Date.now() - 180000
    },
    {
      id: 'snp_component_button',
      title: 'Button Component',
      category: 'Components',
      scss: '.btn { padding: .625rem 1rem; border-radius: .5rem; }',
      updatedAt: Date.now() - 30000
    },
    {
      id: 'snp_layout_grid',
      title: 'Grid Layout',
      category: 'Layouts',
      scss: '.grid { display: grid; gap: 1rem; grid-template-columns: repeat(12, 1fr); }',
      updatedAt: Date.now() - 50000
    },
    {
      id: 'snp_utility_visuallyhidden',
      title: 'Visually Hidden',
      category: 'Utilities',
      scss:
        '.sr-only { position: absolute !important; width:1px; height:1px; overflow: hidden; clip: rect(1px,1px,1px,1px); white-space: nowrap; }',
      updatedAt: Date.now() - 80000
    },
    {
      id: 'snp_section_hero',
      title: 'Hero Section',
      category: 'Sections',
      scss:
        '.hero { padding: 4rem 1.5rem; background: linear-gradient(135deg, rgba(47,129,247,.2), rgba(46,160,67,.2)); }',
      updatedAt: Date.now() - 110000
    }
  ];
  var DEFAULT_COMPILATIONS = [
    { id: 'cmp_base', name: 'Base Styles', snippetIds: ['snp_vars_base', 'snp_mixins_media', 'snp_presets_typo'] },
    { id: 'cmp_theme', name: 'Theme Styles', snippetIds: ['snp_vars_base', 'snp_component_button', 'snp_utility_visuallyhidden'] },
    { id: 'cmp_layouts', name: 'Layouts', snippetIds: ['snp_layout_grid', 'snp_section_hero'] }
  ];
  var state = (function () {
    var s = loadState();
    if (s && Array.isArray(s.snippets) && Array.isArray(s.compilations)) {
      s.selectedSnippetId = s.selectedSnippetId || null;
      s.ui = s.ui || { search: '', catOpen: [] }; // closed by default
      return s;
    }
    var init = {
      snippets: DEFAULT_SNIPPETS.slice(),
      compilations: DEFAULT_COMPILATIONS.slice(),
      selectedSnippetId: null,
      ui: { search: '', catOpen: [] }
    };
    saveState(init);
    return init;
  })();

  function getSelectedSnippet() {
    if (!state.selectedSnippetId) return null;
    return state.snippets.find(function (s) {
      return s.id === state.selectedSnippetId;
    }) || null;
  }
  function computeSnippetUsages(snippetId) {
    return state.compilations.filter(function (c) {
      return Array.isArray(c.snippetIds) && c.snippetIds.indexOf(snippetId) !== -1;
    });
  }
  function sortByTitleAsc(a, b) {
    return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
  }
  function anySnippets() {
    return Array.isArray(state.snippets) && state.snippets.length > 0;
  }

  // Toasts
  function ensureToastContainer() {
    var t = qs('.rs-toast');
    if (t) return t;
    t = el('div', { className: 'rs-toast', attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' } });
    document.body.appendChild(t);
    return t;
  }
  function showToast(msg, type) {
    var c = ensureToastContainer();
    var it = el('div', { className: 'rs-toast__item ' + (type ? 'is-' + type : 'is-info'), text: msg });
    c.appendChild(it);
    requestAnimationFrame(function () {
      it.classList.add('is-visible');
    });
    setTimeout(function () {
      it.classList.remove('is-visible');
      setTimeout(function () {
        it.remove();
      }, 300);
    }, 2200);
  }

  // Code editor (WP code editor preferred, CM5 fallback)
  var cmInstance = null,
    cmSnippetId = null,
    resizeHandler = null,
    lastErrorLine = null;

  function loadStyleOnce(id, href) {
    return new Promise(function (resolve, reject) {
      if (document.getElementById(id)) return resolve();
      var link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = function (e) {
        reject(e);
      };
      document.head.appendChild(link);
    });
  }
  function loadScriptOnce(id, src) {
    return new Promise(function (resolve, reject) {
      if (document.getElementById(id)) return resolve();
      var s = document.createElement('script');
      s.id = id;
      s.src = src;
      s.async = false;
      s.defer = false;
      s.onload = resolve;
      s.onerror = function (e) {
        reject(e);
      };
      document.head.appendChild(s);
    });
  }

  function ensureWPCodeEditorReady() {
    var ready = !!(window.wp && wp.codeEditor && window.RonakSCSS && RonakSCSS.codeEditor);
    return Promise.resolve(ready);
  }
  function ensureCodeMirrorCDN() {
    if (window.CodeMirror && typeof window.CodeMirror.fromTextArea === 'function') return Promise.resolve(true);
    var base = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
    return loadStyleOnce('cm-css', base + 'codemirror.min.css')
      .then(function () {
        return loadStyleOnce('cm-theme', base + 'theme/material-darker.min.css');
      })
      .then(function () {
        return loadScriptOnce('cm-core', base + 'codemirror.min.js');
      })
      .then(function () {
        return loadScriptOnce('cm-mode-css', base + 'mode/css/css.min.js');
      })
      .then(function () {
        return loadScriptOnce('cm-addon-close', base + 'addon/edit/closebrackets.min.js');
      })
      .then(function () {
        return loadScriptOnce('cm-addon-match', base + 'addon/edit/matchbrackets.min.js');
      })
      .then(function () {
        return window.CodeMirror && typeof window.CodeMirror.fromTextArea === 'function';
      })
      .catch(function (e) {
        error('Failed to load CodeMirror from CDN', e);
        return false;
      });
  }
  function calcEditorHeightPx() {
    return Math.max(400, Math.floor(window.innerHeight - 460));
  }
  function disposeEditor() {
    try {
      if (cmInstance && cmInstance.toTextArea) cmInstance.toTextArea();
    } catch (e) {
      warn('Dispose editor failed', e);
    }
    cmInstance = null;
    cmSnippetId = null;
    lastErrorLine = null;
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
  }
  function clearEditorError() {
    if (cmInstance && lastErrorLine != null && cmInstance.removeLineClass) {
      cmInstance.removeLineClass(lastErrorLine, 'background', 'rs-cm-errorline');
      lastErrorLine = null;
    }
  }
  function showEditorError(err) {
    if (!cmInstance || !cmInstance.addLineClass) return;
    var ln = Math.max(0, (err && err.line ? err.line - 1 : 0));
    clearEditorError();
    lastErrorLine = ln;
    cmInstance.addLineClass(ln, 'background', 'rs-cm-errorline');
    try {
      cmInstance.scrollIntoView({ line: ln, ch: 0 }, 100);
    } catch (e) {}
  }

  function mountCodeEditor(textarea, snippetId) {
    disposeEditor();
    return ensureWPCodeEditorReady().then(function (ready) {
      if (ready) {
        try {
          var settings = RonakSCSS.codeEditor || {};
          var ed = wp.codeEditor.initialize(textarea, settings);
          if (ed && ed.codemirror) {
            cmInstance = ed.codemirror;
            cmSnippetId = snippetId;
            var wrap = cmInstance.getWrapperElement();
            if (wrap) wrap.classList.add('rs-cm');
            var applySize = function () {
              cmInstance.setSize(null, calcEditorHeightPx());
            };
            applySize();
            resizeHandler = applySize;
            window.addEventListener('resize', resizeHandler);
            log('WP Code Editor initialized');
            return true;
          }
        } catch (e) {
          error('wp.codeEditor.initialize failed; falling back', e);
        }
      }
      return ensureCodeMirrorCDN().then(function (ok) {
        if (!ok || !window.CodeMirror || !window.CodeMirror.fromTextArea) {
          error('Code editor unavailable');
          return false;
        }
        cmInstance = window.CodeMirror.fromTextArea(textarea, {
          mode: 'text/x-scss',
          theme: 'material-darker',
          lineNumbers: true,
          lineWrapping: true,
          indentUnit: 2,
          tabSize: 2,
          indentWithTabs: false,
          autoCloseBrackets: true,
          matchBrackets: true
        });
        cmSnippetId = snippetId;
        var wrap = cmInstance.getWrapperElement();
        if (wrap) wrap.classList.add('rs-cm');
        var applySize = function () {
          cmInstance.setSize(null, calcEditorHeightPx());
        };
        applySize();
        resizeHandler = applySize;
        window.addEventListener('resize', resizeHandler);
        log('CodeMirror (CDN) initialized');
        return true;
      });
    });
  }
  function getEditorValue(textarea, current) {
    if (cmInstance && cmSnippetId === (current && current.id) && cmInstance.getValue) return cmInstance.getValue();
    return (textarea && textarea.value) || '';
  }

  // Rendering using existing markup
  function render() {
    if (PAGE_PARAM !== PAGES.SNIPPETS) return;
    var sidebarAcc = qs('#rs-snippets-accordion');
    var main = qs('#rs-snippet-detail');
    var search = qs('#rs-snippets-search');
    var newBtn = qs('#rs-new-snippet');
    if (!sidebarAcc || !main) return;

    if (search) {
      search.value = state.ui.search || '';
      search.oninput = function (e) {
        state.ui.search = e.target.value || '';
        saveState();
        fillAccordion(sidebarAcc);
      };
    }
    if (newBtn) {
      newBtn.onclick = function () {
        var id = uuid('snp_');
        var snp = { id: id, title: 'Untitled Snippet', category: 'Uncategorized', scss: '/* New SCSS */', updatedAt: Date.now() };
        state.snippets.push(snp);
        state.selectedSnippetId = id;
        if (state.ui.catOpen.indexOf(snp.category) === -1) state.ui.catOpen.push(snp.category);
        saveState();
        fillAccordion(sidebarAcc);
        fillDetail(main);
        showToast('Snippet created.', 'success');
        log('Snippet created', { id: id });
      };
    }

    fillAccordion(sidebarAcc);
    fillDetail(main);
  }

  function filteredSnippetsByCategory(cat) {
    var term = (state.ui.search || '').toLowerCase().trim();
    return state.snippets.filter(function (s) {
      return s.category === cat && (!term || s.title.toLowerCase().indexOf(term) !== -1);
    });
  }

  function fillAccordion(container) {
    if (!anySnippets()) {
      container.innerHTML = '<div class="rs-empty rs-empty--small"><div class="rs-muted">Click "New Snippet" to start.</div></div>';
      return;
    }
    var frag = document.createDocumentFragment();
    CATEGORIES.forEach(function (cat) {
      var items = filteredSnippetsByCategory(cat).sort(sortByTitleAsc);
      if (!items.length) return;

      var details = el('details', { className: 'rs-accordion__group' });
      if ((state.ui.catOpen || []).indexOf(cat) !== -1) details.setAttribute('open', 'open');
      details.addEventListener('toggle', function () {
        var open = details.open;
        var list = state.ui.catOpen || [];
        var idx = list.indexOf(cat);
        if (open && idx === -1) list.push(cat);
        if (!open && idx !== -1) list.splice(idx, 1);
        state.ui.catOpen = list;
        saveState();
      });

      var summary = el('summary', { className: 'rs-accordion__summary' });
      summary.appendChild(el('span', { className: 'rs-accordion__title', text: cat }));
      summary.appendChild(el('span', { className: 'rs-accordion__count', text: String(items.length) }));
      details.appendChild(summary);

      var ul = el('ul', { className: 'rs-accordion__list' });
      items.forEach(function (snp) {
        var uses = state.compilations.filter(function (c) {
          return (c.snippetIds || []).indexOf(snp.id) !== -1;
        }).length;
        var li = el('li', { className: 'rs-accordion__item' });
        var btn = el('button', {
          className: 'rs-snippet-link' + (state.selectedSnippetId === snp.id ? ' is-active' : ''),
          attrs: { type: 'button', 'data-id': snp.id }
        });
        btn.appendChild(el('span', { className: 'rs-snippet-link__title', text: snp.title }));
        btn.appendChild(el('span', { className: 'rs-badge', text: uses + ' use' + (uses !== 1 ? 's' : '') }));
        btn.onclick = function () {
          state.selectedSnippetId = snp.id;
          saveState();
          fillAccordion(container);
          fillDetail(qs('#rs-snippet-detail'));
        };
        li.appendChild(btn);
        ul.appendChild(li);
      });
      details.appendChild(ul);
      frag.appendChild(details);
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function fillDetail(container) {
    container.innerHTML = '';
    if (!anySnippets()) {
      var none = el('div', { className: 'rs-empty' });
      none.appendChild(el('h3', { className: 'rs-empty__title', text: 'Click "New Snippet" to start.' }));
      container.appendChild(none);
      return;
    }
    if (!state.selectedSnippetId) {
      var msg = el('div', { className: 'rs-empty' });
      msg.appendChild(el('p', { text: 'Choose a snippet on the left or create a new one.' }));
      container.appendChild(msg);
      return;
    }

    var snp = getSelectedSnippet();
    if (!snp) return;

    var wrap = el('div', { className: 'rs-editor' });

    // Row: Title, Category, Actions
    var row = el('div', { className: 'rs-form-row' });
    var titleCol = el('div', { className: 'rs-field rs-field--grow' });
    titleCol.appendChild(el('label', { className: 'rs-label', attrs: { for: 'rs-title' }, text: 'Title' }));
    var inputTitle = el('input', { className: 'rs-input', attrs: { id: 'rs-title', type: 'text', value: snp.title } });
    titleCol.appendChild(inputTitle);

    var catCol = el('div', { className: 'rs-field' });
    catCol.appendChild(el('label', { className: 'rs-label', attrs: { for: 'rs-category' }, text: 'Category' }));
    var sel = el('select', { className: 'rs-select', attrs: { id: 'rs-category' } });
    CATEGORIES.forEach(function (c) {
      var opt = el('option', { text: c });
      if (c === snp.category) opt.setAttribute('selected', 'selected');
      sel.appendChild(opt);
    });
    catCol.appendChild(sel);

    var actions = el('div', { className: 'rs-actions' });
    var saveBtn = el('button', { className: 'rs-btn rs-btn--primary', text: 'Save', attrs: { type: 'button' } });
    var dupBtn = el('button', { className: 'rs-btn rs-btn--ghost', text: 'Duplicate', attrs: { type: 'button' } });
    var delBtn = el('button', { className: 'rs-btn rs-btn--danger', text: 'Remove', attrs: { type: 'button' } });
    actions.appendChild(saveBtn);
    actions.appendChild(dupBtn);
    actions.appendChild(delBtn);

    row.appendChild(titleCol);
    row.appendChild(catCol);
    row.appendChild(actions);
    wrap.appendChild(row);

    // Code editor
    var codeField = el('div', { className: 'rs-field' });
    codeField.appendChild(el('label', { className: 'rs-label', attrs: { for: 'rs-scss' }, text: 'SCSS Code' }));
    var textarea = el('textarea', { className: 'rs-code', attrs: { id: 'rs-scss', spellcheck: 'false' }, text: snp.scss });
    codeField.appendChild(textarea);
    wrap.appendChild(codeField);

    // Usages
    var usages = computeSnippetUsages(snp.id);
    var usageWrap = el('div', { className: 'rs-usage' });
    usageWrap.appendChild(el('div', { className: 'rs-usage__title', text: 'Usages (' + usages.length + ')' }));
    if (usages.length) {
      var ul = document.createElement('ul');
      ul.className = 'rs-usage__list';
      usages.forEach(function (u) {
        var li = document.createElement('li');
        var a = el('a', {
          className: 'rs-link',
          attrs: {
            href: (function () {
              var url = new URL(window.location.href);
              url.searchParams.set('page', 'ronak-scss-compilations');
              return url.toString();
            })()
          },
          text: u.name
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      usageWrap.appendChild(ul);
    } else {
      usageWrap.appendChild(el('div', { className: 'rs-muted', text: 'Not used in any compilation.' }));
    }
    wrap.appendChild(usageWrap);

    container.appendChild(wrap);

    // Editor after render
    mountCodeEditor(textarea, snp.id).catch(function (e) {
      error('Editor mount failed', e);
    });

    // Actions
    saveBtn.onclick = function () {
      var updated = {
        id: snp.id,
        title: inputTitle.value || '',
        category: sel.value || 'Uncategorized',
        scss: getEditorValue(textarea, snp),
        updatedAt: snp.updatedAt || Date.now()
      };

      // Minimal validation (no syntax checks here)
      if (!updated.title.trim()) {
        showToast('Title is required.', 'error');
        error('Save blocked: empty title');
        return;
      }
      if (!updated.scss || !updated.scss.trim()) {
        showToast('SCSS cannot be empty.', 'error');
        error('Save blocked: empty SCSS');
        showEditorError({ line: 1 });
        return;
      }
      if (CATEGORIES.indexOf(updated.category) === -1) {
        showToast('Invalid category.', 'error');
        error('Save blocked: invalid category', updated.category);
        return;
      }

      clearEditorError();

      var idx = state.snippets.findIndex(function (s) {
        return s.id === snp.id;
      });
      if (idx !== -1) {
        updated.updatedAt = Date.now();
        state.snippets[idx] = updated;
        if (state.ui.catOpen.indexOf(updated.category) === -1) state.ui.catOpen.push(updated.category);
        saveState();
        fillAccordion(qs('#rs-snippets-accordion'));
        showToast('Snippet saved.', 'success');
        log('Snippet saved', { id: updated.id, title: updated.title });
      }
    };

    dupBtn.onclick = function () {
      var copy = Object.assign({}, snp, { id: uuid('snp_'), title: snp.title + ' (copy)', updatedAt: Date.now() });
      state.snippets.push(copy);
      state.selectedSnippetId = copy.id;
      if (state.ui.catOpen.indexOf(copy.category) === -1) state.ui.catOpen.push(copy.category);
      saveState();
      fillAccordion(qs('#rs-snippets-accordion'));
      fillDetail(container);
      showToast('Snippet duplicated.', 'success');
      log('Snippet duplicated', { from: snp.id, to: copy.id });
    };

    delBtn.onclick = function () {
      if (!window.confirm('Delete this snippet? This action cannot be undone.')) return;
      state.snippets = state.snippets.filter(function (s) {
        return s.id !== snp.id;
      });
      state.compilations = state.compilations.map(function (c) {
        return Object.assign({}, c, { snippetIds: (c.snippetIds || []).filter(function (id) {
          return id !== snp.id;
        }) });
      });
      state.selectedSnippetId = null;
      saveState();
      fillAccordion(qs('#rs-snippets-accordion'));
      fillDetail(container);
      showToast('Snippet removed.', 'success');
      log('Snippet removed', { id: snp.id });
    };
  }

  // Boot
  function boot() {
    try {
      if (PAGE_PARAM === PAGES.SNIPPETS) render();
    } catch (e) {
      error('Render failed', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();