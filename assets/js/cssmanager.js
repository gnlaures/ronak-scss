/* CSS Manager UI (JS) */
(function () {
  'use strict';
  if (!document.body.classList.contains('is-ronak-scss-plugin')) return;

  var Core = (window.RonakSCSS && window.RonakSCSS.Core) || null;
  if (!Core || Core.page.getPageParam() !== 'ronak-scss-cssmanager') return;

  var qs = Core.dom.qs,
    el = Core.dom.el,
    toast = Core.toast.show;

  var LS_KEY = 'ronak_scss_state_v1';
  function loadState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function saveState(s) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(s || state));
    } catch (e) {}
  }

  function ensureManagerDefaults(comp) {
    if (typeof comp.active !== 'boolean') comp.active = false;
    if (!comp.outputStyle) comp.outputStyle = 'compressed';
    if (!comp.context || comp.context === 'shortcode_only') comp.context = 'none';
    if (!comp.selectedAreas) comp.selectedAreas = { postIds: '', termIds: '' };
    comp.lastCompiledAt = comp.lastCompiledAt || null;
    comp.lastCompiledHash = comp.lastCompiledHash || null;
    comp._statusCheck = comp._statusCheck || { hash: null, ok: null, pending: false };
    return comp;
  }

  var defaultsSnippets = [
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
        '@mixin respond($break) {\n  @if $break == sm { @media (min-width: 640px) { @content; } }\n  @if $break == md { @media (min-width: 768px) { @content; } }\n}',
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
    }
  ];
  var defaultsCompilations = [
    {
      id: 'cmp_base',
      name: 'Base Styles',
      slug: 'base-styles.scss',
      snippetIds: ['snp_vars_base', 'snp_mixins_media', 'snp_presets_typo']
    },
    {
      id: 'cmp_theme',
      name: 'Theme Styles',
      slug: 'theme.scss',
      snippetIds: ['snp_vars_base', 'snp_component_button']
    }
  ];

  var state = (function () {
    var s = loadState();
    if (s && Array.isArray(s.snippets) && Array.isArray(s.compilations)) {
      s.compilations.forEach(ensureManagerDefaults);
      return s;
    }
    var init = {
      snippets: defaultsSnippets.slice(),
      compilations: defaultsCompilations.slice(),
      selectedSnippetId: null,
      selectedCompilationId: null,
      ui: { searchCompilations: '', searchSnippets: '' }
    };
    init.compilations.forEach(ensureManagerDefaults);
    saveState(init);
    return init;
  })();

  function getSnippet(id) {
    return state.snippets.find(function (s) {
      return s.id === id;
    }) || null;
  }

  function outputBaseUrl() {
    var base =
      (window.RonakSCSS && RonakSCSS.outputBaseUrl)
        ? RonakSCSS.outputBaseUrl
        : window.location.origin + '/wp-content/uploads/ronak-scss/';
    if (!/\/$/.test(base)) base += '/';
    return base;
  }
  function normalizeSlug(s) {
    var slug = String(s || 'untitled-compilation.scss').trim();
    if (!/\.scss$/i.test(slug)) slug += '.scss';
    slug = slug.replace(/[\/\\]+/g, '');
    return slug;
  }
  function toCssFile(scssSlug) {
    var base = String(scssSlug || 'styles.scss');
    base = base.replace(/\.scss$/i, '');
    return base + '.css';
  }
  function buildAssetUrls(comp) {
    var uid = String(comp.id || '').trim();
    var scssSlug = normalizeSlug(comp.slug);
    var cssFile = toCssFile(scssSlug);
    var base = outputBaseUrl();
    return {
      scssUrl: base + uid + '/' + scssSlug,
      cssUrl: base + uid + '/' + cssFile
    };
  }

  function concatPreview(ids) {
    var parts = [];
    (ids || []).forEach(function (id) {
      var sn = getSnippet(id);
      if (!sn) return;
      parts.push('/*__RS_SNIPPET_START:' + sn.id + ':' + (sn.title || '') + '*/');
      parts.push(sn.scss || '');
      parts.push('/*__RS_SNIPPET_END:' + sn.id + '*/\n');
    });
    return parts.join('\n');
  }

  // Style normalization and hash (matches server behavior)
  function normalizeStyle(style) {
    return String(style) === 'expanded' ? 'expanded' : 'compressed';
  }
  function hashTextWithStyle(text, style) {
    var s = normalizeStyle(style);
    var input = String(text || '') + '|' + s;
    var h = 5381;
    for (var i = 0; i < input.length; i++) {
      h = ((h << 5) + h) ^ input.charCodeAt(i);
    }
    return String(h >>> 0);
  }

  function sanitizeIdList(str) {
    var v = String(str || '')
      .replace(/[^\d,]/g, ',')
      .split(',')
      .map(function (x) {
        return x.trim();
      })
      .filter(function (x) {
        return x.length > 0 && /^\d+$/.test(x);
      });
    var seen = Object.create(null),
      out = [];
    for (var i = 0; i < v.length; i++) {
      if (!seen[v[i]]) {
        seen[v[i]] = 1;
        out.push(v[i]);
      }
    }
    return out.join(',');
  }
  function formatDateTime(ts) {
    if (!ts) return 'Never';
    var d = new Date(ts);
    var y = d.getFullYear(),
      mo = String(d.getMonth() + 1).padStart(2, '0'),
      da = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0'),
      mm = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + mo + '-' + da + ' ' + hh + ':' + mm;
  }
  function debounce(fn, ms) {
    var id = null;
    return function () {
      var ctx = this,
        args = arguments;
      clearTimeout(id);
      id = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms || 250);
    };
  }
  function copyText(txt) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText)
        return navigator.clipboard
          .writeText(String(txt))
          .then(function () {
            return true;
          })
          .catch(function () {
            return false;
          });
      var ta = document.createElement('textarea');
      ta.value = String(txt);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return Promise.resolve(true);
    } catch (_) {
      return Promise.resolve(false);
    }
  }
  function ellipsisFile(url) {
    try {
      var u = new URL(String(url));
      var parts = u.pathname.split('/');
      var n = parts.length;
      if (n >= 3) return '…/' + parts[n - 2] + '/' + parts[n - 1];
      return '…/' + parts[n - 1];
    } catch (_) {
      var p = String(url || '').split('/');
      var m = p.length;
      if (m >= 2) return '…/' + p[m - 2] + '/' + p[m - 1];
      return String(url || '');
    }
  }

  // ---- File size helpers (HEAD with fallback to Range) ----
  var fileSizeCache = Object.create(null);
  function formatBytesShort(bytes) {
    var n = Number(bytes);
    if (!isFinite(n) || n < 0) return '';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n = n / 1024;
      i++;
    }
    var rounded = Math.round(n);
    return String(rounded) + units[i];
  }
  function parseSizeFromHeaders(headers) {
    var len = headers.get && headers.get('Content-Length');
    if (len && /^\d+$/.test(len)) return parseInt(len, 10);
    var range = headers.get && headers.get('Content-Range');
    if (range) {
      var m = /\/(\d+)$/.exec(range);
      if (m && m[1]) return parseInt(m[1], 10);
    }
    return null;
  }
  function headWithTimeout(url, ms) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var id = null;
    if (controller) {
      id = setTimeout(function () {
        try {
          controller.abort();
        } catch (e) {}
      }, ms || 5000);
    }
    return fetch(url, {
      method: 'HEAD',
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    }).finally(function () {
      if (id) clearTimeout(id);
    });
  }
  function getWithRange(url, ms) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var id = null;
    if (controller) {
      id = setTimeout(function () {
        try {
          controller.abort();
        } catch (e) {}
      }, ms || 7000);
    }
    return fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    }).finally(function () {
      if (id) clearTimeout(id);
    });
  }
  function fetchFileSize(url) {
    var key = String(url || '');
    if (fileSizeCache[key]) return fileSizeCache[key];
    var p = headWithTimeout(key, 5000)
      .then(function (res) {
        if (!res.ok) throw new Error('HEAD failed');
        var size = parseSizeFromHeaders(res.headers || {});
        if (size !== null) return size;
        return getWithRange(key, 7000).then(function (r) {
          if (!r.ok && r.status !== 206) throw new Error('Range failed');
          var size2 = parseSizeFromHeaders(r.headers || {});
          return size2 !== null ? size2 : null;
        });
      })
      .catch(function () {
        return null;
      });
    fileSizeCache[key] = p;
    return p;
  }

  var root = qs('#ronak-scss-cssmanager-root');
  if (!root) return;

  function saveNow() {
    saveState(state);
  }
  var saveDebounced = debounce(saveNow, 300);

  function persistCompile(comp, scss, css, hash) {
    var rest = (window.RonakSCSS && RonakSCSS.rest) ? RonakSCSS.rest : null;
    if (!rest || !rest.baseUrl || !rest.nonce) {
      toast('Persist skipped: REST boot data missing.', 'warning');
      return Promise.resolve({ ok: false, skipped: true });
    }
    var url =
      String(rest.baseUrl).replace(/\/+$/, '') +
      '/ronak-scss/v1/compilations/' +
      encodeURIComponent(comp.id) +
      '/compile';
    var slugNoExt = String(normalizeSlug(comp.slug || 'untitled-compilation.scss')).replace(
      /\.scss$/i,
      ''
    );
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': rest.nonce
      },
      body: JSON.stringify({
        scss: String(scss || ''),
        css: String(css || ''),
        output_style: String(normalizeStyle(comp.outputStyle || 'compressed')),
        slug: slugNoExt
      }),
      credentials: 'same-origin'
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { status: r.status, json: j };
        });
      })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300 && res.json) {
          comp.lastCompiledHash = String(res.json.last_compiled_hash || '');
          comp.lastCompiledAt = Date.now();
          comp._statusCheck = { hash: null, ok: null, pending: false };
          saveDebounced();
          return { ok: true, data: res.json };
        }
        toast('Persist failed', 'error');
        return { ok: false, error: res.json };
      })
      .catch(function () {
        toast('Network error while persisting', 'error');
        return { ok: false };
      });
  }

  function render() {
    if (!state.compilations.length) {
      root.innerHTML =
        '<div class="rs-empty"><div><div class="rs-empty__title">No compilations found</div><div class="rs-muted">Create one in the Compilations page.</div></div></div>';
      return;
    }

    var frag = document.createDocumentFragment();

    state.compilations.forEach(function (c) {
      ensureManagerDefaults(c);

      var urls = buildAssetUrls(c);

      var card = el('div', { className: 'rs-css-card' });

      var row1 = el('div', { className: 'rs-css-card__row1' });
      var titleWrap = el('div', { className: 'rs-css-card__title' });
      var titleDot = el('span', { className: 'rs-status__dot', attrs: { 'aria-hidden': 'true' } });
      var nameEl = el('div', { className: 'rs-css-card__name', text: c.name || '(untitled)' });
      titleWrap.appendChild(titleDot);
      titleWrap.appendChild(nameEl);
      row1.appendChild(titleWrap);

      var actions = el('div', { className: 'rs-css-card__actions' });
      var toggleId = 'rs-toggle-' + c.id;
      var toggleWrap = el('div', { className: 'rs-toggle' });
      var toggleInput = el('input', {
        attrs: { id: toggleId, type: 'checkbox', 'aria-label': 'Active' }
      });
      if (c.active) toggleInput.checked = true;
      var toggleLabel = el('label', { attrs: { for: toggleId } });
      var toggleTrack = el('span', { className: 'rs-toggle__track' });
      var toggleThumb = el('span', { className: 'rs-toggle__thumb' });
      toggleTrack.appendChild(toggleThumb);
      var toggleText = el('span', {
        className: 'rs-toggle__text',
        text: c.active ? 'Active' : 'Inactive'
      });
      toggleLabel.appendChild(toggleTrack);
      toggleLabel.appendChild(toggleText);
      toggleWrap.appendChild(toggleInput);
      toggleWrap.appendChild(toggleLabel);
      actions.appendChild(toggleWrap);
      row1.appendChild(actions);
      card.appendChild(row1);

      var rowMeta = el('div', { className: 'rs-css-card__rowMeta' });

      var shortBlock = el('div', { className: 'rs-field' });
      shortBlock.appendChild(el('div', { className: 'rs-label', text: 'Shortcode' }));
      var shortcodeStr = '[ronak-scss id="' + c.id + '"]';
      shortBlock.appendChild(makeShortcodeBadge(shortcodeStr));
      rowMeta.appendChild(shortBlock);

      var scssBlock = el('div', { className: 'rs-field' });
      scssBlock.appendChild(el('div', { className: 'rs-label', text: 'SCSS file' }));
      scssBlock.appendChild(makeFileBadge(urls.scssUrl));
      rowMeta.appendChild(scssBlock);

      var cssBlock = el('div', { className: 'rs-field' });
      cssBlock.appendChild(el('div', { className: 'rs-label', text: 'CSS file' }));
      cssBlock.appendChild(makeFileBadge(urls.cssUrl));
      rowMeta.appendChild(cssBlock);

      var dateBlock = el('div', { className: 'rs-field' });
      dateBlock.appendChild(el('div', { className: 'rs-label', text: 'Last compilation date' }));
      var dateBadge = el('div', { className: 'rs-badge' });
      var dateMono = el('span', {
        className: 'rs-badge__mono',
        text: formatDateTime(c.lastCompiledAt)
      });
      dateBadge.appendChild(dateMono);
      dateBlock.appendChild(dateBadge);
      rowMeta.appendChild(dateBlock);

      var statusBlock = el('div', { className: 'rs-statusblock' });
      var statusInfo = el('div', { className: 'rs-status__info' });
      statusInfo.appendChild(el('div', { className: 'rs-label', text: 'Status' }));
      var statusLine = el('div', { className: 'rs-statusblock__line' });
      var statusDot = el('span', { className: 'rs-status__dot', attrs: { 'aria-hidden': 'true' } });
      var statusText = el('span', { className: 'rs-status__text', text: 'Loading…' });
      var statusTip = el('span', {
        className: 'rs-icon rs-icon--info',
        attrs: { role: 'img', 'aria-label': '', title: '' }
      });
      statusLine.appendChild(statusDot);
      statusLine.appendChild(statusText);
      statusLine.appendChild(statusTip);
      statusInfo.appendChild(statusLine);
      var statusActions = el('div', { className: 'rs-status__actions' });
      statusBlock.appendChild(statusInfo);
      statusBlock.appendChild(statusActions);
      rowMeta.appendChild(statusBlock);

      card.appendChild(rowMeta);

      var rowOpts = el('div', { className: 'rs-css-card__rowOpts' });

      var colStyle = el('div', { className: 'rs-field' });
      colStyle.appendChild(
        el('label', { className: 'rs-label', attrs: { for: 'out-' + c.id }, text: 'Output style' })
      );
      var selStyle = el('select', {
        className: 'rs-select',
        attrs: { id: 'out-' + c.id, 'aria-label': 'Output style' }
      });
      [
        ['compressed', 'Compressed'],
        ['expanded', 'Expanded']
      ].forEach(function (opt) {
        var o = el('option', { text: opt[1] });
        o.value = opt[0];
        if ((c.outputStyle || 'compressed') === opt[0]) o.selected = true;
        selStyle.appendChild(o);
      });
      colStyle.appendChild(selStyle);
      rowOpts.appendChild(colStyle);

      var autoGrid = el('div', { className: 'rs-autoinsert-grid' });
      var fieldAuto = el('div', { className: 'rs-field' });
      fieldAuto.appendChild(
        el('label', { className: 'rs-label', attrs: { for: 'auto-' + c.id }, text: 'Auto insert' })
      );
      var selAuto = el('select', {
        className: 'rs-select',
        attrs: { id: 'auto-' + c.id, 'aria-label': 'Auto insert' }
      });
      [
        ['none', 'No auto insert'],
        ['all_frontend', 'All frontend'],
        ['admin_area', 'Admin area'],
        ['all_pages', 'All pages (front and admin)'],
        ['selected_areas', 'Selected areas']
      ].forEach(function (opt) {
        var o = el('option', { text: opt[1] });
        o.value = opt[0];
        if ((c.context || 'none') === opt[0]) o.selected = true;
        selAuto.appendChild(o);
      });
      fieldAuto.appendChild(selAuto);
      autoGrid.appendChild(fieldAuto);

      var fieldPostIds = el('div', {
        className: 'rs-cond' + (c.context === 'selected_areas' ? ' is-visible' : '')
      });
      var postField = el('div', { className: 'rs-field' });
      postField.appendChild(
        el('label', {
          className: 'rs-label',
          attrs: { for: 'ids-' + c.id },
          text: 'Post/Page IDs (IDs only)'
        })
      );
      var idsInput = el('input', {
        className: 'rs-input',
        attrs: {
          id: 'ids-' + c.id,
          type: 'text',
          value: c.selectedAreas.postIds || '',
          placeholder: 'e.g. 12,45,102',
          'aria-label': 'Post/Page IDs'
        }
      });
      postField.appendChild(idsInput);
      fieldPostIds.appendChild(postField);
      autoGrid.appendChild(fieldPostIds);

      var fieldTermIds = el('div', {
        className: 'rs-cond' + (c.context === 'selected_areas' ? ' is-visible' : '')
      });
      var termField = el('div', { className: 'rs-field' });
      termField.appendChild(
        el('label', {
          className: 'rs-label',
          attrs: { for: 'terms-' + c.id },
          text: 'Term IDs (IDs only)'
        })
      );
      var termsInput = el('input', {
        className: 'rs-input',
        attrs: {
          id: 'terms-' + c.id,
          type: 'text',
          value: c.selectedAreas.termIds || '',
          placeholder: 'e.g. 34,58',
          'aria-label': 'Term IDs'
        }
      });
      termField.appendChild(termsInput);
      fieldTermIds.appendChild(termField);
      autoGrid.appendChild(fieldTermIds);

      rowOpts.appendChild(autoGrid);
      card.appendChild(rowOpts);

      toggleInput.addEventListener('change', function () {
        c.active = !!toggleInput.checked;
        toggleText.textContent = c.active ? 'Active' : 'Inactive';
        nameEl.classList.toggle('is-inactive', !c.active);
        saveDebounced();
      });
      nameEl.classList.toggle('is-inactive', !c.active);

      selStyle.onchange = function () {
        c.outputStyle = selStyle.value || 'compressed';
        c._statusCheck = { hash: null, ok: null, pending: false };
        saveDebounced();
        updateStatusUI();
      };
      selAuto.onchange = function () {
        c.context = selAuto.value || 'none';
        toggleConditionals();
        saveDebounced();
      };
      idsInput &&
        (idsInput.oninput = function (e) {
          var v = sanitizeIdList(e.target.value);
          if (v !== e.target.value) e.target.value = v;
          c.selectedAreas.postIds = v;
          saveDebounced();
        });
      termsInput &&
        (termsInput.oninput = function (e) {
          var v = sanitizeIdList(e.target.value);
          if (v !== e.target.value) e.target.value = v;
          c.selectedAreas.termIds = v;
          saveDebounced();
        });

      function toggleConditionals() {
        var isSel = selAuto.value === 'selected_areas';
        fieldPostIds.classList.toggle('is-visible', isSel);
        fieldTermIds.classList.toggle('is-visible', isSel);
      }
      toggleConditionals();

      function updateStatusUI() {
        var scss = concatPreview(c.snippetIds || []);
        var currentHash = hashTextWithStyle(scss, c.outputStyle);
        var upToDate =
          !!c.lastCompiledHash && c.lastCompiledHash === currentHash && !!c.lastCompiledAt;

        if (upToDate) {
          setStatus('compiled', 'Compiled');
          renderAction('Recompile', function () {
            doCompile(scss, currentHash);
          });
          return;
        }

        if (c._statusCheck.hash === currentHash && c._statusCheck.ok !== null) {
          finalizeByCheck(c._statusCheck.ok);
          return;
        }

        if (c._statusCheck.pending) return;
        c._statusCheck.pending = true;
        compileScssToCss(scss, c.outputStyle)
          .then(function (res) {
            c._statusCheck.hash = currentHash;
            c._statusCheck.ok = !!res.ok;
            c._statusCheck.pending = false;
            finalizeByCheck(!!res.ok);
          })
          .catch(function () {
            c._statusCheck.hash = currentHash;
            c._statusCheck.ok = false;
            c._statusCheck.pending = false;
            finalizeByCheck(false);
          });

        function finalizeByCheck(ok) {
          if (ok) {
            setStatus('available', 'Compilation available');
            renderAction('Compile now', function () {
              doCompile(scss, currentHash);
            });
          } else {
            setStatus('blocked', 'New Compilation blocked');
            clearActions();
          }
        }
      }

      function setStatus(kind, text) {
        [titleDot, statusDot].forEach(function (d) {
          d.classList.remove('is-ok', 'is-available', 'is-blocked');
          if (kind === 'compiled') d.classList.add('is-ok');
          if (kind === 'available') d.classList.add('is-available');
          if (kind === 'blocked') d.classList.add('is-blocked');
        });
        statusText.textContent = text || '';
        var tip = '';
        if (kind === 'compiled') tip = 'Your SCSS code has been compiled successfully.';
        else if (kind === 'available')
          tip =
            'Your SCSS code has pending changes not present in the CSS file. Please compile again.';
        else if (kind === 'blocked') tip = 'Your SCSS code contains errors and cannot be compiled.';
        statusTip.setAttribute('title', tip);
        statusTip.setAttribute('aria-label', tip);
        dateMono.textContent = formatDateTime(c.lastCompiledAt);
      }

      function clearActions() {
        statusActions.innerHTML = '';
      }
      function renderAction(label, handler) {
        clearActions();
        var btn = el('button', {
          className: 'rs-btn rs-btn--pastel-primary',
          attrs: { type: 'button' },
          text: label
        });
        btn.onclick = function () {
          btn.disabled = true;
          handler();
          setTimeout(function () {
            btn.disabled = false;
          }, 1200);
        };
        statusActions.appendChild(btn);
      }

      function doCompile(scss, currentHash) {
        compileScssToCss(scss, c.outputStyle)
          .then(function (res) {
            if (res.ok) {
              c.lastCompiledAt = Date.now();
              c.lastCompiledHash = currentHash;
              c._statusCheck.hash = currentHash;
              c._statusCheck.ok = true;
              saveDebounced();
              persistCompile(c, scss, res.css || '', currentHash).then(function () {
                toast('Compiled successfully', 'success');
                urls = buildAssetUrls(c);
                cssBlock
                  .querySelector('.rs-badge')
                  .replaceWith(makeFileBadge(urls.cssUrl));
                scssBlock
                  .querySelector('.rs-badge')
                  .replaceWith(makeFileBadge(urls.scssUrl));
                updateStatusUI();
              });
            } else {
              c._statusCheck.ok = false;
              toast(res.error || 'Compile error', 'error');
              updateStatusUI();
            }
          })
          .catch(function () {
            toast('Compile failed', 'error');
            updateStatusUI();
          });
      }

      // --- Sass API helpers (shared) ---
      function detectSassApi() {
        if (!window.Sass || typeof window.Sass.compile !== 'function') return 'none';
        return window.Sass.compile.length <= 2 ? 'sync' : 'worker';
      }

      function ensureSass() {
        // Prefer centralized helper with CDN -> local fallback
        if (
          window.RonakSCSS &&
          RonakSCSS.Core &&
          RonakSCSS.Core.sass &&
          typeof RonakSCSS.Core.sass.ensureSync === 'function'
        ) {
          return RonakSCSS.Core.sass.ensureSync().then(function (kind) {
            if (
              kind === 'worker' &&
              typeof window.Sass.setWorkerUrl === 'function' &&
              window.RonakSCSS &&
              RonakSCSS.pluginUrl
            ) {
              try {
                window.Sass.setWorkerUrl(RonakSCSS.pluginUrl + 'assets/vendor/sass.worker.min.js');
              } catch (_) {}
            }
            return kind;
          });
        }

        // Local fallback loader if core helper is unavailable
        var cdn = 'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.min.js';
        var local =
          (window.RonakSCSS && RonakSCSS.pluginUrl
            ? RonakSCSS.pluginUrl + 'assets/libs/sass.js'
            : '/wp-content/plugins/ronak-scss-main/assets/libs/sass.js');
        var id = 'rs-sass-sync';

        function load(url) {
          return new Promise(function (resolve, reject) {
            if (document.getElementById(id)) {
              resolve();
              return;
            }
            var s = document.createElement('script');
            s.id = id;
            s.src = url;
            s.async = true;
            s.onload = function () {
              resolve();
            };
            s.onerror = function () {
              reject(new Error('Failed to load ' + url));
            };
            document.head.appendChild(s);
          });
        }

        return load(cdn)
          .catch(function () {
            return load(local);
          })
          .then(function () {
            return detectSassApi();
          })
          .catch(function () {
            return 'none';
          });
      }

      function compileScssToCss(text, style) {
        var want = normalizeStyle(style);
        return ensureSass().then(function (kind) {
          var opts = {};
          var SassObj = window.Sass || {};
          var hasEnum = SassObj && SassObj.style && typeof SassObj.style === 'object';
          if (hasEnum) {
            opts.style =
              want === 'expanded'
                ? SassObj.style.expanded || SassObj.style.nested || 'expanded'
                : SassObj.style.compressed || 'compressed';
          } else {
            opts.style = want;
          }
          if (want === 'compressed') opts.comments = false;

          if (kind === 'sync') {
            try {
              var res = window.Sass.compile(String(text || ''), opts);
              if (res && res.status === 0) return { ok: true, css: res.text || '' };
              return {
                ok: false,
                error: (res && (res.message || res.formatted)) || 'Compile error'
              };
            } catch (e) {
              return { ok: false, error: (e && e.message) || 'Compile error' };
            }
          }
          if (kind === 'worker') {
            return new Promise(function (resolve) {
              var done = false;
              try {
                window.Sass.compile(String(text || ''), opts, function (res) {
                  if (done) return;
                  done = true;
                  if (res && res.status === 0) resolve({ ok: true, css: res.text || '' });
                  else
                    resolve({
                      ok: false,
                      error: (res && (res.message || res.formatted)) || 'Compile error'
                    });
                });
                setTimeout(function () {
                  if (!done) resolve({ ok: false, error: 'Sass worker timeout' });
                }, 7000);
              } catch (e) {
                resolve({ ok: false, error: (e && e.message) || 'Compile error' });
              }
            });
          }
          return { ok: false, error: 'Sass not available' };
        });
      }

      // Initial status
      updateStatusUI();

      // Append card
      frag.appendChild(card);

      // ---- Badge builders ----
      function makeFileBadge(url) {
        var display = ellipsisFile(url);
        var wrap = el('div', { className: 'rs-badge' });
        var a = el('a', {
          className: 'rs-badge__link rs-badge__mono',
          attrs: {
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: url
          },
          text: display
        });

        // Size container appended to anchor (populates async)
        var sizeSpan = el('span', { className: 'rs-file-size' });
        a.appendChild(document.createTextNode(' ')); // space before size
        a.appendChild(sizeSpan);

        // Kick off async size fetch
        fetchFileSize(url).then(function (bytes) {
          if (bytes === null) {
            sizeSpan.textContent = '';
            return;
          }
          var human = formatBytesShort(bytes);
          sizeSpan.textContent = human ? '(' + human + ')' : '';
        });

        var copyBtn = el('button', {
          className: 'rs-icon-btn',
          attrs: { type: 'button', 'aria-label': 'Copy URL', title: 'Copy URL' }
        });
        var icon = el('span', { className: 'rs-icon rs-icon--copy', attrs: { 'aria-hidden': 'true' } });
        copyBtn.appendChild(icon);
        copyBtn.onclick = function () {
          copyText(url).then(function (ok) {
            toast(ok ? 'Copied' : 'Copy failed', ok ? 'success' : 'error');
          });
        };
        wrap.appendChild(a);
        wrap.appendChild(copyBtn);
        return wrap;
      }

      function makeShortcodeBadge(code) {
        var wrap = el('div', { className: 'rs-badge' });
        var codeEl = el('span', { className: 'rs-badge__mono', text: code });
        var copyBtn = el('button', {
          className: 'rs-icon-btn',
          attrs: { type: 'button', 'aria-label': 'Copy shortcode', title: 'Copy shortcode' }
        });
        var icon = el('span', { className: 'rs-icon rs-icon--copy', attrs: { 'aria-hidden': 'true' } });
        copyBtn.appendChild(icon);
        copyBtn.onclick = function () {
          copyText(code).then(function (ok) {
            toast(ok ? 'Copied' : 'Copy failed', ok ? 'success' : 'error');
          });
        };
        wrap.appendChild(codeEl);
        wrap.appendChild(copyBtn);
        return wrap;
      }
    });

    root.innerHTML = '';
    root.appendChild(frag);
  }

  function boot() {
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();