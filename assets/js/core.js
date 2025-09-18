/* Ronak SCSS Core helpers: DOM, page, toast, assets loader, Sass ensure, Preview API, Editor API. */
(function () {
  'use strict';

  var NS = (window.RonakSCSS = window.RonakSCSS || {});
  NS.Core = NS.Core || {};
  var Core = NS.Core;

  // DOM helpers
  Core.dom = Core.dom || {};
  if (!Core.dom.qs) {
    Core.dom.qs = function qs(sel, root) {
      return (root || document).querySelector(sel);
    };
  }
  if (!Core.dom.qsa) {
    Core.dom.qsa = function qsa(sel, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    };
  }
  if (!Core.dom.el) {
    Core.dom.el = function el(tag, opts) {
      var node = document.createElement(tag);
      if (!opts) return node;
      if (opts.className) node.className = String(opts.className);
      if (opts.text !== undefined && opts.text !== null) {
        node.textContent = String(opts.text);
      } else if (opts.html !== undefined && opts.html !== null) {
        node.innerHTML = String(opts.html);
      }
      if (opts.attrs && typeof opts.attrs === 'object') {
        for (var k in opts.attrs) {
          if (!Object.prototype.hasOwnProperty.call(opts.attrs, k)) continue;
          var v = opts.attrs[k];
          if (v === false || v === null || v === undefined) continue;
          node.setAttribute(k, String(v));
        }
      }
      return node;
    };
  }

  // Page helpers
  Core.page = Core.page || {};
  if (!Core.page.getPageParam) {
    Core.page.getPageParam = function getPageParam() {
      try {
        var sp = new URLSearchParams(window.location.search);
        return sp.get('page') || '';
      } catch (e) {
        var m = /[?&]page=([^&]+)/.exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : '';
      }
    };
  }
  if (!Core.page.makeAdminUrl) {
    Core.page.makeAdminUrl = function makeAdminUrl(page, params) {
      var loc = window.location;
      var path = loc.pathname;
      var base;
      if (/\/wp-admin\/.+/.test(path)) {
        base = loc.origin + path.replace(/\/[^/]*$/, '/admin.php');
      } else {
        base = loc.origin + '/wp-admin/admin.php';
      }
      var qs = '?page=' + encodeURIComponent(page || '');
      if (params && typeof params === 'object') {
        var extra = Object.keys(params)
          .map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k]));
          })
          .join('&');
        if (extra) qs += '&' + extra;
      }
      return base + qs;
    };
  }

  // Toast
  Core.toast = Core.toast || {};
  if (!Core.toast.show) {
    Core.toast.show = function show(message, type) {
      var kind = String(type || 'info');
      var containerId = 'rs-toast-container';
      var container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.setAttribute('aria-live', 'polite');
        container.style.position = 'fixed';
        container.style.zIndex = '99999';
        container.style.right = '16px';
        container.style.bottom = '16px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
      }
      var item = document.createElement('div');
      item.setAttribute('role', 'alert');
      item.style.padding = '10px 12px';
      item.style.borderRadius = '6px';
      item.style.color = '#0b0b0c';
      item.style.background = '#eef3ff';
      item.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)';
      item.style.font =
        'normal 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

      if (kind === 'success') item.style.background = '#e8f7ee';
      if (kind === 'error') item.style.background = '#fdecea';
      if (kind === 'warning') item.style.background = '#fff7e6';

      item.textContent = String(message || '');
      container.appendChild(item);

      setTimeout(function () {
        try {
          item.remove();
          if (!container.children.length) container.remove();
        } catch (_) {}
      }, 3000);
    };
  }

  // Assets loader
  Core.assets = Core.assets || {};
  if (!Core.assets._loadScriptTagOnce) {
    Core.assets._loadScriptTagOnce = function _loadScriptTagOnce(id, url, timeoutMs) {
      return new Promise(function (resolve, reject) {
        if (id) {
          var exists = document.getElementById(id);
          if (exists) {
            resolve({ url: url, cached: true });
            return;
          }
        }
        var s = document.createElement('script');
        if (id) s.id = id;
        s.src = url;
        s.async = true;

        var timer = null;
        if (timeoutMs && typeof AbortController === 'undefined') {
          timer = setTimeout(function () {
            try {
              s.remove();
            } catch (_) {}
            reject(new Error('Timeout loading ' + url));
          }, timeoutMs);
        }

        s.onload = function () {
          if (timer) clearTimeout(timer);
          resolve({ url: url, cached: false });
        };
        s.onerror = function () {
          if (timer) clearTimeout(timer);
          reject(new Error('Failed to load ' + url));
        };

        document.head.appendChild(s);
      });
    };
  }
  if (!Core.assets.loadScriptOnce) {
    Core.assets.loadScriptOnce = function loadScriptOnce(id, url, timeoutMs) {
      return Core.assets._loadScriptTagOnce(id, url, timeoutMs);
    };
  }
  if (!Core.assets.loadStyleOnce) {
    Core.assets.loadStyleOnce = function loadStyleOnce(id, url) {
      return new Promise(function (resolve, reject) {
        if (id && document.getElementById(id)) {
          resolve({ url: url, cached: true });
          return;
        }
        var l = document.createElement('link');
        if (id) l.id = id;
        l.rel = 'stylesheet';
        l.href = url;
        l.onload = function () {
          resolve({ url: url, cached: false });
        };
        l.onerror = function () {
          reject(new Error('Failed to load ' + url));
        };
        document.head.appendChild(l);
      });
    };
  }
  if (!Core.assets.loadScriptWithFallback) {
    Core.assets.loadScriptWithFallback = function loadScriptWithFallback(id, urls, timeoutMs) {
      return new Promise(function (resolve, reject) {
        var idx = 0;
        function attempt() {
          if (!urls || idx >= urls.length) {
            reject(new Error('All sources failed for script ' + (urls && urls[0] ? urls[0] : '')));
            return;
          }
          var url = urls[idx++];
          Core.assets._loadScriptTagOnce(id, url, timeoutMs).then(resolve).catch(attempt);
        }
        attempt();
      });
    };
  }

  // Sass ensure (sync) with CDN -> local fallback
  Core.sass = Core.sass || {};
  if (!Core.sass.ensureSync) {
    Core.sass.ensureSync = function ensureSync() {
      if (window.Sass && typeof window.Sass.compile === 'function') {
        return Promise.resolve(window.Sass.compile.length <= 2 ? 'sync' : 'worker');
      }
      var cdnUrl = 'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.min.js';
      var localUrl = NS.pluginUrl
        ? NS.pluginUrl + 'assets/libs/sass.js'
        : '/wp-content/plugins/ronak-scss-main/assets/libs/sass.js';
      return Core.assets
        .loadScriptWithFallback('rs-sass-sync', [cdnUrl, localUrl], 6000)
        .then(function () {
          if (window.Sass && typeof window.Sass.compile === 'function') {
            if (typeof window.Sass.setWorkerUrl === 'function' && NS.pluginUrl) {
              try {
                window.Sass.setWorkerUrl(NS.pluginUrl + 'assets/vendor/sass.worker.min.js');
              } catch (_) {}
            }
            return window.Sass.compile.length <= 2 ? 'sync' : 'worker';
          }
          return 'none';
        })
        .catch(function () {
          return 'none';
        });
    };
  }

  // Preview API (safe default)
  if (!Core.preview) {
    var PreviewAPI = {
      _root: null,
      _styleEl: null,
      mount: function (target) {
        this._root = target || null;
        if (!this._root || !this._root.querySelector) return;
        this._root.setAttribute('data-rs-preview', 'true');
        this._styleEl = this._root.querySelector('style[data-rs-preview-style="1"]');
        if (!this._styleEl) {
          this._styleEl = document.createElement('style');
          this._styleEl.type = 'text/css';
          this._styleEl.setAttribute('data-rs-preview-style', '1');
          this._root.insertBefore(this._styleEl, this._root.firstChild);
        }
      },
      update: function (payload, maybeHtml) {
        if (!this._root) return;
        var css =
          typeof payload === 'string'
            ? payload
            : payload && typeof payload === 'object'
            ? String(payload.css || '')
            : '';
        var html =
          typeof payload === 'object' && payload && payload.html !== undefined
            ? String(payload.html || '')
            : typeof maybeHtml === 'string'
            ? maybeHtml
            : '';
        if (this._styleEl) this._styleEl.textContent = css || '';
        var htmlHost = this._root.querySelector('[data-rs-preview-html="1"]');
        if (!htmlHost) {
          htmlHost = document.createElement('div');
          htmlHost.setAttribute('data-rs-preview-html', '1');
          this._root.appendChild(htmlHost);
        }
        if (html) htmlHost.innerHTML = html;
        else if (!css) htmlHost.innerHTML = '<div class="rs-preview-empty" aria-live="polite">No preview</div>';
        else if (!htmlHost.innerHTML) htmlHost.innerHTML = '';
      },
      unmount: function () {
        if (!this._root) return;
        try {
          if (this._styleEl && this._styleEl.parentNode) this._styleEl.parentNode.removeChild(this._styleEl);
          var htmlHost = this._root.querySelector('[data-rs-preview-html="1"]');
          if (htmlHost && htmlHost.parentNode) htmlHost.parentNode.removeChild(htmlHost);
        } catch (_) {}
        this._styleEl = null;
        this._root = null;
      }
    };
    Core.preview = PreviewAPI;
    if (!window.Preview) window.Preview = Core.preview;
  } else {
    if (!window.Preview) window.Preview = Core.preview;
  }

  // Editor API (CodeMirror if available; textarea fallback)
  if (!Core.editor) {
    Core.editor = (function () {
      function createTextareaApi(textarea) {
        var hlClass = 'rs-editor-hl';
        var styleInjected = false;
        function ensureStyle() {
          if (styleInjected) return;
          var st = document.createElement('style');
          st.textContent = '.rs-editor-hl { outline: 2px solid #ff8c00; outline-offset: -2px; }';
          document.head.appendChild(st);
          styleInjected = true;
        }
        return {
          getValue: function () {
            return String(textarea.value || '');
          },
          setValue: function (v) {
            textarea.value = String(v == null ? '' : v);
          },
          highlightLine: function (_line) {
            ensureStyle();
            textarea.classList.add(hlClass);
          },
          clearHighlight: function (_line) {
            textarea.classList.remove(hlClass);
          },
          dispose: function () {
            // no-op for textarea
          }
        };
      }

      function createCodeMirrorApi(cm, textarea) {
        return {
          getValue: function () {
            return cm.getValue();
          },
          setValue: function (v) {
            cm.setValue(String(v == null ? '' : v));
          },
          highlightLine: function (line) {
            try {
              var ln = Math.max(0, (parseInt(line, 10) || 1) - 1);
              var h = cm.addLineClass(ln, 'background', 'cm-line-highlight');
              setTimeout(function () {
                try {
                  cm.removeLineClass(ln, 'background', 'cm-line-highlight');
                } catch (_) {}
              }, 1500);
            } catch (_) {}
          },
          clearHighlight: function (_line) {
            // best effort; CodeMirror handles transient highlight
          },
          dispose: function () {
            try {
              cm.toTextArea();
            } catch (_) {}
            if (textarea && textarea.parentNode) {
              // keep textarea in place
            }
          }
        };
      }

      function mount(target, options) {
        return new Promise(function (resolve) {
          var textarea = target;
          if (!(textarea instanceof HTMLElement) || textarea.tagName !== 'TEXTAREA') {
            resolve(createTextareaApi({ value: '' }));
            return;
          }

          // WordPress code editor (CodeMirror) or direct CodeMirror
          var cm = null;
          var mode = (options && options.mode) || 'text/plain';
          var readOnly = !!(options && options.cmOptions && options.cmOptions.readOnly);

          if (window.wp && wp.codeEditor && typeof wp.codeEditor.initialize === 'function') {
            try {
              var settings = window.wp.codeEditor.defaultSettings
                ? window.wp.codeEditor.defaultSettings
                : { codemirror: {} };
              settings.codemirror = settings.codemirror || {};
              settings.codemirror.mode = mode;
              settings.codemirror.readOnly = readOnly;
              // WP initialize expects the textarea element or its id
              wp.codeEditor.initialize(textarea, settings);
              cm = textarea && textarea.codemirror ? textarea.codemirror : null;
            } catch (_) {
              // ignore and fallback next
            }
          }
          if (!cm && window.CodeMirror && typeof window.CodeMirror.fromTextArea === 'function') {
            try {
              cm = window.CodeMirror.fromTextArea(textarea, {
                mode: mode,
                lineNumbers: true,
                lineWrapping: true,
                readOnly: readOnly
              });
            } catch (_) {
              // ignore and fallback
            }
          }

          if (cm) {
            // Ensure a simple highlight style
            var st = document.getElementById('rs-cm-hl-style');
            if (!st) {
              st = document.createElement('style');
              st.id = 'rs-cm-hl-style';
              st.textContent = '.cm-line-highlight { background: rgba(255,140,0,.18); }';
              document.head.appendChild(st);
            }
            resolve(createCodeMirrorApi(cm, textarea));
            return;
          }

          resolve(createTextareaApi(textarea));
        });
      }

      return { mount: mount };
    })();
  }

  Core.version = Core.version || '1.0.2-core';
})();