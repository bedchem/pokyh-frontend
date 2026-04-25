# POKYH Web

> Die offizielle Web-App für **LBS Brixen** Schüler – ein 1:1-Port der Flutter-App **[POKYH](https://github.com/bedchem/POKYH)** in **Next.js 16 + React 19**.

---

## Features

| Feature | Beschreibung |
|---|---|
| 🗓 **Stundenplan** | Wochenansicht mit Prüfungen, Entfällen und Vertretungen |
| 📊 **Noten** | Fächerübersicht, Schnitte, Notensimulator |
| 🍽 **Mensa** | Tagesmenü mit Nährwerten, Allergenen und Bewertungsfunktion |
| 📭 **Nachrichten** | WebUntis-Inbox mit Anhängen |
| 🚫 **Abwesenheiten** | Fehlstunden, Entschuldigungen und Fehlquote |
| 🔔 **Erinnerungen** | Klassen-basierte Hausaufgaben & Reminder via Firebase |
| 👤 **Profil** | Theme-Auswahl (Hell / Dunkel / System), Abmelden |

---

## Technologie

- **Framework**: Next.js 16 (App Router, Proxy)
- **Frontend**: React 19, Tailwind CSS v4
- **Sprache**: TypeScript
- **Auth & DB**: Firebase Auth (anonym) + Firestore
- **Schuldaten**: WebUntis API (lbs-brixen.webuntis.com)
- **Mensa**: [mensa.plattnericus.dev](https://mensa.plattnericus.dev/mensa.json)

---

## Sicherheit

- 🔒 Session-Token **verschlüsselt** (AES-GCM) in einem `httpOnly`-Cookie – für JavaScript unsichtbar
- 🛡 **Proxy** (Next.js 16) prüft jede Anfrage serverseitig – kein Zugang zu geschützten Routen ohne gültige Session
- 🚦 **Rate-Limiting** am Login-Endpoint (max. 10 Versuche / 5 Min)
- 🔐 **Security-Header** auf allen Routen: HSTS, X-Frame-Options, CSP-Ready, CSRF-Schutz via SameSite=Strict
- 🙈 **Keine Passwörter gespeichert** – nur der verschlüsselte WebUntis-Session-Token
- 🌐 Alle WebUntis-API-Aufrufe laufen **serverseitig** (keine CORS-Probleme, keine Token im Browser)

---

## Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Die Datei `.env.local` liegt bereits vor. Fülle alle Werte aus:

| Variable | Wo finden |
|---|---|
| `SESSION_SECRET` | Selbst generieren: `openssl rand -base64 32` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Projekteinstellungen |
| `NEXT_PUBLIC_SITE_URL` | Deine Domain, z. B. `https://pokyh.app` |

### 3. Firebase konfigurieren
1. Firebase Console → Authentication → **Anonym** aktivieren
2. Firebase Console → Firestore → Datenbank erstellen
3. Firestore-Regeln:
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

### 4. Entwicklungsserver starten
```bash
npm run dev
```
→ [http://localhost:3000](http://localhost:3000) — leitet automatisch zu `/login` weiter.

### 5. Produktions-Build
```bash
npm run build && npm start
```

---

## Deployment

### Vercel (empfohlen)
1. Repo auf GitHub pushen
2. [vercel.com/new](https://vercel.com/new) → Projekt importieren
3. Umgebungsvariablen in den Vercel-Projekteinstellungen eintragen
4. Deploy!

### Eigener Server
```bash
npm run build
npm start   # Port 3000
```

---

## SEO-Strategie

Die App ist für folgende Suchbegriffe optimiert (alle schul-spezifisch, keine Irreführung):

- `POKYH` · `LBS Brixen App` · `WebUntis LBS Brixen`
- `Stundenplan LBS Brixen` · `Noten LBS Brixen` · `Mensa LBS Brixen`

**Implementiert**: JSON-LD Structured Data, Open Graph, Twitter Card, robots.txt, sitemap.xml, Canonical URLs, Core Web Vitals-optimiertes Rendering.

---

## Projekt-Links

| | |
|---|---|
| **Flutter-Original** | [github.com/bedchem/POKYH](https://github.com/bedchem/POKYH) |
| **Feedback** | feedback@plattnericus.dev |
| **Lizenz** | MIT |

---

*Gebaut für die LBS Brixen Community*
