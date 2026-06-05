# POKYH — Schulapp für LBS Brixen

Eine kostenlose Web-App für Schülerinnen, Schüler und Erziehungsberechtigte der
Landesberufsschule Brixen (Südtirol). Stundenplan, Noten, Mensa, Abwesenheiten,
Nachrichten, Todos und Klassen-Erinnerungen — alles an einem Ort, in einem
cleanen, Apple-artigen Design.

**Live:** [pokyh.com](https://pokyh.com)

> Nicht offiziell mit der LBS Brixen oder WebUntis verbunden.

---

## Inhalt

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Architektur](#architektur)
- [WebUntis-Integration](#webuntis-integration)
- [Eltern-/Schülerkonten](#eltern--und-schülerkonten)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)
- [Projektstruktur](#projektstruktur)
- [Sicherheit](#sicherheit)
- [Lizenz](#lizenz)

---

## Features

| Bereich | Beschreibung |
|---------|--------------|
| **Stundenplan** | Tages- und Wochenansicht mit Prüfungen, Vertretungen und Entfällen |
| **Noten** | Fachweise Übersicht inkl. automatischem Gesamtschnitt |
| **Abwesenheiten** | Fehlstunden mit Jahresübersicht, exakter Minuten­berechnung und Status (entschuldigt/offen) |
| **Mensa** | Speiseplan mit Nährwerten, Allergenen und Sternebewertungen |
| **Nachrichten** | WebUntis MessageCenter: Posteingang, **Gesendet**, **Entwürfe**, Anhänge, Empfänger-Auswahl |
| **Todos** | Persönliche Aufgabenliste mit Fälligkeitsdaten |
| **Erinnerungen** | Klassenweite Erinnerungen für Hausaufgaben und Prüfungen |
| **Klassenbuch** | Klassenbuch-Einträge |

Dazu: Dunkel- & Hellmodus, Mobile-First-Layout, PWA-fähig, framer-motion-Animationen.

---

## Tech Stack

| Was | Womit |
|-----|-------|
| Framework | **Next.js 16** (App Router, Route Handlers) |
| Sprache | **TypeScript** |
| Styling | **Tailwind CSS v4** + CSS-Variablen (Theme-Tokens) |
| Animationen | framer-motion + CSS-Keyframes |
| WebUntis-Daten | WebUntis Interne API (über eigene Server-Proxy-Routes) |
| App-Auth & -Daten | [POKYH Backend](https://github.com/bedchem/pokyh-backend) (Node.js, MySQL, JWT) |
| Session | AES-GCM-verschlüsseltes httpOnly-Cookie |
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
#    .env.local mit deinen Werten befüllen

# 4. Entwicklungsserver starten
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000).

```bash
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
npm run start    # Produktionsserver
npm run lint     # ESLint
```

---

## Umgebungsvariablen

Alle Variablen sind in `.env.example` dokumentiert. **Nichts ist hartkodiert** —
sämtliche WebUntis-URLs/-Pfade kommen aus der Umgebung, mit sinnvollen Defaults,
sodass die App „out of the box" für eine andere WebUntis-Instanz konfigurierbar ist.

### App / Backend

| Variable | Beschreibung |
|----------|--------------|
| `SESSION_SECRET` | AES-GCM-Schlüssel für das Session-Cookie (Base64, 32 Byte) |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL der App |
| `API_BACKEND_URL` | Interne Backend-URL für Server-zu-Server-Calls |
| `API_SERVER_KEY` / `API_BACKEND_KEY` | Keys für privilegierte Backend-Calls |
| `NEXT_PUBLIC_GA_ID` | Google-Analytics-ID (optional) |

### WebUntis

| Variable | Default | Zweck |
|----------|---------|-------|
| `WEBUNTIS_BASE_URL` | `https://lbs-brixen.webuntis.com/WebUntis` | Basis-URL der Instanz |
| `WEBUNTIS_SCHOOL` | `lbs-brixen` | Schul-Kürzel (für `?school=`) |
| `WEBUNTIS_API_PATH_APPDATA` | `/api/rest/view/v1/app/data` | App-/Userdaten (Rechte, Kind-Auflösung) |
| `WEBUNTIS_API_PATH_ABSENCES` | `/api/classreg/absences/students` | Abwesenheiten-Liste (enthält auch `absenceReasons` + `showCreateAbsence`) |
| `WEBUNTIS_API_PATH_MSG_LIST` | `/api/rest/view/v1/messages` | Posteingang |
| `WEBUNTIS_API_PATH_MSG_SENT` | `/api/rest/view/v1/messages/sent` | Gesendet |
| `WEBUNTIS_API_PATH_MSG_DRAFTS` | `/api/rest/view/v1/messages/drafts` | Entwürfe |
| `WEBUNTIS_API_PATH_MSG_RECIPIENTS` | `/api/rest/view/v1/messages/recipients/static/persons` | Empfängerliste (Klassenlehrkräfte / Andere) |
| `WEBUNTIS_API_PATH_MSG_SEND` | `/api/rest/view/v1/messages` | Nachricht senden |
| `WEBUNTIS_ABSENCE_RIGHT` | `STUDABS_REPORT,…` | Fallback-Rechte-Tokens für das Melde-Gate |
| `NEXT_PUBLIC_FORCE_ABSENCE_REPORT` | `false` | DEV: Melde-UI erzwingen (Tests) |

---

## Architektur

```
Browser ──▶ Next.js (lib/api.ts)
                │  fetch /api/webuntis/*
                ▼
        Route Handler (app/api/webuntis/*)        ← Server, kein CORS
                │  liest verschlüsselte Session, setzt Bearer/Cookie
                ▼
            WebUntis API
```

- **Kein direkter Browser-Zugriff auf WebUntis** — alle WebUntis-Calls laufen
  server-seitig über Proxy-Routes (`app/api/webuntis/*`). Dadurch keine
  CORS-Probleme und keine Token-Exposition im Client.
- **Session:** Beim Login wird per WebUntis-JSON-RPC `authenticate` eingeloggt,
  ein Bearer-Token geholt und alles in ein **AES-GCM-verschlüsseltes httpOnly-Cookie**
  (`lib/session-crypto.ts`, `lib/server-session.ts`) gepackt (4 h gültig).
- **Middleware** (`proxy.ts`) schützt alle Routen; nur explizite Public-Prefixes
  (Login, Mensa, Marketing-Seiten) sind ohne Session erreichbar.
- **Client-Cache:** In-Memory + localStorage für sofortiges Rendern (`lib/cache.ts`),
  mit Stale-While-Revalidate. Sensible/zustandsabhängige Endpunkte (z. B.
  Berechtigungen) werden **bewusst nie gecacht**.

---

## WebUntis-Integration

Die internen WebUntis-Endpunkte sind undokumentiert und je Instanz unterschiedlich.
Alle Pfade sind daher **env-konfigurierbar**. Wichtige, live verifizierte Eigenheiten
der Instanz `lbs-brixen` (ui2020):

- **Abwesenheitsgründe** liegen *in* der Abwesenheits-Antwort (`data.absenceReasons`),
  es gibt keinen eigenen Endpunkt.
- **Melde-Berechtigung (18+ / Erziehungsberechtigte)** wird über das WebUntis-eigene,
  altersabhängige Flag `data.showCreateAbsence` bestimmt — nicht über rohe
  Rechte-Tokens (die haben Schüler altersunabhängig).
- **Nachrichten-Empfänger:** `…/messages/recipients/static/persons` liefert Gruppen
  (`CLASS_TEACHERS`, `TEACHERS`, `OTHERS`) mit `userId` + `displayName`.

---

## Eltern- und Schülerkonten

- **Schülerkonto:** Die eingeloggte Person *ist* der Schüler → eigene Daten.
- **Erziehungsberechtigte:** WebUntis erlaubt `getStudents` für Eltern **nicht**.
  Das Kind wird stattdessen aus den App-Daten (`user.students[0].id`) aufgelöst, und
  alle Daten (Stundenplan, Noten, Abwesenheiten) werden auf das Kind bezogen.
- Für Elternkonten werden **Erinnerungen** und **Todos** ausgeblendet (persönliche
  Schüler-Features).

---

## Bekannte Einschränkungen

- **Abwesenheit *anlegen* ist aktuell deaktiviert (auskommentiert).** Die Instanz
  `lbs-brixen` stellt über die verfügbare API **keinen funktionierenden
  Schreib-Endpunkt** bereit: der Legacy-`classreg`-Pfad antwortet mit `403`
  („Access Denied"), der moderne REST-Pfad (`calendar-entry/absences`) mit `500`
  bei jedem getesteten Format. Das **Lesen** der Abwesenheiten funktioniert
  vollständig. Der UI-Code (`+`-Button, Sheet) ist in `app/absences/page.tsx`
  auskommentiert und kann reaktiviert werden, sobald das korrekte
  Sende-Format bekannt ist.
- Fehlermeldungen für Endnutzer sind bewusst generisch (keine Statuscodes,
  Endpunkte oder Variablennamen).

---

## Projektstruktur

```
app/
├── api/
│   ├── webuntis/        # WebUntis-Proxy: timetable, grades, absences, messages …
│   ├── auth/            # App-Login/Logout, Session
│   └── mensa/           # Speiseplan
├── home/ timetable/ grades/ mensa/ messages/ absences/
├── todos/ reminders/ class/ profile/ login/ legal/
components/              # UI-Komponenten (absences/, messages/, ui/ …)
providers/               # React Context (Session, Theme, Sidebar)
lib/                     # API-Client, Session-Crypto, WebUntis-Helper, Typen
proxy.ts                 # Middleware (Routen-Schutz)
```

---

## Sicherheit

- Alle `/api/webuntis/*`-Routes (außer Login) erfordern eine gültige Session.
- WebUntis-Schreib-Routes prüfen die Berechtigung **zusätzlich serverseitig**.
- Session-Cookie ist `httpOnly`, `sameSite=strict`, in Produktion `secure`,
  AES-GCM-verschlüsselt.
- IP-basiertes Rate-Limiting am Login.
- `npm audit`: 0 Schwachstellen.

---

## Lizenz

MIT — kostenlos nutzbar, keine Garantie. Nicht offiziell mit der LBS Brixen oder
WebUntis verbunden.
