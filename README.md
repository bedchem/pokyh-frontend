# POKYH — Schulapp für LBS Brixen

Eine kostenlose Web-App für Schülerinnen und Schüler der Landesberufsschule Brixen (Südtirol). Stundenplan, Noten, Mensa, Abwesenheiten, Nachrichten, Todos und Klassen-Erinnerungen — alles an einem Ort.

**Live:** [pokyh.com](https://pokyh.com)

---

## Features

- **Stundenplan** — Tages- und Wochenansicht mit Prüfungen, Vertretungen und Entfällen
- **Noten** — Fachweise Übersicht mit automatischem Gesamtschnitt
- **Mensa** — Speiseplan mit Nährwerten, Allergenen und Sternebewertungen
- **Nachrichten** — WebUntis-Inbox mit Anhängen
- **Abwesenheiten** — Fehlstunden mit Jahresübersicht
- **Todos** — Persönliche Aufgabenliste mit Fälligkeitsdaten
- **Erinnerungen** — Klassenweite Erinnerungen für Hausaufgaben und Prüfungen
- Dunkel- & Hellmodus, Mobile-First, PWA-ready

---

## Tech Stack

| Was | Womit |
|-----|-------|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Daten | [POKYH Backend](https://github.com/bedchem/pokyh-backend) (Node.js, MySQL, JWT) |
| WebUntis-Daten | WebUntis API (via eigene Proxy-Routes) |
| Hosting | Selfhosting |

---

## Lokale Entwicklung

**Voraussetzungen:** Node.js ≥ 20, laufendes [pokyh-backend](https://github.com/bedchem/pokyh-backend)

```bash
# 1. Repository klonen
git clone https://github.com/bedchem/pokyh-frontend
cd pokyh-frontend

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# .env.local mit deinen Werten befüllen (Backend-URL, API-Keys)

# 4. Entwicklungsserver starten
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

---

## Umgebungsvariablen

Alle nötigen Variablen sind in `.env.example` dokumentiert.

| Variable | Beschreibung |
|----------|-------------|
| `SESSION_SECRET` | AES-GCM-Schlüssel für Session-Cookies (Base64, 32 Byte) |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL der App |
| `NEXT_PUBLIC_API_KEY` | API-Key für das POKYH-Backend (öffentlich) |
| `API_BACKEND_URL` | Interne Backend-URL für Server-zu-Server-Calls |
| `API_SERVER_KEY` | Server-seitiger Key für privilegierte Backend-Calls |
| `API_BACKEND_KEY` | Backend-Key für Server-seitige Calls |
| `NEXT_PUBLIC_GA_ID` | Google Analytics Measurement-ID (optional) |

---

## Projektstruktur

```
app/
├── api/                 # Next.js API-Routes (WebUntis-Proxy, Auth, Mensa)
├── home/                # Dashboard
├── timetable/           # Stundenplan
├── grades/              # Noten
├── mensa/               # Speiseplan
├── messages/            # Nachrichten
├── absences/            # Abwesenheiten
├── todos/               # Todo-Liste
├── reminders/           # Klassen-Erinnerungen
├── profile/             # Profil & Einstellungen
└── login/               # Login

components/              # Gemeinsame UI-Komponenten
providers/               # React Context (Session, Theme, App-State)
lib/                     # API-Client, Hilfsfunktionen, Typen
```

---

## Backend

Dieses Frontend kommuniziert mit dem [POKYH Backend](https://github.com/bedchem/pokyh-backend) — einem eigenen Node.js/Express-Server mit MySQL, JWT-Auth und Server-Sent Events für Echtzeit-Updates.

---

## Lizenz

MIT — kostenlos nutzbar, keine Garantie. Nicht offiziell mit der LBS Brixen oder WebUntis verbunden.
