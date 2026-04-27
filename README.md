# POKYH

**Die Web-App für LBS Brixen Schüler** — Stundenplan, Noten, Mensa, Abwesenheiten und mehr über deinen WebUntis-Account.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Live: **[pokyh.com](https://pokyh.com)** · Flutter-Original: [github.com/bedchem/POKYH](https://github.com/bedchem/POKYH)

---

## Features

| Feature | Beschreibung |
|---|---|
| **Stundenplan** | Wochenansicht mit Prüfungen, Entfällen und Vertretungen |
| **Noten** | Fächerübersicht, Durchschnitte, interaktiver Notensimulator |
| **Mensa** | Tagesmenü mit Nährwerten, Allergenen und Bewertungsfunktion |
| **Nachrichten** | WebUntis-Inbox mit Anhang-Download |
| **Abwesenheiten** | Fehlstunden, Entschuldigungen und Fehlquote |
| **Erinnerungen** | Klassen-basierte Hausaufgaben & Reminder (Firebase) |
| **Todos** | Persönliche Aufgabenliste |
| **Profil** | Theme-Auswahl (Hell / Dunkel / System), Abmelden |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router + Proxy-Middleware)
- **Frontend**: React 19, Tailwind CSS v4, Framer Motion
- **Sprache**: TypeScript 5
- **Auth & DB**: Firebase Auth (anonym) + Cloud Firestore
- **3D**: Three.js, React Three Fiber (Landing Page)
- **Schuldaten**: WebUntis API (`lbs-brixen.webuntis.com`)
- **Mensa**: [`mensa.plattnericus.dev`](https://mensa.plattnericus.dev)
- **Analytics**: Vercel Analytics + Google Analytics 4 (optional, DSGVO-konform)

---

## Sicherheit

| Maßnahme | Details |
|---|---|
| **Session-Verschlüsselung** | AES-GCM in `httpOnly`-Cookie — für JavaScript unsichtbar |
| **Serverseitiger Proxy** | Jede Anfrage wird vor dem Weiterleiten authentifiziert |
| **Rate-Limiting** | Max. 30 Login-Versuche / 5 Min pro IP |
| **Security-Header** | HSTS (2 Jahre), `X-Frame-Options: DENY`, `nosniff`, Permissions-Policy |
| **Keine Passwortspeicherung** | Nur der verschlüsselte WebUntis-Session-Token wird gespeichert |
| **Kein CORS** | Alle WebUntis-Aufrufe laufen ausschließlich serverseitig |

---

## Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Erstelle `.env.local` mit folgenden Werten:

```env
SESSION_SECRET=                        # openssl rand -base64 32
NEXT_PUBLIC_SITE_URL=https://pokyh.com

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

NEXT_PUBLIC_GA_ID=                     # Optional – Google Analytics
```

### 3. Firebase konfigurieren

1. **Authentication** → Anonym aktivieren
2. **Firestore** → Datenbank erstellen, folgende Rules setzen:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Dev-Server starten
```bash
npm run dev
# → http://localhost:3000  (leitet zu /login weiter)
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## Deployment

**Vercel (empfohlen)**
1. Repo auf GitHub pushen
2. [vercel.com/new](https://vercel.com/new) → Projekt importieren
3. Umgebungsvariablen in den Projekteinstellungen eintragen
4. Deploy — fertig

**Eigener Server**
```bash
npm run build && npm start   # Port 3000, Reverse-Proxy (nginx) empfohlen
```

---

## Projektstruktur

```
app/                  # Next.js App Router (Pages & API-Routes)
  api/webuntis/       # WebUntis-Proxy (Timetable, Grades, Messages, …)
  layout.tsx          # Root-Layout mit SEO, Providers, Analytics
  page.tsx            # Landing Page
components/           # Wiederverwendbare UI-Komponenten
lib/                  # API-Client, Types, Firebase, Session-Crypto
providers/            # React Context (Session, Theme, Firebase, Sidebar)
public/               # Statische Assets, 3D-Modelle
proxy.ts              # Auth-Middleware (Next.js 16)
next.config.ts        # Security-Header, Image-Domains, Kompression
```

---

## Links

| | |
|---|---|
| **Live-App** | [pokyh.com](https://pokyh.com) |
| **Flutter-Original** | [github.com/bedchem/POKYH](https://github.com/bedchem/POKYH) |
| **Kontakt** | contact@pokyh.com |
| **Lizenz** | MIT |

---

<div align="center">

**Made with ❤️ by [plattnericus](https://github.com/plattnericus) & [ryhox](https://github.com/ryhox)**

</div>
