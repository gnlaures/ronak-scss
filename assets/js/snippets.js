/* Ronak SCSS – Snippets page module
 * - Accordion with only non-empty categories
 * - Search, select, create/duplicate/delete (mock/localStorage)
 * - Code editor via Core.editor (WP or CDN CM5)
 * - Validation: blocks Save only when title/SCSS are empty
 */
(function () {
  'use strict';
  if (!document.body.classList.contains('is-ronak-scss-plugin')) return;
  var Core = (window.RonakSCSS && window.RonakSCSS.Core) || null;
  if (!Core) return;
  var qs = Core.dom.qs, el = Core.dom.el, toast = Core.toast.show, pageParam = Core.page.getPageParam();

  if (pageParam !== 'ronak-scss') return;

  var LS_KEY = 'ronak_scss_state_v1';
  var CATEGORIES = ['Uncategorized','Vars','Mixins','Presets','Components','Sections','Layouts','Utilities'];

  // State
  function loadState() { try { var raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveState(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s || state)); } catch (e) {} }
  function uuid(pfx){ return (pfx||'id_') + Math.random().toString(36).slice(2,7) + Date.now().toString(36).slice(-4); }

  var DEFAULT_SNIPPETS = [
    { id:'snp_vars_base', title:'Base Vars', category:'Vars', scss:'$color-primary: #2f81f7;\n$spacing-base: 1rem;', updatedAt: Date.now()-86400000 },
    { id:'snp_mixins_media', title:'Media Mixins', category:'Mixins', scss:'@mixin respond($break) {\n  @if $break == sm { @media (min-width: 640px) { @content; } }\n  @if $break == md { @media (min-width: 768px) { @content; } }\n}', updatedAt: Date.now()-720000 },
    { id:'snp_presets_typo', title:'Typography Presets', category:'Presets', scss:'h1 { font-size: 2rem; }\nh2 { font-size: 1.5rem; }', updatedAt: Date.now()-180000 },
    { id:'snp_component_button', title:'Button Component', category:'Components', scss:'.btn { padding: .625rem 1rem; border-radius: .5rem; }', updatedAt: Date.now()-30000 }
  ];
  var DEFAULT_COMPILATIONS = [
    { id:'cmp_base', name:'Base Styles', snippetIds:['snp_vars_base','snp_mixins_media','snp_presets_typo'] },
    { id:'cmp_theme', name:'Theme Styles', snippetIds:['snp_vars_base','snp_component_button'] }
  ];

  var state = (function(){
    var s = loadState();
    if (s && Array.isArray(s.snippets) && Array.isArray(s.compilations)) {
      s.selectedSnippetId = s.selectedSnippetId || null;
      s.ui = s.ui || { search:'', catOpen:[] };
      return s;
    }
    var init = { snippets: DEFAULT_SNIPPETS.slice(), compilations: DEFAULT_COMPILATIONS.slice(), selectedSnippetId: null, ui: { search:'', catOpen:[] } };
    saveState(init); return init;
  })();

  function getSelectedSnippet(){ if (!state.selectedSnippetId) return null; return state.snippets.find(function(s){return s.id===state.selectedSnippetId;})||null; }
  function computeUsages(id){ return state.compilations.filter(function(c){ return Array.isArray(c.snippetIds) && c.snippetIds.indexOf(id)!==-1; }); }
  function sortTitle(a,b){ return a.title.toLowerCase()<b.title.toLowerCase()?-1:1; }
  function anySnippets(){ return state.snippets && state.snippets.length>0; }

  // Render
  function render(){
    var acc = qs('#rs-snippets-accordion');
    var main = qs('#rs-snippet-detail');
    var input = qs('#rs-snippets-search');
    var btnNew = qs('#rs-new-snippet');
    if (!acc || !main) return;

    if (input) {
      input.value = state.ui.search || '';
      input.oninput = function(e){ state.ui.search = e.target.value || ''; saveState(); fillAccordion(acc); };
    }
    if (btnNew) {
      btnNew.onclick = function(){
        var id = uuid('snp_');
        var snp = { id:id, title:'Untitled Snippet', category:'Uncategorized', scss:'/* New SCSS */', updatedAt: Date.now() };
        state.snippets.push(snp); state.selectedSnippetId = id;
        if (state.ui.catOpen.indexOf(snp.category)===-1) state.ui.catOpen.push(snp.category);
        saveState(); fillAccordion(acc); fillDetail(main);
        toast('Snippet created.','success');
      };
    }

    fillAccordion(acc);
    fillDetail(main);
  }

  function filteredByCategory(cat){
    var term = (state.ui.search||'').toLowerCase().trim();
    return state.snippets.filter(function(s){ return s.category===cat && (!term || s.title.toLowerCase().indexOf(term)!==-1); });
  }

  function fillAccordion(container){
    if (!anySnippets()) {
      container.innerHTML = '<div class="rs-empty rs-empty--small"><div class="rs-muted">Click "New Snippet" to start.</div></div>';
      return;
    }
    var frag = document.createDocumentFragment();
    CATEGORIES.forEach(function(cat){
      var items = filteredByCategory(cat).sort(sortTitle);
      if (!items.length) return;

      var details = el('details', { className:'rs-accordion__group' });
      if ((state.ui.catOpen||[]).indexOf(cat)!==-1) details.setAttribute('open','open');
      details.addEventListener('toggle', function(){
        var list=state.ui.catOpen||[], idx=list.indexOf(cat);
        if (details.open && idx===-1) list.push(cat);
        if (!details.open && idx!==-1) list.splice(idx,1);
        state.ui.catOpen=list; saveState();
      });

      var summary = el('summary', { className:'rs-accordion__summary' });
      summary.appendChild(el('span', { className:'rs-accordion__title', text: cat }));
      summary.appendChild(el('span', { className:'rs-accordion__count', text: String(items.length) }));
      details.appendChild(summary);

      var ul = el('ul', { className:'rs-accordion__list' });
      items.forEach(function(snp){
        var li = el('li', { className:'rs-accordion__item' });
        var uses = computeUsages(snp.id).length;
        var btn = el('button', { className:'rs-snippet-link'+(state.selectedSnippetId===snp.id?' is-active':''), attrs:{ type:'button','data-id':snp.id } });
        btn.appendChild(el('span', { className:'rs-snippet-link__title', text: snp.title }));
        btn.appendChild(el('span', { className:'rs-badge', text: uses+' use'+(uses!==1?'s':'') }));
        btn.onclick = function(){ state.selectedSnippetId = snp.id; saveState(); fillAccordion(container); fillDetail(qs('#rs-snippet-detail')); };
        li.appendChild(btn); ul.appendChild(li);
      });
      details.appendChild(ul);
      frag.appendChild(details);
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  var editorApi = null;
  function fillDetail(container){
    container.innerHTML = '';

    if (!anySnippets()) {
      var none = el('div', { className:'rs-empty' });
      none.appendChild(el('h3',{ className:'rs-empty__title', text:'Click "New Snippet" to start.' }));
      container.appendChild(none);
      return;
    }
    if (!state.selectedSnippetId) {
      var msg = el('div', { className:'rs-empty' });
      msg.appendChild(el('p',{ text:'Choose a snippet on the left or create a new one.' }));
      container.appendChild(msg);
      return;
    }

    var snp = getSelectedSnippet(); if (!snp) return;

    var wrap = el('div', { className:'rs-editor' });

    var row = el('div', { className:'rs-form-row' });
    var titleCol = el('div', { className:'rs-field rs-field--grow' });
    titleCol.appendChild(el('label',{ className:'rs-label', attrs:{for:'rs-title'}, text:'Title' }));
    var inputTitle = el('input', { className:'rs-input', attrs:{ id:'rs-title', type:'text', value:snp.title } });
    titleCol.appendChild(inputTitle);

    var catCol = el('div', { className:'rs-field' });
    catCol.appendChild(el('label',{ className:'rs-label', attrs:{for:'rs-category'}, text:'Category' }));
    var sel = el('select', { className:'rs-select', attrs:{ id:'rs-category' } });
    CATEGORIES.forEach(function(c){ var opt=el('option',{ text:c }); if (c===snp.category) opt.setAttribute('selected','selected'); sel.appendChild(opt); });
    catCol.appendChild(sel);

    var actions = el('div', { className:'rs-actions' });
    var btnSave = el('button', { className:'rs-btn rs-btn--primary', attrs:{type:'button'}, text:'Save' });
    var btnDup  = el('button', { className:'rs-btn rs-btn--ghost', attrs:{type:'button'}, text:'Duplicate' });
    var btnDel  = el('button', { className:'rs-btn rs-btn--danger', attrs:{type:'button'}, text:'Remove' });
    actions.appendChild(btnSave); actions.appendChild(btnDup); actions.appendChild(btnDel);

    row.appendChild(titleCol); row.appendChild(catCol); row.appendChild(actions);
    wrap.appendChild(row);

    var codeField = el('div', { className:'rs-field' });
    codeField.appendChild(el('label',{ className:'rs-label', attrs:{for:'rs-scss'}, text:'SCSS Code' }));
    var textarea = el('textarea', { className:'rs-code', attrs:{ id:'rs-scss', spellcheck:'false' }, text:snp.scss });
    codeField.appendChild(textarea);
    wrap.appendChild(codeField);

    var usages = computeUsages(snp.id);
    var usage = el('div', { className:'rs-usage' });
    usage.appendChild(el('div',{ className:'rs-usage__title', text:'Usages ('+usages.length+')' }));
    if (usages.length) {
      var ul = el('ul', { className:'rs-usage__list' });
      usages.forEach(function(u){ var li=el('li'); var a=el('a',{ className:'rs-link', attrs:{ href: Core.page.makeAdminUrl('ronak-scss-compilations') }, text:u.name }); li.appendChild(a); ul.appendChild(li); });
      usage.appendChild(ul);
    } else {
      usage.appendChild(el('div',{ className:'rs-muted', text:'Not used in any compilation.' }));
    }
    wrap.appendChild(usage);

    container.appendChild(wrap);

    // Mount editor
    if (editorApi && editorApi.dispose) editorApi.dispose();
    Core.editor.mount(textarea, { mode: 'text/x-scss' }).then(function(api){ editorApi = api; });

    // Actions
    btnSave.onclick = function(){
      var updated = {
        id: snp.id,
        title: inputTitle.value || '',
        category: sel.value || 'Uncategorized',
        scss: editorApi && editorApi.getValue ? editorApi.getValue() : (textarea.value || ''),
        updatedAt: snp.updatedAt || Date.now()
      };

      if (!updated.title.trim()) { toast('Title is required.','error'); console.error('[Ronak SCSS] Save blocked: empty title'); return; }
      if (!updated.scss || !updated.scss.trim()) { toast('SCSS cannot be empty.','error'); console.error('[Ronak SCSS] Save blocked: empty SCSS'); if (editorApi && editorApi.highlightLine) editorApi.highlightLine(1); return; }
      if (CATEGORIES.indexOf(updated.category)===-1) { toast('Invalid category.','error'); console.error('[Ronak SCSS] Save blocked: invalid category', updated.category); return; }

      if (editorApi && editorApi.clearHighlight) editorApi.clearHighlight(1);
      var idx = state.snippets.findIndex(function(s){return s.id===snp.id;});
      if (idx !== -1) {
        updated.updatedAt = Date.now();
        state.snippets[idx] = updated;
        if (state.ui.catOpen.indexOf(updated.category)===-1) state.ui.catOpen.push(updated.category);
        saveState();
        fillAccordion(qs('#rs-snippets-accordion'));
        toast('Snippet saved.','success');
        console.log('[Ronak SCSS] Snippet saved', { id: updated.id, title: updated.title });
      }
    };

    btnDup.onclick = function(){
      var copy = Object.assign({}, snp, { id: uuid('snp_'), title: snp.title+' (copy)', updatedAt: Date.now() });
      state.snippets.push(copy); state.selectedSnippetId = copy.id;
      if (state.ui.catOpen.indexOf(copy.category)===-1) state.ui.catOpen.push(copy.category);
      saveState(); fillAccordion(qs('#rs-snippets-accordion')); fillDetail(container);
      toast('Snippet duplicated.','success');
      console.log('[Ronak SCSS] Snippet duplicated', { from: snp.id, to: copy.id });
    };

    btnDel.onclick = function(){
      if (!window.confirm('Delete this snippet? This action cannot be undone.')) return;
      state.snippets = state.snippets.filter(function(s){ return s.id !== snp.id; });
      state.compilations = state.compilations.map(function(c){ return Object.assign({}, c, { snippetIds: (c.snippetIds||[]).filter(function(id){return id!==snp.id;}) }); });
      state.selectedSnippetId = null;
      saveState(); fillAccordion(qs('#rs-snippets-accordion')); fillDetail(container);
      toast('Snippet removed.','success');
      console.log('[Ronak SCSS] Snippet removed', { id: snp.id });
    };
  }

  function boot(){ render(); }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();