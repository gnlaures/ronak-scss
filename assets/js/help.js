/* Ronak SCSS – Help/Docs tiny enhancements
 * - Copy buttons on code samples
 */
(function () {
  'use strict';
  if (!document.body.classList.contains('is-ronak-scss-plugin')) return;

  var root = document.querySelector('.rs-doc');
  if (!root) return;

  function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(String(text)).then(function () { return true; });
      }
      var ta = document.createElement('textarea');
      ta.value = String(text);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('.rs-doc__copy');
    if (!btn) return;
    var value = btn.getAttribute('data-copy') || '';
    copy(value).then(function (ok) {
      try {
        if (window.RonakSCSS && RonakSCSS.Core && RonakSCSS.Core.toast) {
          RonakSCSS.Core.toast.show(ok ? 'Copied' : 'Copy failed', ok ? 'success' : 'error');
        } else {
          btn.textContent = ok ? 'Copied' : 'Copy failed';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1200);
        }
      } catch (_) {}
    });
  });
})();