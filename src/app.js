/**
 * FantaCanis Manager — Main Application
 * Vanilla JS SPA with hash routing
 */

// ═══════════════════════════════════════
// STATE & DATA
// ═══════════════════════════════════════

let state = {
  data: null,
  currentPage: 'dashboard',
  currentSquadraId: null,
  contrattiFilter: 'tutti',
};

const RUOLO_LABEL = { P: '🧤', D: '🛡️', C: '⚙️', A: '⚡' };
const RUOLO_NAME  = { P: 'Portiere', D: 'Difensore', C: 'Centrocampista', A: 'Attaccante' };

// ═══════════════════════════════════════
// BUSINESS LOGIC
// ═══════════════════════════════════════

function getDurataMaxContratto(eta) {
  if (eta < 23) return 4;
  if (eta <= 29) return 3;
  return 2;
}

function getValoreAttuale(prezzoAcquisto, annoContratto) {
  const incrementi = { 1: 0, 2: 5, 3: 10, 4: 20 };
  return prezzoAcquisto + (incrementi[annoContratto] || 0);
}

function getCostoRinnovo(anniAggiuntivi) {
  return anniAggiuntivi * 5;
}

function getPenaleSvincolo(valoreAttuale) {
  return Math.ceil(valoreAttuale * 0.25);
}

function getAnniRimanenti(g) {
  return g.durata_contratto - g.anno_contratto + 1;
}

function isInScadenza(g) {
  return getAnniRimanenti(g) <= 1;
}

function isGiovane(g) {
  return g.eta < 23;
}

function getValoreRosa(squadraId) {
  return state.data.giocatori
    .filter(g => g.squadra_id === squadraId)
    .reduce((sum, g) => sum + getValoreAttuale(g.prezzo_acquisto, g.anno_contratto), 0);
}

function getSquadraById(id) {
  return state.data.squadre.find(s => s.id === id);
}

function getGiocatoriBySquadra(squadraId) {
  return state.data.giocatori.filter(g => g.squadra_id === squadraId);
}

function getPremiBySquadra(squadraId) {
  const result = [];
  state.data.premi_stagionali.forEach(premio => {
    premio.assegnazioni.forEach(a => {
      if (a.squadra_id === squadraId) {
        result.push({ ...premio, mese: a.mese });
      }
    });
  });
  return result;
}

function getTotalePremiCrediti(squadraId) {
  return getPremiBySquadra(squadraId).reduce((sum, p) => sum + p.bonus_crediti, 0);
}

// ═══════════════════════════════════════
// DATA LOADING & PERSISTENCE
// ═══════════════════════════════════════

async function loadData() {
  // Try localStorage first (user-modified data)
  const saved = localStorage.getItem('fantacanis_data');
  if (saved) {
    try {
      state.data = JSON.parse(saved);
      return;
    } catch(e) {
      console.warn('Dati localStorage corrotti, carico dal file di default.');
    }
  }
  // Fallback: fetch from /data/lega.json
  try {
    const res = await fetch('data/lega.json');
    if (!res.ok) throw new Error('Fetch failed');
    state.data = await res.json();
  } catch(e) {
    // Inline minimal fallback so app still works offline
    console.warn('Impossibile caricare lega.json, uso dati minimali.');
    state.data = {
      lega: { nome: 'FantaCanis', stagione_corrente: '2024-25', budget_iniziale: 250, crediti_bonus_compensazione: 20 },
      squadre: [],
      giocatori: [],
      premi_stagionali: [],
      rookie_draft: { stagione: '2024-25', stato: 'non_avviato', scelte: [] },
      storico_stagioni: []
    };
  }
}

function saveData() {
  localStorage.setItem('fantacanis_data', JSON.stringify(state.data));
}

// ═══════════════════════════════════════
// ROUTING
// ═══════════════════════════════════════

function navTo(page, squadraId = null) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target
  const el = document.getElementById('page-' + page);
  if (!el) return;
  el.classList.add('active');

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.page === page;
    btn.classList.toggle('text-green-400', isActive);
    btn.classList.toggle('text-green-700', !isActive);
  });

  state.currentPage = page;

  if (page === 'squadra' && squadraId) {
    state.currentSquadraId = squadraId;
    renderSquadraPage(squadraId);
  }

  // Update hash
  const hash = page === 'squadra' ? `#/squadra/${squadraId}` : `#/${page}`;
  window.history.replaceState(null, '', hash);

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleHashChange() {
  const hash = window.location.hash;
  if (!hash || hash === '#/dashboard' || hash === '#/') return navTo('dashboard');
  if (hash === '#/contratti') return navTo('contratti');
  if (hash === '#/premi') return navTo('premi');
  if (hash === '#/regole') return navTo('regole');
  const squadraMatch = hash.match(/^#\/squadra\/(.+)$/);
  if (squadraMatch) return navTo('squadra', squadraMatch[1]);
  navTo('dashboard');
}

// ═══════════════════════════════════════
// RENDER — DASHBOARD
// ═══════════════════════════════════════

function renderDashboard() {
  const { lega, squadre, storico_stagioni } = state.data;

  // Header stagione badge
  document.getElementById('header-stagione').textContent = lega.stagione_corrente;

  // Lega banner
  document.getElementById('lega-banner').innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-green-400/60 uppercase tracking-wider">Lega</p>
        <p class="font-display text-2xl text-chalk mt-0.5">${lega.nome}</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-green-400/60 uppercase tracking-wider">Stagione</p>
        <p class="font-mono text-lg text-turf">${lega.stagione_corrente}</p>
      </div>
    </div>
  `;

  // Stats row
  const totGiocatori = state.data.giocatori.length;
  const totContratti = state.data.giocatori.filter(g => !isInScadenza(g)).length;
  const inScadenza = state.data.giocatori.filter(isInScadenza).length;
  document.getElementById('stats-row').innerHTML = `
    <div class="col-span-1 rounded-xl bg-pitch-800/60 border border-green-900/30 p-3">
      <p class="text-xs text-green-400/60">Squadre</p>
      <p class="font-display text-3xl text-chalk mt-1">${squadre.length}</p>
    </div>
    <div class="col-span-1 rounded-xl bg-pitch-800/60 border border-green-900/30 p-3">
      <p class="text-xs text-green-400/60">Giocatori</p>
      <p class="font-display text-3xl text-chalk mt-1">${totGiocatori}</p>
    </div>
    <div class="col-span-1 rounded-xl bg-pitch-800/60 border border-amber-900/30 p-3">
      <p class="text-xs text-amber-400/60">In scadenza</p>
      <p class="font-display text-3xl text-amber-400 mt-1">${inScadenza}</p>
    </div>
    <div class="col-span-1 rounded-xl bg-pitch-800/60 border border-green-900/30 p-3">
      <p class="text-xs text-green-400/60">Budget medio</p>
      <p class="font-display text-3xl text-chalk mt-1">${Math.round(squadre.reduce((s,q)=>s+q.budget,0)/Math.max(1,squadre.length))}</p>
    </div>
  `;

  // Squadre list
  const sorted = [...squadre].sort((a, b) => a.posizione_classifica - b.posizione_classifica);
  document.getElementById('squadre-list').innerHTML = sorted.map(sq => {
    const valore = getValoreRosa(sq.id);
    const giocatori = getGiocatoriBySquadra(sq.id);
    const scadenze = giocatori.filter(isInScadenza).length;
    return `
    <div onclick="navTo('squadra','${sq.id}')" class="rounded-xl bg-pitch-800/60 border border-green-900/30 p-4 flex items-center gap-4 cursor-pointer card-hover transition">
      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display text-xl" style="background:${sq.colore}22;border:2px solid ${sq.colore}55;color:${sq.colore}">
        ${sq.posizione_classifica}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-chalk truncate">${sq.nome}</p>
        <p class="text-xs text-green-400/60">${sq.manager}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="font-mono text-sm text-turf">${sq.budget} <span class="text-green-400/50 text-xs">cr</span></p>
        <p class="text-xs text-chalk/40">Rosa: ${valore} cr</p>
        ${scadenze > 0 ? `<span class="badge badge-amber text-[10px] mt-1">${scadenze} scad.</span>` : ''}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </div>`;
  }).join('');

  // Albo d'oro
  const storico = [...storico_stagioni].reverse();
  document.getElementById('albo-oro').innerHTML = storico.length > 0
    ? storico.map(s => {
        const sq = getSquadraById(s.vincitore_id);
        return `<tr class="tbl-row">
          <td class="py-3 px-4 font-mono text-chalk/70">${s.stagione}</td>
          <td class="py-3 px-4">
            <span class="text-amber-400">🏆</span>
            <span class="text-chalk font-medium ml-1">${sq ? sq.nome : 'N/A'}</span>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="2" class="py-6 text-center text-chalk/30 text-sm">Nessuna stagione completata</td></tr>';
}

// ═══════════════════════════════════════
// RENDER — SQUADRA DETAIL
// ═══════════════════════════════════════

function renderSquadraPage(squadraId) {
  const sq = getSquadraById(squadraId);
  if (!sq) return;

  const giocatori = getGiocatoriBySquadra(squadraId);
  const valore = getValoreRosa(squadraId);
  const premi = getPremiBySquadra(squadraId);
  const totPremiCrediti = getTotalePremiCrediti(squadraId);
  const scadenze = giocatori.filter(isInScadenza).length;
  const giovani = giocatori.filter(isGiovane).length;

  document.getElementById('squadra-nome').textContent = sq.nome;
  document.getElementById('squadra-manager').textContent = `Manager: ${sq.manager}`;

  document.getElementById('squadra-stats').innerHTML = `
    <div class="rounded-xl bg-pitch-800/60 border border-green-900/30 p-3 text-center">
      <p class="text-[10px] text-green-400/60 uppercase">Budget</p>
      <p class="font-mono text-xl text-turf font-bold">${sq.budget}</p>
      <p class="text-[10px] text-green-400/40">crediti</p>
    </div>
    <div class="rounded-xl bg-pitch-800/60 border border-green-900/30 p-3 text-center">
      <p class="text-[10px] text-green-400/60 uppercase">Valore Rosa</p>
      <p class="font-mono text-xl text-chalk font-bold">${valore}</p>
      <p class="text-[10px] text-green-400/40">crediti</p>
    </div>
    <div class="rounded-xl bg-pitch-800/60 border border-amber-900/30 p-3 text-center">
      <p class="text-[10px] text-amber-400/60 uppercase">Pos.</p>
      <p class="font-display text-2xl text-amber-400">${sq.posizione_classifica}°</p>
    </div>
    <div class="rounded-xl bg-pitch-800/60 border border-green-900/30 p-3 text-center">
      <p class="text-[10px] text-green-400/60 uppercase">Premi</p>
      <p class="font-mono text-xl text-chalk font-bold">${premi.length}</p>
      <p class="text-[10px] text-green-400/40">+${totPremiCrediti} cr</p>
    </div>
    <div class="rounded-xl bg-pitch-800/60 border border-green-900/30 p-3 text-center">
      <p class="text-[10px] text-green-400/60 uppercase">Giovani</p>
      <p class="font-mono text-xl text-chalk font-bold">${giovani}</p>
    </div>
    <div class="rounded-xl bg-pitch-800/60 border border-amber-900/30 p-3 text-center">
      <p class="text-[10px] text-amber-400/60 uppercase">Scad.</p>
      <p class="font-mono text-xl text-amber-400 font-bold">${scadenze}</p>
    </div>
  `;

  // Rosa grouped by ruolo
  const ruoliOrder = ['P', 'D', 'C', 'A'];
  let rosaHTML = '';
  ruoliOrder.forEach(ruolo => {
    const gg = giocatori.filter(g => g.ruolo === ruolo);
    if (gg.length === 0) return;
    rosaHTML += `<p class="text-xs text-green-400/50 uppercase tracking-widest mt-3 mb-1 pl-1">${RUOLO_NAME[ruolo]}</p>`;
    gg.forEach(g => {
      const val = getValoreAttuale(g.prezzo_acquisto, g.anno_contratto);
      const ann = getAnniRimanenti(g);
      const scad = isInScadenza(g);
      const giovane = isGiovane(g);
      rosaHTML += `
      <div onclick="showGiocatoreModal('${g.id}')" class="flex items-center gap-3 rounded-lg bg-pitch-800/40 border ${scad ? 'border-amber-900/40' : 'border-green-900/20'} px-3 py-2.5 cursor-pointer hover:bg-pitch-800/70 transition">
        <span class="text-lg">${RUOLO_LABEL[g.ruolo]}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-chalk truncate">${g.nome} ${giovane ? '<span class="badge badge-blue text-[9px] ml-1">U23</span>':''}</p>
          <p class="text-xs text-green-400/50">${g.eta} anni · Acq. ${g.prezzo_acquisto} cr</p>
        </div>
        <div class="text-right">
          <p class="font-mono text-sm text-turf">${val} <span class="text-green-400/40 text-[10px]">cr</span></p>
          <p class="text-[10px] ${scad ? 'text-amber-400' : 'text-chalk/30'}">${g.anno_contratto}/${g.durata_contratto} anni</p>
        </div>
      </div>`;
    });
  });

  if (giocatori.length === 0) {
    rosaHTML = `<div class="text-center py-8 text-chalk/30 text-sm">Nessun giocatore in rosa.<br>Usa il tasto Acquista per aggiungerne uno.</div>`;
  }

  document.getElementById('rosa-list').innerHTML = rosaHTML;

  // Premi
  const premiEl = document.getElementById('premi-squadra');
  if (premi.length === 0) {
    premiEl.innerHTML = `<p class="text-sm text-chalk/30">Nessun premio assegnato questa stagione.</p>`;
  } else {
    premiEl.innerHTML = premi.map(p => `
      <div class="flex items-center justify-between rounded-lg bg-amber-950/30 border border-amber-900/30 px-3 py-2">
        <div>
          <p class="text-sm text-chalk">⭐ ${p.tipo}</p>
          <p class="text-xs text-amber-400/60">${p.mese}</p>
        </div>
        <span class="font-mono text-amber-400 text-sm">+${p.bonus_crediti} cr</span>
      </div>
    `).join('');
  }
}

// ═══════════════════════════════════════
// RENDER — CONTRATTI
// ═══════════════════════════════════════

function renderContratti() {
  let giocatori = [...state.data.giocatori];

  if (state.contrattiFilter === 'scadenza') {
    giocatori = giocatori.filter(isInScadenza);
  } else if (state.contrattiFilter === 'giovani') {
    giocatori = giocatori.filter(isGiovane);
  }

  // Sort: scadenza first, then by valore desc
  giocatori.sort((a, b) => {
    const aScad = isInScadenza(a) ? 0 : 1;
    const bScad = isInScadenza(b) ? 0 : 1;
    if (aScad !== bScad) return aScad - bScad;
    return getValoreAttuale(b.prezzo_acquisto, b.anno_contratto) - getValoreAttuale(a.prezzo_acquisto, a.anno_contratto);
  });

  const container = document.getElementById('contratti-list');
  if (giocatori.length === 0) {
    container.innerHTML = `<p class="text-center text-chalk/30 py-8 text-sm">Nessun giocatore corrisponde al filtro.</p>`;
    return;
  }

  container.innerHTML = giocatori.map(g => {
    const sq = getSquadraById(g.squadra_id);
    const val = getValoreAttuale(g.prezzo_acquisto, g.anno_contratto);
    const ann = getAnniRimanenti(g);
    const scad = isInScadenza(g);
    const pct = Math.round((g.anno_contratto / g.durata_contratto) * 100);
    return `
    <div onclick="showGiocatoreModal('${g.id}')" class="rounded-xl bg-pitch-800/60 border ${scad ? 'border-amber-900/40' : 'border-green-900/30'} p-4 cursor-pointer card-hover transition">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-xl">${RUOLO_LABEL[g.ruolo]}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-chalk text-sm">${g.nome}</p>
            ${isGiovane(g) ? '<span class="badge badge-blue text-[9px]">U23</span>' : ''}
            ${scad ? '<span class="badge badge-amber text-[9px]">⚠ Scadenza</span>' : ''}
          </div>
          <p class="text-xs text-green-400/50">${sq ? sq.nome : ''}</p>
        </div>
        <div class="text-right">
          <p class="font-mono text-sm text-turf">${val} cr</p>
          <p class="text-xs text-chalk/40">${g.eta} anni</p>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="flex justify-between mt-1">
        <p class="text-[10px] text-green-400/50">Anno ${g.anno_contratto} di ${g.durata_contratto}</p>
        <p class="text-[10px] ${scad ? 'text-amber-400' : 'text-chalk/30'}">${ann === 1 ? 'Ultimo anno' : ann + ' anni rimasti'}</p>
      </div>
    </div>`;
  }).join('');
}

function filterContratti(filter) {
  state.contrattiFilter = filter;
  document.querySelectorAll('.contratti-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  // Mark active by text content match — we'll use data attribute
  renderContratti();
}

// ═══════════════════════════════════════
// RENDER — PREMI
// ═══════════════════════════════════════

function renderPremi() {
  const { premi_stagionali, rookie_draft } = state.data;

  // Premi table
  document.getElementById('premi-table').innerHTML = premi_stagionali.map(p => `
    <tr class="tbl-row">
      <td class="py-3 px-4 text-chalk">${p.tipo}</td>
      <td class="py-3 px-4 text-right">
        <span class="font-mono text-amber-400">+${p.bonus_crediti}</span>
        <span class="text-chalk/40 text-xs"> cr</span>
      </td>
    </tr>
  `).join('');

  // Assegnazioni flat list
  const assegnazioni = [];
  premi_stagionali.forEach(p => {
    p.assegnazioni.forEach(a => {
      const sq = getSquadraById(a.squadra_id);
      if (sq) assegnazioni.push({ premio: p.tipo, squadra: sq.nome, mese: a.mese, bonus: p.bonus_crediti });
    });
  });

  const assEl = document.getElementById('assegnazioni-list');
  if (assegnazioni.length === 0) {
    assEl.innerHTML = `<p class="text-sm text-chalk/30">Nessuna assegnazione registrata.</p>`;
  } else {
    assEl.innerHTML = assegnazioni.map(a => `
      <div class="flex items-center justify-between rounded-lg bg-pitch-800/40 border border-green-900/20 px-3 py-2.5">
        <div>
          <p class="text-sm text-chalk">⭐ ${a.premio}</p>
          <p class="text-xs text-green-400/50">${a.squadra} · ${a.mese}</p>
        </div>
        <span class="font-mono text-amber-400 text-sm">+${a.bonus} cr</span>
      </div>
    `).join('');
  }

  // Draft table
  const draftEl = document.getElementById('draft-table');
  if (!rookie_draft || rookie_draft.scelte.length === 0) {
    draftEl.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-chalk/30 text-sm">Draft non ancora effettuato</td></tr>`;
  } else {
    draftEl.innerHTML = rookie_draft.scelte.map(s => {
      const sq = getSquadraById(s.squadra_id);
      return `<tr class="tbl-row">
        <td class="py-3 px-4 font-mono text-green-400">${s.ordine}</td>
        <td class="py-3 px-4 text-chalk">${sq ? sq.nome : 'N/A'}</td>
        <td class="py-3 px-4 text-chalk/70">${s.giocatore} <span class="text-xs text-green-400/40">(${s.eta} anni)</span></td>
      </tr>`;
    }).join('');
  }
}

// ═══════════════════════════════════════
// MODALS
// ═══════════════════════════════════════

function showGiocatoreModal(giocatoreId) {
  const g = state.data.giocatori.find(x => x.id === giocatoreId);
  if (!g) return;

  const sq = getSquadraById(g.squadra_id);
  const val = getValoreAttuale(g.prezzo_acquisto, g.anno_contratto);
  const penale = getPenaleSvincolo(val);
  const ann = getAnniRimanenti(g);
  const scad = isInScadenza(g);

  document.getElementById('g-modal-nome').textContent = `${RUOLO_LABEL[g.ruolo]} ${g.nome}`;

  document.getElementById('g-modal-content').innerHTML = `
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div class="bg-pitch-900/60 rounded-lg p-2">
        <p class="text-xs text-green-400/50">Squadra</p>
        <p class="text-chalk font-medium">${sq ? sq.nome : 'N/A'}</p>
      </div>
      <div class="bg-pitch-900/60 rounded-lg p-2">
        <p class="text-xs text-green-400/50">Età</p>
        <p class="text-chalk font-medium">${g.eta} anni ${isGiovane(g) ? '<span class="badge badge-blue text-[9px] ml-1">U23</span>' : ''}</p>
      </div>
      <div class="bg-pitch-900/60 rounded-lg p-2">
        <p class="text-xs text-green-400/50">Prezzo acquisto</p>
        <p class="font-mono text-chalk">${g.prezzo_acquisto} cr</p>
      </div>
      <div class="bg-pitch-900/60 rounded-lg p-2">
        <p class="text-xs text-green-400/50">Valore attuale</p>
        <p class="font-mono text-turf font-bold">${val} cr</p>
      </div>
      <div class="bg-pitch-900/60 rounded-lg p-2 col-span-2">
        <p class="text-xs text-green-400/50 mb-1">Contratto: Anno ${g.anno_contratto} / ${g.durata_contratto}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((g.anno_contratto/g.durata_contratto)*100)}%"></div></div>
        <p class="text-xs mt-1 ${scad ? 'text-amber-400' : 'text-chalk/40'}">${ann === 1 ? '⚠ Ultimo anno di contratto' : ann + ' anni rimasti'}</p>
      </div>
    </div>
    <div class="rounded-lg border border-green-900/30 bg-pitch-900/40 p-3 text-sm">
      <p class="text-xs text-green-400/50 mb-2">Opzioni rinnovo</p>
      <div class="space-y-1">
        ${[1,2,3].map(n => `<div class="flex justify-between"><span class="text-chalk/70">+${n} anno${n>1?'i':''}</span><span class="font-mono text-amber-400">${getCostoRinnovo(n)} cr</span></div>`).join('')}
      </div>
    </div>
    <div class="flex items-center justify-between rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-sm">
      <span class="text-chalk/70">Penale svincolo</span>
      <span class="font-mono text-red-400 font-bold">${penale} cr</span>
    </div>
  `;

  document.getElementById('g-modal-actions').innerHTML = `
    <button onclick="rinnovaGiocatore('${g.id}', 1)" class="w-full border border-amber-700 text-amber-400 hover:bg-amber-900/20 font-semibold py-2 rounded-lg text-sm transition">
      Rinnova +1 anno (${getCostoRinnovo(1)} cr)
    </button>
    <button onclick="svincola('${g.id}')" class="w-full border border-red-900/50 text-red-400 hover:bg-red-900/20 font-semibold py-2 rounded-lg text-sm transition">
      Svincola (penale ${penale} cr)
    </button>
  `;

  document.getElementById('giocatore-modal').classList.remove('hidden');
}

function rinnovaGiocatore(gId, anni) {
  const g = state.data.giocatori.find(x => x.id === gId);
  const sq = getSquadraById(g.squadra_id);
  const costo = getCostoRinnovo(anni);

  if (sq.budget < costo) {
    showToast(`❌ Budget insufficiente (servono ${costo} cr)`);
    return;
  }

  // Estendi contratto
  g.durata_contratto += anni;
  sq.budget -= costo;

  saveData();
  closeModal('giocatore-modal');
  showToast(`✅ Rinnovo +${anni} anno confermato! (–${costo} cr)`);

  // Re-render current page
  if (state.currentPage === 'squadra') renderSquadraPage(state.currentSquadraId);
  if (state.currentPage === 'contratti') renderContratti();
}

function svincola(gId) {
  const gIdx = state.data.giocatori.findIndex(x => x.id === gId);
  const g = state.data.giocatori[gIdx];
  const sq = getSquadraById(g.squadra_id);
  const val = getValoreAttuale(g.prezzo_acquisto, g.anno_contratto);
  const penale = getPenaleSvincolo(val);

  if (!confirm(`Sei sicuro di voler svincolare ${g.nome}? Penale: ${penale} crediti.`)) return;

  if (sq.budget < penale) {
    showToast(`❌ Budget insufficiente (penale ${penale} cr)`);
    return;
  }

  sq.budget -= penale;
  state.data.giocatori.splice(gIdx, 1);

  saveData();
  closeModal('giocatore-modal');
  showToast(`🔓 ${g.nome} svincolato (–${penale} cr)`);

  if (state.currentPage === 'squadra') renderSquadraPage(state.currentSquadraId);
  if (state.currentPage === 'contratti') renderContratti();
  if (state.currentPage === 'dashboard') renderDashboard();
}

function showAddGiocatoreModal() {
  document.getElementById('ag-nome').value = '';
  document.getElementById('ag-eta').value = '';
  document.getElementById('ag-prezzo').value = '';
  document.getElementById('ag-contratto-preview').classList.add('hidden');
  document.getElementById('add-giocatore-modal').classList.remove('hidden');

  // Live preview contratto
  const updatePreview = () => {
    const eta = parseInt(document.getElementById('ag-eta').value);
    const prezzo = parseInt(document.getElementById('ag-prezzo').value);
    if (!eta || !prezzo) return;
    const durata = getDurataMaxContratto(eta);
    const prev = document.getElementById('ag-contratto-preview');
    prev.classList.remove('hidden');
    prev.innerHTML = `
      <p class="text-green-400/70 text-xs mb-1">Anteprima contratto</p>
      <div class="flex justify-between text-sm">
        <span class="text-chalk/70">Durata max</span>
        <span class="font-mono text-turf">${durata} anni</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-chalk/70">Valore anno 2</span>
        <span class="font-mono text-chalk/70">${prezzo + 5} cr</span>
      </div>
    `;
  };

  document.getElementById('ag-eta').addEventListener('input', updatePreview);
  document.getElementById('ag-prezzo').addEventListener('input', updatePreview);
}

function aggiungiGiocatore() {
  const nome = document.getElementById('ag-nome').value.trim();
  const ruolo = document.getElementById('ag-ruolo').value;
  const eta = parseInt(document.getElementById('ag-eta').value);
  const prezzo = parseInt(document.getElementById('ag-prezzo').value);

  if (!nome || !eta || !prezzo) {
    showToast('⚠ Compila tutti i campi');
    return;
  }

  const sq = getSquadraById(state.currentSquadraId);
  if (!sq) return;

  if (sq.budget < prezzo) {
    showToast(`❌ Budget insufficiente (${sq.budget} cr disponibili)`);
    return;
  }

  const durata = getDurataMaxContratto(eta);
  const newId = 'p' + Date.now().toString().slice(-6);

  state.data.giocatori.push({
    id: newId,
    nome,
    ruolo,
    squadra_id: state.currentSquadraId,
    eta,
    prezzo_acquisto: prezzo,
    anno_contratto: 1,
    durata_contratto: durata,
    stagione_acquisto: state.data.lega.stagione_corrente
  });

  sq.budget -= prezzo;
  saveData();
  closeModal('add-giocatore-modal');
  showToast(`✅ ${nome} acquistato! (–${prezzo} cr)`);
  renderSquadraPage(state.currentSquadraId);
}

function showImportModal() {
  document.getElementById('import-modal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ═══════════════════════════════════════
// CALCOLATORE CONTRATTI
// ═══════════════════════════════════════

function calcolaValore() {
  const prezzo = parseInt(document.getElementById('calc-prezzo').value);
  const anno = parseInt(document.getElementById('calc-anno').value);

  if (!prezzo || prezzo < 1) {
    showToast('⚠ Inserisci un prezzo valido');
    return;
  }

  const val = getValoreAttuale(prezzo, anno);
  const penale = getPenaleSvincolo(val);

  const res = document.getElementById('calc-result');
  res.classList.remove('hidden');
  res.innerHTML = `
    <div class="space-y-1.5">
      <div class="flex justify-between">
        <span class="text-chalk/60">Prezzo acquisto</span>
        <span class="font-mono text-chalk">${prezzo} cr</span>
      </div>
      <div class="flex justify-between">
        <span class="text-chalk/60">Incremento anno ${anno}</span>
        <span class="font-mono text-green-400">+${val - prezzo} cr</span>
      </div>
      <div class="border-t border-green-900/40 pt-1.5 flex justify-between">
        <span class="text-chalk font-medium">Valore attuale</span>
        <span class="font-mono text-turf font-bold text-base">${val} cr</span>
      </div>
      <div class="flex justify-between">
        <span class="text-chalk/60">Penale svincolo (25%)</span>
        <span class="font-mono text-red-400">${penale} cr</span>
      </div>
      <div class="flex justify-between">
        <span class="text-chalk/60">Rinnovo +1 anno</span>
        <span class="font-mono text-amber-400">${getCostoRinnovo(1)} cr</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════
// IMPORT / EXPORT JSON
// ═══════════════════════════════════════

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.lega || !data.squadre || !data.giocatori) {
        showToast('❌ Formato JSON non valido');
        return;
      }
      state.data = data;
      saveData();
      closeModal('import-modal');
      renderAll();
      showToast('✅ Dati importati con successo!');
    } catch(err) {
      showToast('❌ Errore nel parsing del file JSON');
    }
  };
  reader.readAsText(file);
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fantacanis_${state.data.lega.stagione_corrente.replace('-','_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Export avviato!');
}

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════

function renderAll() {
  renderDashboard();
  renderContratti();
  renderPremi();
  // Regole is pure static HTML
}

// ═══════════════════════════════════════
// CLOSE MODAL ON OVERLAY CLICK
// ═══════════════════════════════════════

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════

(async () => {
  await loadData();
  renderAll();
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
})();
