# 🏆 FantaCanis Manager

> **Il fantacalcio diventa una carriera.**

FantaCanis Manager è una Single Page Application (SPA) statica, gratuita e pubblicabile su GitHub Pages, pensata per gestire una **fantalega manageriale di lungo periodo** dove le squadre non vengono azzerate ogni anno ma evolvono attraverso contratti, rinnovi, valorizzazione giocatori e premi stagionali.

---

## ✨ Funzionalità MVP

| Modulo | Funzione |
|---|---|
| 📊 Dashboard | Panoramica lega, classifica squadre, albo d'oro |
| 🏟️ Scheda Squadra | Rosa dettagliata, budget, valore patrimonio, premi |
| 📄 Contratti | Visualizzazione tutti i contratti, filtri, calcolatore valori |
| ⭐ Premi | Bonus stagionali, assegnazioni, Rookie Draft |
| 📖 Regole | Manuale completo con tabelle interattive |
| 📥 Import/Export | Carica/scarica `lega.json` per aggiornare i dati |

### Logica di business implementata

- **Durata contratti per fascia età**: Under 23 → 4 anni · 23-29 → 3 anni · Over 30 → 2 anni
- **Valorizzazione automatica**: Anno 1 = prezzo acquisto · Anno 2 = +5 · Anno 3 = +10 · Anno 4 = +20
- **Rinnovi**: +1 anno = 5 cr · +2 anni = 10 cr · +3 anni = 15 cr
- **Penale svincolo**: 25% del valore attuale
- **Premi stagionali**: Miglior punteggio (+5) · Miglior attacco (+3) · Miglior difesa (+3) · Serie positiva (+5)
- **Rookie Draft**: Ordine inverso classifica, una scelta per squadra

---

## 🚀 Pubblicare su GitHub Pages (guida passo-passo)

### Prerequisiti
- Un account GitHub gratuito
- Git installato sul tuo PC (o puoi usare l'interfaccia web di GitHub)

### Passaggio 1 — Crea il repository

1. Vai su [github.com](https://github.com) e fai click su **New repository**
2. Scegli un nome es. `fantacanis-manager`
3. Imposta la visibilità su **Public**
4. Clicca **Create repository**

### Passaggio 2 — Carica i file

**Opzione A — Linea di comando:**
```bash
git clone https://github.com/TUO-USERNAME/fantacanis-manager.git
# copia tutti i file del progetto nella cartella clonata
cd fantacanis-manager
git add .
git commit -m "Initial commit: FantaCanis Manager"
git push origin main
```

**Opzione B — Interfaccia web:**
1. Nella pagina del repository, clicca **Add file → Upload files**
2. Trascina tutti i file del progetto
3. Clicca **Commit changes**

### Passaggio 3 — Abilita GitHub Pages

1. Vai su **Settings** → **Pages** nel tuo repository
2. In **Source** seleziona **GitHub Actions**
3. Il workflow `.github/workflows/deploy.yml` si occupa di tutto automaticamente

### Passaggio 4 — Accedi al sito

Dopo circa 1-2 minuti dal push, il sito sarà disponibile all'indirizzo:
```
https://TUO-USERNAME.github.io/fantacanis-manager/
```

Trovi l'URL esatto in **Settings → Pages**.

---

## 📁 Struttura del progetto

```
fantacanis-manager/
├── index.html              # Entry point SPA (tutto il layout)
├── src/
│   └── app.js              # Logica applicativa, routing, render
├── public/
│   └── data/
│       └── lega.json       # Dati della lega (editabile!)
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD → GitHub Pages
└── README.md
```

---

## ✏️ Configurare i dati della lega

Tutto ciò che serve è nel file `public/data/lega.json`. La struttura è intuitiva:

```json
{
  "lega": {
    "nome": "Il nome della tua lega",
    "stagione_corrente": "2024-25",
    "budget_iniziale": 250
  },
  "squadre": [
    {
      "id": "sq01",
      "nome": "Nome Squadra",
      "manager": "Nome Manager",
      "budget": 150,
      "posizione_classifica": 1,
      "premi_stagione": 2,
      "colore": "#1a56db"
    }
  ],
  "giocatori": [
    {
      "id": "p001",
      "nome": "M. Cognome",
      "ruolo": "A",           // P, D, C, A
      "squadra_id": "sq01",
      "eta": 25,
      "prezzo_acquisto": 30,
      "anno_contratto": 1,    // Anno corrente del contratto
      "durata_contratto": 3,  // Durata totale in anni
      "stagione_acquisto": "2024-25"
    }
  ]
}
```

### Aggiornare i dati senza toccare il codice

Hai due opzioni:

1. **Modifica il file JSON direttamente** su GitHub e il sito si aggiorna automaticamente con il deploy
2. **Usa il pulsante Import** nell'app per caricare un nuovo `lega.json` — i dati vengono salvati in `localStorage` e persistono tra le sessioni

---

## 🔒 Note sulla sicurezza

- L'app è completamente **client-side** — nessun backend, nessun dato sensibile
- I dati in `localStorage` rimangono **solo nel browser di chi apre l'app**
- Per dati condivisi tra tutti i manager, modifica `lega.json` nel repository e fai push
- Non inserire mai password o dati sensibili nel repository pubblico

---

## 🗺️ Roadmap

### v1.0 — MVP (attuale)
- [x] Dashboard lega e albo d'oro
- [x] Schede squadra con rosa dettagliata
- [x] Gestione contratti con calcolatore
- [x] Premi stagionali e Rookie Draft
- [x] Acquisto giocatori con calcolo automatico contratto
- [x] Rinnovi e svincoli con penale
- [x] Import/Export JSON
- [x] Mobile-first responsive design

### v2.0 — Statistiche avanzate
- [ ] Grafici andamento patrimonio stagione
- [ ] Ranking manager multi-stagione
- [ ] Notifiche scadenze contratto
- [ ] Asta live integrata

### v3.0 — Multi-lega e community
- [ ] Multi-lega con Supabase
- [ ] Profili pubblici manager
- [ ] Classifiche globali

---

## 🛠️ Stack tecnologico

| Tecnologia | Uso |
|---|---|
| HTML5 + Vanilla JS ES6+ | SPA, routing hash-based |
| Tailwind CSS (CDN) | Styling mobile-first |
| Bebas Neue + Inter + JetBrains Mono | Tipografia |
| localStorage | Persistenza dati locale |
| GitHub Actions | CI/CD deploy automatico |
| GitHub Pages | Hosting gratuito |

---

## 📄 Licenza

MIT — Usa, modifica e condividi liberamente.

---

*FantaCanis Manager — Costruisci il club. Gestisci il futuro.*
