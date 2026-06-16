# Portfolio Matteo Grassi

Portfolio interattivo con chat AI in tre lingue (IT/EN/ES).

## Avvio locale

```bash
# 1. Installa dipendenze
npm install

# 2. Crea il file .env
cp .env.example .env
# Modifica .env e inserisci la tua OPENAI_API_KEY

# 3. Avvia il server
npm start
# → http://localhost:3000
```

## Deploy su Railway

1. Vai su [railway.app](https://railway.app) e crea un nuovo progetto
2. Collega questo repository GitHub (o carica il codice)
3. Nelle impostazioni del progetto aggiungi la variabile:
   - `OPENAI_API_KEY` = la tua API key OpenAI
4. Railway avvierà automaticamente il server con `npm start`

## Struttura

```
portfolio/
├── public/
│   ├── index.html   ← il sito (IT/EN/ES, mobile-ready)
│   └── photo.png    ← la tua foto
├── server.js        ← server Express + API chat OpenAI
├── package.json
├── .env.example     ← template variabili ambiente
└── README.md
```
