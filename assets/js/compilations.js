/* Ronak SCSS – Compilations page */
(function () {
  'use strict';
  if (!document.body.classList.contains('is-ronak-scss-plugin')) return;

  var Core = (window.RonakSCSS && window.RonakSCSS.Core) || null;
  if (!Core || Core.page.getPageParam() !== 'ronak-scss-compilations') return;

  var qs = Core.dom.qs, el = Core.dom.el, toast = Core.toast.show;

  // ------------------------- State -------------------------
  var LS_KEY = 'ronak_scss_state_v1';
  function loadState() { try { var raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveState(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s || state)); } catch (e) {} }
  function uuid(pfx){ return (pfx||'id_') + Math.random().toString(36).slice(2,7) + Date.now().toString(36).slice(-4); }

  var defaultsSnippets = [
    { id:'snp_vars_base', title:'Base Vars', category:'Vars', scss:'$color-primary: #2f81f7;\n$spacing-base: 1rem;', updatedAt: Date.now()-86400000 },
    { id:'snp_mixins_media', title:'Media Mixins', category:'Mixins', scss:'@mixin respond($break) {\n  @if $break == sm { @media (min-width: 640px) { @content; } }\n  @if $break == md { @media (min-width: 768px) { @content; } }\n}', updatedAt: Date.now()-720000 },
    { id:'snp_presets_typo', title:'Typography Presets', category:'Presets', scss:'h1 { font-size: 2rem; }\nh2 { font-size: 1.5rem; }', updatedAt: Date.now()-180000 },
    { id:'snp_component_button', title:'Button Component', category:'Components', scss:'.btn { padding: .625rem 1rem; border-radius: .5rem; }', updatedAt: Date.now()-30000 }
  ];
  var defaultsCompilations = [
    { id:'cmp_base', name:'Base Styles', slug:'base-styles.scss', snippetIds:['snp_vars_base','snp_mixins_media','snp_presets_typo'] },
    { id:'cmp_theme', name:'Theme Styles', slug:'theme.scss', snippetIds:['snp_vars_base','snp_component_button'] }
  ];

  var state = (function(){
    var s = loadState();
    if (s && Array.isArray(s.snippets) && Array.isArray(s.compilations)) {
      s.selectedCompilationId = s.selectedCompilationId || null;
      s.ui = s.ui || { searchCompilations:'', searchSnippets:'' };
      return s;
    }
    var init = { snippets: defaultsSnippets.slice(), compilations: defaultsCompilations.slice(), selectedSnippetId: null, selectedCompilationId: null, ui: { searchCompilations:'', searchSnippets:'' } };
    saveState(init); return init;
  })();

  var validationCache = Object.create(null);

  // Helpers
  function getCompilation(id){ return state.compilations.find(function(c){return c.id===id;})||null; }
  function getSnippet(id){ return state.snippets.find(function(s){return s.id===id;})||null; }
  function slugify(str){
    return (str||'').toString().toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
  }
  function uniqueSlug(baseNoExt, ext, excludeId){
    var base = slugify(baseNoExt) || 'file';
    var slug = base + ext, i=2;
    while (state.compilations.some(function(c){ return c.slug === slug && c.id !== excludeId; })) {
      slug = base + '-' + i + ext; i++;
    }
    return slug;
  }
  function arrayMove(arr, from, to){
    if (to<0 || to>=arr.length) return arr;
    var copy = arr.slice(); var item = copy.splice(from,1)[0]; copy.splice(to,0,item); return copy;
  }
  function outputBaseUrl(){
    var base = (window.RonakSCSS && RonakSCSS.outputBaseUrl) ? RonakSCSS.outputBaseUrl : (window.location.origin + '/wp-content/uploads/ronak-scss/');
    if (!/\/$/.test(base)) base += '/';
    return base;
  }
  function concatPreview(ids){
    var parts = [];
    (ids||[]).forEach(function(id){
      var sn = getSnippet(id); if (!sn) return;
      parts.push('/*__RS_SNIPPET_START:' + sn.id + ':' + (sn.title||'') + '*/');
      parts.push(sn.scss || '');
      parts.push('/*__RS_SNIPPET_END:' + sn.id + '*/\n');
    });
    return parts.join('\n');
  }
  function hashText(text){
    var h = 5381, i = text.length;
    while (i) { h = (h * 33) ^ text.charCodeAt(--i); }
    return String(h >>> 0);
  }

  // Sass validation via Core.sass.ensureSync (CDN -> local fallback)
  function detectSassApi(){
    if (!window.Sass || typeof window.Sass.compile !== 'function') return 'none';
    return (window.Sass.compile.length <= 2) ? 'sync' : 'worker';
  }
  function ensureSass(){
    if (window.RonakSCSS && RonakSCSS.Core && RonakSCSS.Core.sass && typeof RonakSCSS.Core.sass.ensureSync === 'function') {
      return RonakSCSS.Core.sass.ensureSync().then(function(kind){
        if (kind === 'worker' && typeof window.Sass.setWorkerUrl === 'function' && window.RonakSCSS && RonakSCSS.pluginUrl) {
          try { window.Sass.setWorkerUrl(RonakSCSS.pluginUrl + 'assets/vendor/sass.worker.min.js'); } catch (_) {}
        }
        return kind;
      });
    }
    // Fallback: try CDN then local explicit (should rarely run)
    var cdn = 'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.min.js';
    var local = (window.RonakSCSS && RonakSCSS.pluginUrl) ? RonakSCSS.pluginUrl + 'assets/libs/sass.js' : '/wp-content/plugins/ronak-scss-main/assets/libs/sass.js';
    return Core.assets._loadScriptTagOnce('rs-sass-sync', cdn, 6000)
      .catch(function(){ return Core.assets._loadScriptTagOnce('rs-sass-sync', local, 6000); })
      .then(function(){ return detectSassApi(); })
      .catch(function(){ return 'none'; });
  }
  function validateScss(text){
    return ensureSass().then(function(kind){
      if (kind === 'sync') {
        try {
          var res = window.Sass.compile(text || '');
          if (res && res.status === 0) return { ok:true, errors:[] };
          return { ok:false, errors:[res] };
        } catch (e) { return { ok:false, errors:[e] }; }
      }
      if (kind === 'worker') {
        return new Promise(function(resolve){
          var done=false;
          try {
            window.Sass.compile(text || '', function(res){
              if (done) return; done=true;
              if (res && res.status === 0) resolve({ ok:true, errors:[] });
              else resolve({ ok:false, errors:[res] });
            });
            setTimeout(function(){ if (!done) resolve({ ok:false, errors:[{ message:'Sass worker did not respond (CSP/origin).', line:null }] }); }, 6000);
          } catch (e) { resolve({ ok:false, errors:[e] }); }
        });
      }
      return { ok:true, errors:[] };
    });
  }

  // Sidebar & elements
  var sidebarList = qs('#rs-compilations-list');
  var sidebarSearch = qs('#rs-compilations-search');
  var newBtn = qs('#rs-new-compilation');
  var detailRoot = qs('#rs-compilation-detail');
  var previewEditor = null;

  if (!sidebarList || !detailRoot) return;

  function filterCompilations(){
    var term = (state.ui.searchCompilations||'').trim().toLowerCase();
    if (!term) return state.compilations.slice();
    return state.compilations.filter(function(c){
      return (c.name||'').toLowerCase().indexOf(term)!==-1 || (c.slug||'').toLowerCase().indexOf(term)!==-1;
    });
  }
  function renderSidebar(){
    if (sidebarSearch) {
      sidebarSearch.value = state.ui.searchCompilations || '';
      sidebarSearch.oninput = function(e){ state.ui.searchCompilations = e.target.value || ''; saveState(); renderSidebar(); };
    }
    var list = filterCompilations();
    if (!list.length) {
      sidebarList.innerHTML = '<div class="rs-empty rs-empty--small"><div class="rs-muted">No compilations yet.</div></div>';
      return;
    }
    var frag = document.createDocumentFragment();
    list.forEach(function(c){
      var row = el('div', { className: 'rs-cmp-item' + (state.selectedCompilationId===c.id?' is-active':'') });
      var btn = el('button', { className: 'rs-cmp-link', attrs:{ type:'button', 'data-id':c.id } });
      btn.appendChild(el('span', { className:'rs-cmp-link__title', text:c.name || '(untitled)' }));
      btn.appendChild(el('span', { className:'rs-badge', text:(c.snippetIds||[]).length + ' snip' + ((c.snippetIds||[]).length!==1?'s':'') }));
      btn.onclick = function(){ state.selectedCompilationId = c.id; saveState(); renderSidebar(); renderDetail(); };
      row.appendChild(btn); frag.appendChild(row);
    });
    sidebarList.innerHTML = '';
    sidebarList.appendChild(frag);
  }
  if (newBtn) {
    newBtn.onclick = function(){
      var id = uuid('cmp_');
      var name = 'Untitled Compilation';
      var comp = { id:id, name:name, slug: uniqueSlug(name,'.scss'), snippetIds:[] };
      state.compilations.push(comp);
      state.selectedCompilationId = id;
      saveState();
      renderSidebar(); renderDetail();
      toast('Compilation created.','success');
    };
  }

  function renderDetail(){
    detailRoot.innerHTML = '';

    if (!state.selectedCompilationId) {
      var empty = el('div', { className:'rs-empty' });
      empty.appendChild(el('h3', { className:'rs-empty__title', text:'Create a new compilation or select one on the left.' }));
      detailRoot.appendChild(empty);
      return;
    }

    var comp = getCompilation(state.selectedCompilationId);
    if (!comp) return;

    var row = el('div', { className:'rs-form-row' });

    var colTitle = el('div', { className:'rs-field rs-field--grow' });
    colTitle.appendChild(el('label', { className:'rs-label', attrs:{for:'rs-cmp-title'}, text:'Title' }));
    var inTitle = el('input', { className:'rs-input', attrs:{ id:'rs-cmp-title', type:'text', value: comp.name || '' } });
    colTitle.appendChild(inTitle);

    var colSlug = el('div', { className:'rs-field' });
    colSlug.appendChild(el('label', { className:'rs-label', attrs:{for:'rs-cmp-slug'}, text:'File path (.scss)' }));
    var fullPath = outputBaseUrl() + (comp.slug || uniqueSlug(comp.name || 'file','.scss', comp.id));
    var inSlug = el('input', { className:'rs-input', attrs:{ id:'rs-cmp-slug', type:'text', value: fullPath, readonly:'readonly' } });
    colSlug.appendChild(inSlug);

    var actions = el('div', { className:'rs-actions' });
    var btnValidate = el('button', { className:'rs-btn', attrs:{type:'button'}, text:'Validate' });
    var btnSave     = el('button', { className:'rs-btn rs-btn--primary', attrs:{type:'button', disabled:'disabled'}, text:'Save' });
    var btnDup      = el('button', { className:'rs-btn rs-btn--ghost', attrs:{type:'button'}, text:'Duplicate' });
    var btnDel      = el('button', { className:'rs-btn rs-btn--danger', attrs:{type:'button'}, text:'Remove' });
    actions.appendChild(btnValidate); actions.appendChild(btnSave); actions.appendChild(btnDup); actions.appendChild(btnDel);

    row.appendChild(colTitle); row.appendChild(colSlug); row.appendChild(actions);
    detailRoot.appendChild(row);

    var valRow = el('div', { className:'rs-cmp-valrow', attrs:{ 'aria-live':'polite' } });
    detailRoot.appendChild(valRow);

    var grid = el('div', { className:'rs-cmp-grid' });

    var colAvail = el('div', { className:'rs-cmp-col' });
    colAvail.appendChild(el('div', { className:'rs-label', text:'Available snippets' }));
    var availSearch = el('input', { className:'rs-input', attrs:{ type:'search', placeholder:'Search snippets...' } });
    availSearch.value = state.ui.searchSnippets || '';
    colAvail.appendChild(availSearch);
    var availList = el('div', { className:'rs-cmp-available' });
    colAvail.appendChild(availList);

    var colSel = el('div', { className:'rs-cmp-col' });
    colSel.appendChild(el('div', { className:'rs-label', text:'Selected snippets' }));
    var selList = el('div', { className:'rs-cmp-selected', attrs:{ 'aria-live':'polite' } });
    colSel.appendChild(selList);

    var colPrev = el('div', { className:'rs-cmp-col' });
    colPrev.appendChild(el('div', { className:'rs-label', text:'Generated SCSS (concatenated)' }));
    var taPrev = el('textarea', { className:'rs-code', attrs:{ id:'rs-cmp-preview', spellcheck:'false', readonly:'readonly' } });
    colPrev.appendChild(taPrev);

    grid.appendChild(colAvail);
    grid.appendChild(colSel);
    grid.appendChild(colPrev);
    detailRoot.appendChild(grid);

    function currentText(){ return concatPreview(comp.snippetIds || []); }
    function currentHash(){ return hashText(currentText()); }
    function setSaveEnabled(enabled){ btnSave.disabled = !enabled; }
    function invalidateValidation(){
      delete validationCache[comp.id];
      setSaveEnabled(false);
      valRow.className = 'rs-cmp-valrow';
      valRow.innerHTML = '';
    }

    function renderAvailable(){
      var term = (state.ui.searchSnippets||'').toLowerCase().trim();
      var selectedIds = new Set(comp.snippetIds || []);
      var list = state.snippets
        .filter(function(s){
          if (selectedIds.has(s.id)) return false;
          var t=(s.title||'').toLowerCase(), c=(s.category||'').toLowerCase();
          return !term || t.indexOf(term)!==-1 || c.indexOf(term)!==-1;
        })
        .sort(function(a,b){ return a.title.toLowerCase()<b.title.toLowerCase()?-1:1; });

      var frag = document.createDocumentFragment();
      if (!list.length) frag.appendChild(el('div', { className:'rs-muted', text:'No snippets found.' }));

      list.forEach(function(s){
        var row = el('div', { className:'rs-cmp-available__item' });
        row.appendChild(el('div', { className:'rs-cmp-available__title', text: s.title }));
        row.appendChild(el('div', { className:'rs-cmp-available__cat', text: s.category || '' }));
        var add = el('button', { className:'rs-btn', attrs:{ type:'button', 'aria-label':'Add snippet' }, text:'Add' });
        add.onclick = function(){
          comp.snippetIds = (comp.snippetIds || []).concat([s.id]);
          saveState(state);
          renderSelected(); updatePreview(); renderAvailable();
          invalidateValidation();
        };
        row.appendChild(add);
        frag.appendChild(row);
      });
      availList.innerHTML = '';
      availList.appendChild(frag);
    }

    function renderSelected(){
      var ids = comp.snippetIds || [];
      var frag = document.createDocumentFragment();
      if (!ids.length) frag.appendChild(el('div', { className:'rs-muted', text:'No snippets selected.' }));
      ids.forEach(function(id, idx){
        var s = getSnippet(id);
        var row = el('div', { className:'rs-cmp-selected__item', attrs:{ draggable:'true', 'data-idx': String(idx) } });
        row.appendChild(el('div', { className:'rs-cmp-selected__handle', attrs:{ 'aria-hidden':'true' }, text:'⋮⋮' }));
        row.appendChild(el('div', { className:'rs-cmp-selected__title', text: s ? s.title : id }));

        var ctrls = el('div', { className:'rs-cmp-selected__ctrls' });
        var up = el('button', { className:'rs-btn', attrs:{ type:'button', 'aria-label':'Move up' }, text:'▲' });
        var down = el('button', { className:'rs-btn', attrs:{ type:'button', 'aria-label':'Move down' }, text:'▼' });
        var rem = el('button', { className:'rs-btn rs-btn--danger', attrs:{ type:'button', 'aria-label':'Remove' }, text:'Remove' });

        up.onclick = function(){ comp.snippetIds = arrayMove(comp.snippetIds, idx, idx-1); saveState(state); renderSelected(); updatePreview(); invalidateValidation(); };
        down.onclick = function(){ comp.snippetIds = arrayMove(comp.snippetIds, idx, idx+1); saveState(state); renderSelected(); updatePreview(); invalidateValidation(); };
        rem.onclick = function(){ comp.snippetIds = comp.snippetIds.filter(function(x){return x!==id;}); saveState(state); renderSelected(); updatePreview(); renderAvailable(); invalidateValidation(); };

        ctrls.appendChild(up); ctrls.appendChild(down); ctrls.appendChild(rem);
        row.appendChild(ctrls);

        row.addEventListener('dragstart', function(e){ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', String(idx)); row.classList.add('is-dragging'); });
        row.addEventListener('dragend', function(){ row.classList.remove('is-dragging'); });
        row.addEventListener('dragover', function(e){ e.preventDefault(); row.classList.add('is-over'); });
        row.addEventListener('dragleave', function(){ row.classList.remove('is-over'); });
        row.addEventListener('drop', function(e){
          e.preventDefault(); row.classList.remove('is-over');
          var from = parseInt(e.dataTransfer.getData('text/plain'), 10); var to = idx;
          if (!isNaN(from) && from !== to) { comp.snippetIds = arrayMove(comp.snippetIds, from, to); saveState(state); renderSelected(); updatePreview(); invalidateValidation(); }
        });

        frag.appendChild(row);
      });
      selList.innerHTML = '';
      selList.appendChild(frag);
    }

    function updatePreview(){
      var text = currentText();
      if (!previewEditor) {
        Core.editor.mount(taPrev, { mode:'text/x-scss', cmOptions:{ readOnly: true } }).then(function(api){
          previewEditor = api;
          if (previewEditor && previewEditor.setValue) previewEditor.setValue(text);
        });
      } else {
        previewEditor.setValue(text);
      }
    }

    function renderValidationOk(){
      valRow.className = 'rs-cmp-valrow is-ok';
      valRow.innerHTML = '<div class="rs-cmp-valrow__title">Validation passed</div><div class="rs-cmp-valrow__msg">No SCSS errors found.</div>';
    }
    function renderValidationErrors(errors, lineMap){
      var frag = document.createDocumentFragment();
      var title = el('div', { className:'rs-cmp-valrow__title', text:'Validation errors' });
      frag.appendChild(title);
      (errors||[]).forEach(function(err){
        var ln = (err && err.line) ? err.line : null;
        var snInfo = (ln!=null) ? (function(map, line){ for (var i=0;i<map.length;i++){ if (line>=map[i].start && (map[i].end==null || line<=map[i].end)) return map[i]; } return null; })(buildLineMap(textForMap), ln) : null;
        var item = el('div', { className:'rs-cmp-valrow__item' });
        var head = (snInfo ? (snInfo.title || snInfo.id) + ' — ' : '') + (ln!=null ? ('line ' + ln + ': ') : '');
        item.appendChild(el('div', { className:'rs-cmp-valrow__itemhead', text: head + ((err && (err.message || err.formatted)) || 'Error') }));
        if (ln!=null && previewEditor && previewEditor.highlightLine) {
          var jump = el('button', { className:'rs-btn', attrs:{ type:'button' }, text:'Reveal' });
          jump.onclick = function(){ previewEditor.clearHighlight(ln); previewEditor.highlightLine(ln); };
          item.appendChild(jump);
        }
        frag.appendChild(item);
      });
      valRow.className = 'rs-cmp-valrow is-error';
      valRow.innerHTML = '';
      valRow.appendChild(frag);
    }

    function buildLineMap(previewText){
      var lines = (previewText||'').split('\n');
      var map = [], current=null;
      for (var i=0;i<lines.length;i++){
        var L = lines[i];
        var mStart = L.match(/\/\*__RS_SNIPPET_START:([^:]+):(.*)\*\//);
        var mEnd   = L.match(/\/\*__RS_SNIPPET_END:([^*]+)\*\//);
        if (mStart) current = { start:i+2, end:null, id:mStart[1], title:mStart[2]||'' };
        else if (mEnd && current && mEnd[1]===current.id) { current.end=i; map.push(current); current=null; }
      }
      return map;
    }

    var textForMap = '';

    function runValidation(){
      var text = currentText();
      textForMap = text;
      var h = hashText(text);
      var lineMap = buildLineMap(text);

      btnValidate.disabled = true;
      validateScss(text).then(function(res){
        btnValidate.disabled = false;
        if (res.ok) {
          validationCache[comp.id] = { ok:true, hash:h, errors:[] };
          renderValidationOk();
          setSaveEnabled(true);
          toast('No SCSS errors found.','success');
        } else {
          validationCache[comp.id] = { ok:false, hash:h, errors:res.errors||[] };
          renderValidationErrors(res.errors||[], lineMap);
          setSaveEnabled(false);
          toast('Validation finished with errors.','error');
        }
      }).catch(function(){
        btnValidate.disabled = false;
        setSaveEnabled(false);
        toast('Validation failed. See console.','error');
      });
    }

    availSearch.oninput = function(e){ state.ui.searchSnippets = e.target.value || ''; saveState(state); renderAvailable(); };
    inTitle.oninput = function(){ invalidateValidation(); };

    btnValidate.onclick = runValidation;

    btnSave.onclick = function(){
      var cache = validationCache[comp.id];
      var text = currentText();
      var h = hashText(text);
      if (!cache || !cache.ok || cache.hash !== h) {
        toast('Please validate without errors before saving.','error');
        return;
      }
      var name = (inTitle.value || '').trim();
      if (!name) { toast('Title is required.','error'); return; }
      var idx = state.compilations.findIndex(function(c){return c.id===comp.id;});
      if (idx !== -1) {
        var newSlug = uniqueSlug(name, '.scss', comp.id);
        state.compilations[idx] = Object.assign({}, comp, { name:name, slug:newSlug });
        saveState(state);
        inSlug.value = outputBaseUrl() + newSlug;
        renderSidebar();
        toast('Compilation saved.','success');
      }
    };

    btnDup.onclick = function(){
      var id = uuid('cmp_');
      var baseName = comp.name || 'Compilation';
      var copy = Object.assign({}, comp, { id:id, name: baseName + ' (copy)', slug: uniqueSlug(baseName + ' copy', '.scss'), snippetIds: (comp.snippetIds||[]).slice() });
      state.compilations.push(copy);
      state.selectedCompilationId = id;
      saveState(state);
      renderSidebar(); renderDetail();
      toast('Compilation duplicated.','success');
    };

    btnDel.onclick = function(){
      if (!window.confirm('Delete this compilation? This action cannot be undone.')) return;
      state.compilations = state.comp