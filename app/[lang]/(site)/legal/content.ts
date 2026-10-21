// The legal texts of POKYH (imprint, privacy notice, terms of use, cookies,
// Pokyh Learn) in German, Italian and English, as structured content: the
// page (page.tsx) numbers the sections, builds the table of contents and fills
// in the identity and contact details from the deployment's configuration
// (lib/legal-identity.ts). Legal seat: Italy. Version: 19 October 2026.

export type LegalLocale = 'de' | 'it' | 'en';
export type LegalDocView = 'impressum' | 'datenschutz' | 'nutzungsbedingungen' | 'cookies' | 'learn';
export type CookieKind = 'necessary' | 'setting' | 'analytics' | 'consent';

export type Block =
  | { p: string }
  | { list: string[] }
  | { items: { label: string; desc: string }[] }
  | { parties: { name: string; purpose: string; url: string | null }[] }
  | { cookies: { name: string; kind: CookieKind; desc: string }[] }
  | { identity: 'operator' | 'controller' }
  | { contact: 'contact' | 'privacy' }
  | { note: 'seePrivacy' }
  | { complaint: string }
  | { mixed: [string, string, string] }
  | { cookieButton: string }
  | { optout: { prefix: string; label: string } }
  | { link: { view: LegalDocView; label: string } }
  | { links: { href: string; label: string }[] };

export interface LegalSectionContent {
  id: string;
  title: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  lead: string;
  sections: LegalSectionContent[];
}

export const LEGAL_UPDATED: Record<LegalLocale, string> = {
  "de": "19. Oktober 2026",
  "it": "19 ottobre 2026",
  "en": "19 October 2026"
};

export const LEGAL_UI = {
  "de": {
    "legal": "Rechtliches",
    "lead": "Wer hinter POKYH steht, wie POKYH mit deinen Daten umgeht und welche Regeln gelten. In klarer Sprache, auf Deutsch, Italienisch und Englisch.",
    "updated": "Stand",
    "contents": "Inhalt",
    "back": "Rechtliches",
    "top": "Nach oben",
    "open": "Öffnen",
    "fallback": "Die rechtlichen Texte gibt es auf Deutsch, Italienisch und Englisch. Angezeigt wird die Sprache deines Geräts.",
    "controllerBy": "betrieben von",
    "privateIndividual": "Privatperson",
    "seePrivacy": "Verantwortlicher für den Datenschutz: siehe Datenschutzerklärung, Abschnitt 1.",
    "contact": "Kontakt",
    "complaint": "Beschwerde",
    "cookieKinds": {
      "necessary": "Notwendig",
      "setting": "Einstellung",
      "analytics": "Statistik",
      "consent": "Mit Einwilligung"
    },
    "privacyLink": "Datenschutz"
  },
  "it": {
    "legal": "Note legali",
    "lead": "Chi c’è dietro POKYH, come POKYH tratta i tuoi dati e quali regole valgono. In parole chiare, in italiano, tedesco e inglese.",
    "updated": "Aggiornato al",
    "contents": "Indice",
    "back": "Note legali",
    "top": "Torna su",
    "open": "Apri",
    "fallback": "I testi legali sono disponibili in tedesco, italiano e inglese. Viene mostrata la lingua del tuo dispositivo.",
    "controllerBy": "gestito da",
    "privateIndividual": "persona fisica",
    "seePrivacy": "Titolare del trattamento: vedi informativa privacy, sezione 1.",
    "contact": "Contatto",
    "complaint": "Reclamo",
    "cookieKinds": {
      "necessary": "Necessario",
      "setting": "Impostazione",
      "analytics": "Statistica",
      "consent": "Con consenso"
    },
    "privacyLink": "Informativa"
  },
  "en": {
    "legal": "Legal",
    "lead": "Who is behind POKYH, how POKYH handles your data and which rules apply. In plain language, in English, German and Italian.",
    "updated": "Version",
    "contents": "Contents",
    "back": "Legal",
    "top": "Back to top",
    "open": "Open",
    "fallback": "The legal texts are available in German, Italian and English. They are shown in your device’s language.",
    "controllerBy": "run by",
    "privateIndividual": "private individual",
    "seePrivacy": "Data controller: see the privacy notice, section 1.",
    "contact": "Contact",
    "complaint": "Complaint",
    "cookieKinds": {
      "necessary": "Necessary",
      "setting": "Setting",
      "analytics": "Statistics",
      "consent": "With consent"
    },
    "privacyLink": "Privacy"
  }
} satisfies Record<LegalLocale, unknown>;

export const LEGAL_TILES: Record<LegalLocale, Record<LegalDocView, { title: string; desc: string }>> = {
  "de": {
    "impressum": {
      "title": "Impressum",
      "desc": "Anbieter, Kontakt, Unabhängigkeit von Untis und Haftung"
    },
    "datenschutz": {
      "title": "Datenschutzerklärung",
      "desc": "Welche Daten POKYH verarbeitet, warum, wie lange und deine Rechte"
    },
    "nutzungsbedingungen": {
      "title": "Nutzungsbedingungen",
      "desc": "Regeln für die Nutzung, Mindestalter 14 und Haftung"
    },
    "cookies": {
      "title": "Cookies und Speicher",
      "desc": "Was im Browser gespeichert wird und wie du es änderst"
    },
    "learn": {
      "title": "Pokyh Learn · Datenschutz",
      "desc": "Hinweise zur WebUntis-Prüfung und zum digitalen Lernen"
    }
  },
  "it": {
    "impressum": {
      "title": "Note legali",
      "desc": "Gestore, contatti, indipendenza da Untis e responsabilità"
    },
    "datenschutz": {
      "title": "Informativa sulla privacy",
      "desc": "Quali dati tratta POKYH, perché, per quanto tempo e i tuoi diritti"
    },
    "nutzungsbedingungen": {
      "title": "Condizioni d’uso",
      "desc": "Regole d’uso, età minima 14 anni e responsabilità"
    },
    "cookies": {
      "title": "Cookie e memoria",
      "desc": "Cosa viene salvato nel browser e come modificarlo"
    },
    "learn": {
      "title": "Pokyh Learn · Privacy",
      "desc": "Informativa sulla verifica WebUntis e l’apprendimento digitale"
    }
  },
  "en": {
    "impressum": {
      "title": "Imprint",
      "desc": "Provider, contact, independence from Untis and liability"
    },
    "datenschutz": {
      "title": "Privacy notice",
      "desc": "Which data POKYH processes, why, for how long and your rights"
    },
    "nutzungsbedingungen": {
      "title": "Terms of use",
      "desc": "Rules of use, minimum age 14 and liability"
    },
    "cookies": {
      "title": "Cookies and storage",
      "desc": "What is stored in the browser and how to change it"
    },
    "learn": {
      "title": "Pokyh Learn · Privacy",
      "desc": "Information on WebUntis verification and digital learning"
    }
  }
};

export const LEGAL_DOCS: Record<LegalDocView, Record<LegalLocale, LegalDocument>> = {
  "impressum": {
    "de": {
      "title": "Impressum",
      "lead": "Anbieter, Kontakt, Unabhängigkeit von Untis und Haftung",
      "sections": [
        {
          "id": "anbieter",
          "title": "Anbieter",
          "blocks": [
            {
              "identity": "operator"
            },
            {
              "p": "POKYH ist ein kostenloses, werbefreies und nicht kommerzielles Projekt. Es gibt keine eingetragene Firma dahinter."
            },
            {
              "p": "Wer möchte, kann POKYH freiwillig über Buy Me a Coffee unterstützen. Das ist ein Geschenk ohne Gegenleistung: Alle Funktionen bleiben für alle gleich und kostenlos, und POKYH wird dadurch nicht kommerziell. Die Zahlung wickelt Buy Me a Coffee nach den eigenen Bedingungen und Datenschutzhinweisen ab."
            },
            {
              "note": "seePrivacy"
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Kontakt",
          "blocks": [
            {
              "contact": "contact"
            },
            {
              "p": "Für Fragen, Hinweise auf Fehler und Meldungen von Rechtsverletzungen genügt eine E-Mail. Wir antworten in der Regel innerhalb weniger Tage."
            },
            {
              "p": "Diese Adresse ist auch die zentrale Kontaktstelle nach Art. 11 und 12 der Verordnung (EU) 2022/2065 (Digital Services Act) für Behörden der Mitgliedstaaten, die EU-Kommission und für Nutzerinnen und Nutzer. Du kannst uns auf Deutsch, Italienisch oder Englisch schreiben. Rechtswidrige Inhalte meldest du am schnellsten mit „Melden“ direkt am Kommentar (siehe Nutzungsbedingungen)."
            }
          ]
        },
        {
          "id": "zweck",
          "title": "Was POKYH ist",
          "blocks": [
            {
              "p": "POKYH ist eine App für Schülerinnen, Schüler und Eltern an Schulen, die WebUntis nutzen. Sie zeigt nach der Anmeldung mit dem eigenen WebUntis-Konto Stundenplan, Vertretungen, Prüfungen, Noten, Abwesenheiten und Nachrichten übersichtlich an und ergänzt eigene Funktionen wie To-dos, Klassen-Erinnerungen und, wo vorhanden, den Mensa-Speiseplan."
            }
          ]
        },
        {
          "id": "unabhaengigkeit",
          "title": "Unabhängigkeit und Marken",
          "blocks": [
            {
              "p": "POKYH ist unabhängig. Es ist nicht mit der Untis GmbH verbunden und wird weder von ihr noch von einer Schule betrieben, geprüft oder unterstützt. WebUntis und Untis sind Marken der Untis GmbH; POKYH nennt sie nur, um zu beschreiben, womit die App funktioniert."
            },
            {
              "p": "POKYH greift ausschließlich mit den Zugangsdaten und im Auftrag der angemeldeten Person auf deren eigene Daten in WebUntis zu, im Umfang, den ihr Konto bei der Schule hat. Ob deine Schule die Nutzung über Apps anderer Anbieter erlaubt, regelt deine Schule; bitte beachte ihre Nutzungsregeln."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "Inhalte und Haftung",
          "blocks": [
            {
              "p": "Die angezeigten Schuldaten stammen aus WebUntis deiner Schule. Maßgeblich sind immer die Angaben in WebUntis bzw. der Schule. Werte, die POKYH selbst berechnet (zum Beispiel Notenschnitt, Fehlstunden und Prozentwerte), sind unverbindliche Hilfen."
            },
            {
              "p": "Für Inhalte verlinkter fremder Seiten sind ausschließlich deren Betreiber verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir die betreffenden Inhalte oder Links umgehend. Die Haftung richtet sich im Übrigen nach den Nutzungsbedingungen."
            }
          ]
        },
        {
          "id": "urheberrecht",
          "title": "Urheberrecht",
          "blocks": [
            {
              "p": "Der Quellcode von POKYH ist Open Source: Web-App und Backend sind auf GitHub veröffentlicht (github.com/bedchem) und stehen unter der MIT-Lizenz. Verwendete Bibliotheken und Schriften unterliegen ihren eigenen Lizenzen. Die Fotos der Gerichte im Mensa-Speiseplan gehören ihren Urhebern; sie werden nicht kopiert, sondern direkt von den Seiten geladen, auf denen sie frei zugänglich veröffentlicht sind. Wer Rechte an einem Foto hat und nicht möchte, dass es so angezeigt wird, schreibt uns über die Kontaktadresse oben; wir nehmen den Verweis dann umgehend heraus."
            }
          ]
        }
      ]
    },
    "it": {
      "title": "Note legali",
      "lead": "Gestore, contatti, indipendenza da Untis e responsabilità",
      "sections": [
        {
          "id": "anbieter",
          "title": "Gestore",
          "blocks": [
            {
              "identity": "operator"
            },
            {
              "p": "POKYH è un progetto gratuito, senza pubblicità e non commerciale. Non c’è una società registrata alle sue spalle."
            },
            {
              "p": "Chi vuole può sostenere POKYH volontariamente tramite Buy Me a Coffee. È un dono senza controprestazione: tutte le funzioni restano uguali e gratuite per tutti e POKYH non diventa per questo commerciale. Il pagamento è gestito da Buy Me a Coffee secondo le proprie condizioni e la propria informativa privacy."
            },
            {
              "note": "seePrivacy"
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contatto",
          "blocks": [
            {
              "contact": "contact"
            },
            {
              "p": "Per domande, segnalazioni di errori e di violazioni di diritti basta un’e-mail. Di solito rispondiamo entro pochi giorni."
            },
            {
              "p": "Questo indirizzo è anche il punto di contatto unico ai sensi degli artt. 11 e 12 del regolamento (UE) 2022/2065 (Digital Services Act) per le autorità degli Stati membri, la Commissione europea e per gli utenti. Puoi scriverci in italiano, tedesco o inglese. Il modo più rapido per segnalare contenuti illegali è «Segnala» direttamente accanto al commento (vedi condizioni d’uso)."
            }
          ]
        },
        {
          "id": "zweck",
          "title": "Cos’è POKYH",
          "blocks": [
            {
              "p": "POKYH è un’app per studentesse, studenti e genitori delle scuole che usano WebUntis. Dopo l’accesso con il proprio account WebUntis mostra in modo chiaro orario, supplenze, verifiche, voti, assenze e messaggi e aggiunge funzioni proprie come to-do, promemoria di classe e, dove disponibile, il menù della mensa."
            }
          ]
        },
        {
          "id": "unabhaengigkeit",
          "title": "Indipendenza e marchi",
          "blocks": [
            {
              "p": "POKYH è indipendente. Non è collegata a Untis GmbH e non è gestita, verificata o sostenuta né da Untis GmbH né da una scuola. WebUntis e Untis sono marchi di Untis GmbH; POKYH li nomina solo per descrivere con cosa funziona l’app."
            },
            {
              "p": "POKYH accede ai dati in WebUntis esclusivamente con le credenziali e per conto della persona che ha effettuato l’accesso, limitatamente ai suoi dati e ai permessi che il suo account ha presso la scuola. Se la tua scuola consente l’uso tramite app di altri fornitori lo decide la scuola; rispetta le sue regole d’uso."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "Contenuti e responsabilità",
          "blocks": [
            {
              "p": "I dati scolastici mostrati provengono da WebUntis della tua scuola. Fanno sempre fede i dati in WebUntis o quelli comunicati dalla scuola. I valori calcolati da POKYH (ad esempio media dei voti, ore di assenza e percentuali) sono aiuti non vincolanti."
            },
            {
              "p": "Dei contenuti di siti esterni collegati sono responsabili esclusivamente i rispettivi gestori. Se veniamo a conoscenza di violazioni, rimuoviamo subito i contenuti o i link interessati. Per il resto la responsabilità è regolata dalle condizioni d’uso."
            }
          ]
        },
        {
          "id": "urheberrecht",
          "title": "Diritto d’autore",
          "blocks": [
            {
              "p": "Il codice sorgente di POKYH è open source: la web app e il backend sono pubblicati su GitHub (github.com/bedchem) con licenza MIT. Le librerie e i caratteri utilizzati sono soggetti alle proprie licenze. Le foto dei piatti nel menù della mensa appartengono ai loro autori; non vengono copiate, ma caricate direttamente dai siti in cui sono pubblicate e liberamente accessibili. Chi ha diritti su una foto e non desidera che sia mostrata così può scriverci all’indirizzo di contatto indicato sopra; rimuoveremo subito il collegamento."
            }
          ]
        }
      ]
    },
    "en": {
      "title": "Imprint",
      "lead": "Provider, contact, independence from Untis and liability",
      "sections": [
        {
          "id": "anbieter",
          "title": "Provider",
          "blocks": [
            {
              "identity": "operator"
            },
            {
              "p": "POKYH is a free, ad-free and non-commercial project. There is no registered company behind it."
            },
            {
              "p": "Anyone who wants to can support POKYH voluntarily via Buy Me a Coffee. It is a gift with nothing in return: every feature stays the same and free for everyone, and POKYH does not become commercial because of it. Payments are handled by Buy Me a Coffee under its own terms and privacy notice."
            },
            {
              "note": "seePrivacy"
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contact",
          "blocks": [
            {
              "contact": "contact"
            },
            {
              "p": "For questions, error reports and notices of infringements, an e-mail is enough. We usually reply within a few days."
            },
            {
              "p": "This address is also the single point of contact under Articles 11 and 12 of Regulation (EU) 2022/2065 (Digital Services Act) for authorities of the Member States, the European Commission and for users. You can write to us in English, German or Italian. The quickest way to report illegal content is “Report” right next to the comment (see the terms of use)."
            }
          ]
        },
        {
          "id": "zweck",
          "title": "What POKYH is",
          "blocks": [
            {
              "p": "POKYH is an app for students and parents at schools that use WebUntis. After signing in with your own WebUntis account it shows timetable, substitutions, exams, grades, absences and messages clearly and adds its own features such as to-dos, class reminders and, where available, the cafeteria menu."
            }
          ]
        },
        {
          "id": "unabhaengigkeit",
          "title": "Independence and trademarks",
          "blocks": [
            {
              "p": "POKYH is independent. It is not affiliated with Untis GmbH and is neither run, reviewed nor endorsed by Untis GmbH or by any school. WebUntis and Untis are trademarks of Untis GmbH; POKYH names them only to describe what the app works with."
            },
            {
              "p": "POKYH accesses data in WebUntis only with the credentials and on behalf of the signed-in person, limited to their own data and to the permissions their account has at their school. Whether your school allows access through apps of other providers is up to your school; please follow its rules of use."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "Content and liability",
          "blocks": [
            {
              "p": "The school data shown comes from your school’s WebUntis. The information in WebUntis or from the school is always authoritative. Values POKYH calculates itself (for example grade averages, missed hours and percentages) are non-binding aids."
            },
            {
              "p": "The operators of linked external sites are solely responsible for their content. If we learn of an infringement, we remove the content or link concerned without delay. Liability is otherwise governed by the terms of use."
            }
          ]
        },
        {
          "id": "urheberrecht",
          "title": "Copyright",
          "blocks": [
            {
              "p": "The source code of POKYH is open source: the web app and the backend are published on GitHub (github.com/bedchem) under the MIT licence. Libraries and fonts used are subject to their own licences. The dish photos in the cafeteria menu belong to their authors; they are not copied but loaded directly from the sites that publish them freely. If you hold rights to a photo and do not want it shown this way, write to us at the contact address above; we will remove the link promptly."
            }
          ]
        }
      ]
    }
  },
  "datenschutz": {
    "de": {
      "title": "Datenschutzerklärung",
      "lead": "Welche Daten POKYH verarbeitet, warum, wie lange und deine Rechte",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Verantwortlicher",
          "blocks": [
            {
              "p": "Verantwortlich für die Verarbeitung im Sinne der Datenschutz-Grundverordnung (EU) 2016/679 (DSGVO) ist:"
            },
            {
              "identity": "controller"
            },
            {
              "p": "Ein Datenschutzbeauftragter ist nicht bestellt, weil die gesetzlichen Voraussetzungen dafür nicht vorliegen. Für alle Fragen zum Datenschutz erreichst du den Verantwortlichen unter der oben genannten Adresse."
            }
          ]
        },
        {
          "id": "kurz",
          "title": "Das Wichtigste in Kürze",
          "blocks": [
            {
              "list": [
                "POKYH ist kostenlos, ohne Werbung und verkauft keine Daten.",
                "Dein WebUntis-Passwort geht nur an den WebUntis-Server deiner Schule und wird auf POKYH-Servern nicht gespeichert.",
                "Daten aus WebUntis (Stundenplan, Noten, Abwesenheiten, Nachrichten) werden nur für die Anzeige abgerufen und auf POKYH-Servern nicht dauerhaft gespeichert.",
                "Freiwillige Statistiken gibt es nur mit deiner Zustimmung, die du jederzeit widerrufen kannst. Fotos von anderen Seiten kannst du jederzeit ausblenden.",
                "Du kannst jederzeit Auskunft, Löschung und mehr verlangen; eine E-Mail genügt."
              ]
            }
          ]
        },
        {
          "id": "daten",
          "title": "Welche Daten POKYH verarbeitet",
          "blocks": [
            {
              "items": [
                {
                  "label": "Schulzugangsdaten (WebUntis-Anmeldung)",
                  "desc": "Dein Benutzername und dein Passwort werden nur verwendet, um dich am WebUntis-Server der Schule anzumelden, die du ausgewählt hast; diese Server betreibt die Untis GmbH im Auftrag der jeweiligen Schule. Auf POKYH-Servern wird das Passwort nicht gespeichert und nicht protokolliert. Damit eine von WebUntis beendete Sitzung automatisch erneuert werden kann, liegen Zugangsdaten und gewählte Schule AES-GCM-verschlüsselt in einem httpOnly-Cookie auf deinem Gerät (pokyh_renew); es wird nur an die Anmeldeadresse gesendet, gilt nur zusammen mit deiner Sitzung, läuft nach 4 Stunden ab und wird beim Abmelden gelöscht. Auch die WebUntis-Sitzung liegt AES-GCM-verschlüsselt in einem httpOnly-Cookie. Die Anmeldung besteht nur aus diesen Cookies: Löschst du sie, bist du abgemeldet. Rechtsgrundlage: Erbringung des von dir gewünschten Dienstes (Art. 6 Abs. 1 lit. b DSGVO)."
                },
                {
                  "label": "Session-Cookie (pokyh_session)",
                  "desc": "Verschlüsseltes httpOnly-Cookie mit dem Schulportal-Session-Token. Läuft beim Logout oder nach 4 Stunden ab. Nicht für JavaScript zugänglich (XSS-Schutz)."
                },
                {
                  "label": "POKYH-Konto (alternative Anmeldung)",
                  "desc": "Nutzer ohne Schulaccount können sich mit einem POKYH-eigenen Konto registrieren (Benutzername + Passwort). Das Passwort wird bcrypt-gehasht gespeichert. Ein Klartext-Passwort wird niemals gespeichert."
                },
                {
                  "label": "Benutzer-Cookie (pokyh_user)",
                  "desc": "Enthält nicht-sensible Anzeigeinformationen (Benutzername, Klasse, Schule) für die Darstellung in der App. Kein Passwort, kein Token."
                },
                {
                  "label": "Schulsuche und gewählte Schule",
                  "desc": "Damit du deine Schule findest, schickt der POKYH-Server deinen Suchbegriff (Name, Ort oder Postleitzahl einer Schule) an die öffentliche Schulsuche von WebUntis (Untis GmbH). Untis erhält dabei nur den Suchbegriff und die Adresse des POKYH-Servers, nicht deine IP-Adresse. Die Treffer werden bis zu 10 Minuten im Arbeitsspeicher des Servers zwischengespeichert und keiner Person zugeordnet. Die gewählte Schule (Anmeldename, Name, Adresse und Server laut WebUntis) speichert dein Browser bis zum Ende des Schuljahres (31. August, mindestens 30 Tage) unter pokyh_school, damit du sie nicht jedes Mal neu suchen musst; du kannst sie beim Anmelden jederzeit ändern. Nach der Anmeldung ordnet das POKYH-Backend dein Konto dieser Schule zu (Anmeldename, Name und Server der Schule), damit Klassen, Erinnerungen, Kommentare und der Speiseplan getrennt nach Schulen bleiben; meldet sich jemand einer Schule zum ersten Mal an, wird die Schule dabei angelegt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO."
                },
                {
                  "label": "POKYH-Backend (Todos & Erinnerungen)",
                  "desc": "Todos und Klassen-Erinnerungen werden auf dem eigenen POKYH-Backend gespeichert: Titel, Details, Zeitstempel, Benutzername. Löschung jederzeit selbst möglich. Es werden keine externen Cloud-Dienste für diese Funktionen genutzt."
                },
                {
                  "label": "Mensa-Bewertungen & Kommentare",
                  "desc": "Wenn du ein Gericht bewertest oder kommentierst, speichert das POKYH-Backend Sternebewertung bzw. Kommentartext, Benutzername, interne Benutzer-ID und Zeitstempel. Kommentare sind mit deinem Benutzernamen für andere angemeldete Nutzer sichtbar; Bewertungen erscheinen nur als Durchschnitt und Anzahl. Eigene Kommentare kannst du jederzeit löschen."
                },
                {
                  "label": "Meldungen von Inhalten (Digital Services Act)",
                  "desc": "Meldest du einen Kommentar oder einen anderen Inhalt (mit „Melden“ oder per E-Mail), verarbeiten wir deine Meldung: deinen Namen und deine E-Mail-Adresse, soweit du sie angibst, den gemeldeten Inhalt und deine Begründung. Wir brauchen sie, um die Meldung zu prüfen, dir zu antworten und unsere Entscheidung zu begründen. Der Person, deren Inhalt gemeldet wurde, nennen wir deinen Namen nicht. Rechtsgrundlage: rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit Art. 16 und 17 der Verordnung (EU) 2022/2065). Aufbewahrung: bis der Fall erledigt ist, danach höchstens 6 Monate für Rückfragen und Widersprüche."
                },
                {
                  "label": "Push-Benachrichtigungen (Website, optional)",
                  "desc": "Nur wenn du Benachrichtigungen im Browser erlaubst: Das POKYH-Backend speichert die Push-Adresse (Endpoint) deines Browsers mit deiner Benutzer-ID. Damit es dich über neue WebUntis-Nachrichten informieren kann, speichert es außerdem deine aktuelle WebUntis-Sitzung (Sitzungskennung und Zugriffstoken, nicht dein Passwort) und fragt damit etwa alle 5 Minuten beim WebUntis-Server deiner Schule ab, wie viele Nachrichten ungelesen sind. Inhalte von Nachrichten werden dabei nicht gespeichert. Die Abfrage endet, sobald WebUntis die Sitzung beendet. Zugestellt werden die Benachrichtigungen über den Push-Dienst deines Browser-Herstellers (z. B. Google, Mozilla oder Apple). Widerruf jederzeit in den Browser-Einstellungen; die Push-Adresse wird dann gelöscht."
                },
                {
                  "label": "Fotos von anderen Seiten (Mensa)",
                  "desc": "Die Fotos der Gerichte im Mensa-Speiseplan liegen auf fremden Rezeptseiten und werden von dort angezeigt; POKYH kopiert sie nicht. Dein Browser lädt sie direkt von diesen Seiten, die dabei wie bei jedem Seitenaufruf deine IP-Adresse und technische Angaben deines Browsers (z. B. Browsertyp) erhalten, ohne Referrer, also ohne die Adresse der POKYH-Seite. Was diese Seiten damit tun, etwa ob sie Cookies setzen, liegt bei ihnen; viele Browser blockieren Cookies fremder Seiten. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO), den Speiseplan anschaulich zu zeigen. Du kannst jederzeit widersprechen (Art. 21 DSGVO): Mit „Fotos ausblenden“ auf der Mensa-Seite lädt dein Browser keine fremden Fotos mehr; die Wahl speichert er unter pokyh_external_media."
                },
                {
                  "label": "Google Analytics 4 (GA4)",
                  "desc": "Diese Website kann Google Analytics 4 (Google LLC) verwenden, aber ausschließlich nach deiner ausdrücklichen Einwilligung im Cookie-Banner; vorher wird keine Verbindung zu Google aufgebaut. GA4 erhebt pseudonymisierte Nutzungsdaten (Seitenaufrufe, Gerätekategorie, ungefähres Herkunftsland) und setzt dafür die Cookies _ga und _ga_*. Nach Angaben von Google speichert GA4 keine IP-Adressen; Google-Signale und Werbefunktionen sind abgeschaltet. Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, Art. 122 Codice privacy). Du kannst sie jederzeit in den Cookie-Einstellungen widerrufen; die Cookies werden dann gelöscht. Zusätzlich kannst du der Datenerhebung unter tools.google.com/dlpage/gaoptout widersprechen."
                },
                {
                  "label": "Cloudflare Tunnel (Cloudflare, Inc.)",
                  "desc": "Zur öffentlichen Erreichbarkeit des selbst gehosteten Servers wird Cloudflare Tunnel verwendet. Cloudflare verarbeitet dabei Netzwerk-Metadaten (IP-Adressen, Anfrage-Header) zur Weiterleitung des Datenverkehrs. Es werden keine Inhalte dauerhaft gespeichert. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) für den sicheren Serverbetrieb. Cloudflare übermittelt uns außerdem das aus der IP-Adresse ermittelte Land (ggf. Region und Stadt), das wir für die Besucher-Statistik von Website und Apps nutzen; eine Standortabfrage bei weiteren Anbietern findet nicht statt."
                },
                {
                  "label": "Server-Protokollierung (Request Logs)",
                  "desc": "Der POKYH-Backend-Server speichert automatisch Zugriffsprotokolle: IP-Adresse, HTTP-Methode, aufgerufener Pfad, HTTP-Statuscode, Antwortdauer, Benutzername und User-Agent. Zweck: Sicherheit, Fehlerdiagnose und Missbrauchserkennung. Außerdem zählen wir daraus ohne Namen, wie viele Konten pro Tag und in den letzten 7 bzw. 30 Tagen aktiv waren und ob sie die iOS-App, die Android-App oder die Website genutzt haben. Für dein Konto wird dazu pro Tag festgehalten, ob du POKYH genutzt hast, auf welcher Art von Gerät (iOS-App, Android-App, Website am Handy oder Computer) und wie oft du dich angemeldet hast, ohne IP-Adresse und ohne aufgerufene Seiten; diese Tagesübersicht siehst du selbst in deinem Profil. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Logs werden spätestens nach 30 Tagen gelöscht, die Tagesübersicht deines Kontos zum Ende des Schuljahres (siehe Speicherdauer)."
                },
                {
                  "label": "Protokoll der Verwaltung",
                  "desc": "Ändern Administratoren etwas, das dein Konto oder deine Inhalte betrifft (zum Beispiel einen Kommentar entfernen oder Rechte vergeben), hält das POKYH-Backend fest, wer wann was geändert hat und welches Konto oder welcher Inhalt betroffen ist, ohne Passwörter oder andere Geheimnisse. Zweck: Nachvollziehbarkeit und Schutz vor Missbrauch. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) und Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO). Die Einträge werden nach 365 Tagen gelöscht."
                },
                {
                  "label": "Nutzungsstatistik (Apps & Website)",
                  "desc": "Solange du angemeldet bist und POKYH im Vordergrund geöffnet ist, melden die iOS-App, die Android-App und die Website dem POKYH-Backend etwa alle 30 bis 60 Sekunden, wie lange POKYH genutzt wurde und wie viele Bildschirme geöffnet wurden. Pro Besuch werden gespeichert: eine zufällige Besuchs-ID, die Plattform (iOS-App, Android-App oder Website, bei der Website zusätzlich Handy oder Computer und ob sie als Web-App installiert ist), die App-Version, Tag und Uhrzeit, die Nutzungsdauer und die Zahl der geöffneten Bildschirme. Mit diesen Angaben gespeichert werden weder IP-Adresse noch User-Agent, Inhalte oder Eingaben; im Browser oder auf dem Gerät wird dafür nichts gespeichert. Ohne Einwilligung (anonym): Statt deines Kontos enthält der Besuch nur einen Tagesschlüssel, einen Hashwert aus deiner Konto-ID und einem Zufallswert, der am Ende des Tages gelöscht wird. So lässt sich zählen, wie viele verschiedene Personen POKYH an einem Tag genutzt haben, ohne zu wissen wer, und Tage lassen sich nicht miteinander verknüpfen. Seitenaufrufe der Website zählen zusätzlich als Website-Besuch, das Öffnen einer App als App-Besuch, dafür wird die IP-Adresse getrennt von der Nutzungsstatistik gespeichert (siehe „Website- und App-Besucher“). Pro Klasse und Tag wird außerdem nur zusammengezählt, wie lange und von wie vielen Personen POKYH genutzt wurde (ohne Namen; angezeigt wird eine Klasse erst ab 5 Personen-Tagen). Ausgewertet wird nur in Gesamtzahlen (z. B. Nutzer je Plattform, durchschnittliche Nutzungsdauer, Stoßzeiten), die ausschließlich Administratoren sehen. Rechtsgrundlage: berechtigtes Interesse an Betrieb und Verbesserung des Dienstes (Art. 6 Abs. 1 lit. f DSGVO); du kannst jederzeit widersprechen (Art. 21 DSGVO): eine kurze Nachricht an die oben genannte Kontaktadresse genügt. Browser mit aktiviertem „Global Privacy Control“ senden keine Nutzungsstatistik. Mit Einwilligung (persönlich, „Alle akzeptieren“ oder Profil): Der Besuch wird zusätzlich deinem Konto zugeordnet, und Administratoren können für dein Konto sehen, welche Plattform und App-Version du nutzt, wann du zuletzt aktiv warst, wie lange, wie oft und an wie vielen Tagen du POKYH genutzt hast, welche Seiten du aufgerufen hast und von welchen IP-Adressen und Orten du die Website und die Apps genutzt hast (z. B. für den Support oder um auf veraltete App-Versionen hinzuweisen). Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); unter 14 Jahren nur mit Erlaubnis deiner Eltern (Art. 8 DSGVO, Art. 2-quinquies Codice privacy). Du kannst sie jederzeit im Profil oder in den Cookie-Einstellungen widerrufen; dann wird dein Name aus allen bisherigen Einträgen entfernt. Diese Daten werden nicht an Dritte weitergegeben, nicht für Werbung genutzt und nicht mit Noten oder anderen Schuldaten verknüpft."
                },
                {
                  "label": "Website- und App-Besucher (Reichweite & Sicherheit)",
                  "desc": "Bei jedem Seitenaufruf der Website (mit oder ohne Konto) speichert das POKYH-Backend: die IP-Adresse, das daraus von Cloudflare ermittelte Land (und, sofern übermittelt, Region und Stadt), den Gerätetyp (Handy, Tablet, Computer), die aufgerufene Seite, Datum und Uhrzeit und ob du angemeldet warst. Ebenso speichert es in der iOS- und Android-App (die nur angemeldet Nutzungsdaten senden) jedes Öffnen der App einmal pro IP-Adresse und Tag: die IP-Adresse, das Land (und, sofern übermittelt, Region und Stadt), das Gerät (iPhone oder Android), die App-Version, Datum und Uhrzeit und die zufällige Besuchs-ID der Nutzungsstatistik, damit ein Besuch nur einmal gezählt wird. Die App sendet dafür nichts zusätzlich; verwendet wird die Adresse, von der die Nutzungsstatistik ohnehin kommt. Bist du angemeldet, kommt ein pseudonymer Kontoschlüssel hinzu (ein mit einem Server-Geheimnis gebildeter Hashwert ohne Namen), damit gezählt werden kann, wie viele verschiedene Konten eine IP-Adresse nutzen, etwa in einem Schulnetz. Verschiedene Besucher pro Tag werden über einen Tagesschlüssel gezählt (bist du angemeldet, aus deinem Konto, sonst aus IP-Adresse und Browserkennung), der am Ende des Tages nicht mehr auflösbar ist. Zweck: wissen, wie viele Menschen die Website und die Apps erreichen und woher sie kommen, sowie Missbrauch, Bots und Angriffe erkennen. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO); du kannst jederzeit widersprechen (Art. 21 DSGVO): eine kurze Nachricht an die oben genannte Kontaktadresse genügt. Hast du der persönlichen Nutzungsstatistik zugestimmt, wird der Besuch zusätzlich deinem Konto zugeordnet, sodass Administratoren bei der IP-Adresse deinen Namen sehen (Art. 6 Abs. 1 lit. a DSGVO); ohne Zustimmung wird kein Name gespeichert, nach einem Widerruf wird er entfernt. IP-Adresse, Ort, Kontoschlüssel, Besuchs-ID und Konto werden nach 30 Tagen gelöscht; danach bleibt nur eine anonyme Zählung nach Land, Gerätetyp, Seite bzw. App-Version, Tag und Stunde. Browser mit aktiviertem „Global Privacy Control“ werden ohne IP-Adresse und Konto gezählt. Die Daten sehen ausschließlich Administratoren; sie werden nicht an Dritte weitergegeben und nicht für Werbung genutzt."
                },
                {
                  "label": "Hinweis & Einwilligungen",
                  "desc": "Zu deinem Konto speichern wir, welche Fassung dieser Datenschutzerklärung dir wann angezeigt wurde (bei der Anmeldung bzw. nach einer Änderung, auf der Website oder in der App) und ob und wann du der persönlichen Nutzungsstatistik zugestimmt oder sie widerrufen hast, als Nachweis (Art. 5 Abs. 2, Art. 7 Abs. 1 DSGVO). Das Anzeigen ist keine Einwilligung. Die Daten werden mit deinem Konto gelöscht. Deine Auswahl im Cookie-Banner wird zusätzlich auf deinem Gerät gespeichert (siehe Cookies)."
                },
                {
                  "label": "Mobile App (iOS & Android)",
                  "desc": "Die nativen POKYH-Apps speichern Zugangsdaten ausschließlich verschlüsselt auf dem Gerät (iOS-Keychain bzw. mit einem Schlüssel aus dem Android Keystore), damit die Anmeldung erneuert werden kann; auf POKYH-Servern werden sie nicht gespeichert. iCloud-Synchronisierung ist deaktiviert. Außer der oben beschriebenen Nutzungsstatistik und App-Besucher-Statistik erhebt die App keine Analysedaten; Analyse-SDKs von Drittanbietern sind nicht eingebunden. Nach der ersten Anmeldung und nach einer Änderung dieser Datenschutzerklärung zeigt die App einmal einen Hinweis darauf; dass er angezeigt wurde, wird wie auf der Website gespeichert (siehe „Hinweis & Einwilligungen“). Für die Offline-Nutzung legt die App zuletzt geladene Daten (z. B. Stundenplan, Noten, Abwesenheiten, Mensa) im privaten App-Speicher des Geräts ab. Erinnerungen werden als lokale Gerätebenachrichtigungen ausgeliefert (kein Remote-Push). Update-Prüfungen erfolgen über die öffentliche GitHub-API; dabei erhält GitHub technisch bedingt die IP-Adresse, aber keine Konto- oder Schuldaten."
                },
                {
                  "label": "Fehlerberichte (Apps und Verwaltung)",
                  "desc": "Tritt in der iOS- oder Android-App oder im Verwaltungsbereich ein Fehler auf, senden sie einen technischen Fehlerbericht an das POKYH-Backend: die Fehlermeldung und ihren Ablauf (bereinigt um Adressen, Tokens und Suchparameter), die betroffene Seite, die App-Version, die grobe Browser- bzw. App-Familie und deine Schule, ohne IP-Adresse, ohne Konto und ohne vollständige Gerätekennung. Rechtsgrundlage: berechtigtes Interesse an einem funktionierenden, sicheren Dienst (Art. 6 Abs. 1 lit. f DSGVO). Die Berichte werden nach 30 Tagen gelöscht."
                },
                {
                  "label": "Lokaler Speicher (localStorage)",
                  "desc": "Für Einstellungen (Darstellung, Sprache, gewählte Schule und Mensa, Fotos ja/nein, der Fortschritt im versteckten Klassenzimmer der Anmeldeseite) und als Zwischenspeicher zuletzt geladener Schuldaten (Stundenplan, Noten, Abwesenheiten, Nachrichten) für eine schnellere Anzeige wird der Speicher deines Browsers genutzt. Diese Daten verlassen dein Gerät nicht; die einzelnen Einträge stehen in der Cookie-Richtlinie."
                },
                {
                  "label": "Unterstützung über Buy Me a Coffee (freiwillig)",
                  "desc": "Der Link „POKYH unterstützen“ (Einstellungen, Über POKYH) lädt nichts von Buy Me a Coffee, bevor du ihn öffnest; er öffnet sich in einem neuen Tab ohne Referrer. Unterstützt du POKYH dort, ist Buy Me a Coffee für die Zahlung eigenständig verantwortlich; es gelten dessen Bedingungen und Datenschutzhinweise, und Buy Me a Coffee hat seinen Sitz in den USA. Wir erhalten von Buy Me a Coffee nur die Angaben, die du dabei machst (zum Beispiel Name, E-Mail-Adresse, Nachricht und Betrag), keine Zahlungs- oder Kartendaten, und nutzen sie nur, um die Unterstützung zuzuordnen und dir gegebenenfalls zu danken. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO; aufbewahrt, solange gesetzliche, etwa steuerliche, Pflichten es verlangen."
                }
              ]
            }
          ]
        },
        {
          "id": "zwecke",
          "title": "Zwecke und Rechtsgrundlagen",
          "blocks": [
            {
              "p": "Die Verarbeitung erfolgt zur Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO). Notwendige Sicherheitsmaßnahmen (z. B. Netzwerkweiterleitung, Zugriffsprotokolle), die Besucher-Statistik von Website und Apps mit IP-Adresse und die anonyme Nutzungsstatistik stützen sich auf unser berechtigtes Interesse an einem sicheren Betrieb und der Verbesserung des Dienstes (Art. 6 Abs. 1 lit. f DSGVO). Die persönliche Nutzungsstatistik und Google Analytics erfolgen ausschließlich mit deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du im Cookie-Banner („Alle akzeptieren“ oder „Einstellungen“) oder im Profil erteilst und dort jederzeit widerrufen kannst; der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung. Keine der beiden Optionen ist vorausgewählt, und POKYH ist ohne sie uneingeschränkt nutzbar."
            },
            {
              "p": "Die Schulsuche und die Zuordnung deines Kontos zu deiner Schule dienen der Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO). Fotos von anderen Seiten werden aufgrund berechtigten Interesses geladen (Art. 6 Abs. 1 lit. f DSGVO); du kannst jederzeit widersprechen, indem du sie ausblendest (Art. 21 DSGVO)."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Empfänger und Dienste",
          "blocks": [
            {
              "parties": [
                {
                  "name": "Untis GmbH (WebUntis deiner Schule)",
                  "purpose": "Anmeldung und Abruf von Stundenplan, Noten, Abwesenheiten und Nachrichten. Die WebUntis-Daten verantwortet deine Schule; Untis betreibt die Server in ihrem Auftrag in der EU.",
                  "url": "https://www.untis.at/datenschutz-wu-apps"
                },
                {
                  "name": "Untis GmbH (öffentliche Schulsuche)",
                  "purpose": "Suche nach deiner Schule beim Anmelden; Untis erhält nur den Suchbegriff vom POKYH-Server",
                  "url": "https://www.untis.at/datenschutz"
                },
                {
                  "name": "POKYH-Backend",
                  "purpose": "Eigener Server für Konten, Schulen, To-dos, Erinnerungen, Mensa, Kommentare, Benachrichtigungen und Statistik",
                  "url": null
                },
                {
                  "name": "Google Analytics 4 (Google LLC)",
                  "purpose": "Anonymisierte Nutzungsstatistiken zur Verbesserung des Dienstes, nur nach Einwilligung",
                  "url": "https://policies.google.com/privacy"
                },
                {
                  "name": "Cloudflare, Inc.",
                  "purpose": "Netzwerkweiterleitung via Cloudflare Tunnel für den selbst gehosteten Server",
                  "url": "https://www.cloudflare.com/privacypolicy/"
                },
                {
                  "name": "Push-Dienste der Browser-Hersteller",
                  "purpose": "Zustellung von Web-Push-Benachrichtigungen, nur wenn du sie erlaubst",
                  "url": "https://developer.mozilla.org/docs/Web/API/Push_API"
                },
                {
                  "name": "GitHub API (GitHub, Inc.)",
                  "purpose": "Update-Prüfung der mobilen Apps; GitHub erhält dabei technisch bedingt die IP-Adresse, keine Konto- oder Schuldaten",
                  "url": "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                },
                {
                  "name": "Rezeptseiten (Fotos der Gerichte)",
                  "purpose": "Anzeige der Fotos im Mensa-Speiseplan direkt von den Seiten, auf denen sie veröffentlicht sind (abschaltbar mit „Fotos ausblenden“)",
                  "url": null
                },
                {
                  "name": "Buy Me a Coffee",
                  "purpose": "Freiwillige Unterstützung: nur wenn du den Link öffnest und dort unterstützt; für die Zahlung eigenständig verantwortlich",
                  "url": null
                }
              ]
            }
          ]
        },
        {
          "id": "drittlaender",
          "title": "Übermittlung in Drittländer",
          "blocks": [
            {
              "p": "Die Daten aus WebUntis verarbeitet die Untis GmbH nach eigenen Angaben ausschließlich in der EU. Cloudflare, Inc., GitHub, Inc. (nur bei der Update-Prüfung der Apps), Google LLC (nur mit deiner Einwilligung in die Statistik) und die Push-Dienste der Browser-Hersteller (zum Beispiel Google, Apple oder Mozilla; nur wenn du Benachrichtigungen erlaubst) können Daten in den USA verarbeiten; die Übermittlung stützt sich auf den Angemessenheitsbeschluss zum EU-US Data Privacy Framework (Art. 45 DSGVO), nach dem diese Anbieter zertifiziert sind, sowie auf Standardvertragsklauseln (Art. 46 DSGVO). Rezeptseiten, von denen die Fotos des Mensa-Speiseplans stammen, können ihren Sitz außerhalb der EU haben, auch in Ländern ohne Angemessenheitsbeschluss. Dein Browser lädt die Fotos direkt von dort, solange du sie nicht mit „Fotos ausblenden“ abschaltest; dabei erhalten diese Seiten deine IP-Adresse. Möchtest du das nicht, blende die Fotos aus."
            }
          ]
        },
        {
          "id": "speicherdauer",
          "title": "Speicherdauer",
          "blocks": [
            {
              "p": "Anmelde-Cookies werden beim Logout gelöscht und laufen sonst automatisch ab (Sitzung 4 Stunden, API-Token 8 Stunden, Refresh-Token 30 Tage). Todos, Erinnerungen, Mensa-Bewertungen und Kommentare werden auf dem POKYH-Backend gespeichert, bis du sie selbst löschst. Server-Protokolle werden nach 30 Tagen, Datenbank-Sicherungen nach 7 Tagen gelöscht. Die Tagesübersicht deines Kontos (aktive Tage, Gerätetyp, Anmeldungen) bleibt bis zum Ende des laufenden Schuljahres gespeichert; die Nutzungsstatistik nennt dein Konto nur mit Einwilligung und höchstens ebenso lange. Beim Schuljahreswechsel (1. August) werden die Zahlen des Jahres je Konto (aktive Tage, Anmeldungen, mit Einwilligung die Nutzungsdauer) zusammen mit den Konten, Klassen, Todos und Erinnerungen des abgelaufenen Schuljahres in ein Schuljahresarchiv übernommen, das nur Administratoren einsehen können; die Einträge des Jahres werden danach gelöscht. Seitenaufrufe werden nach 30 Tagen gelöscht; danach (und bei anonymen Besuchen, sobald die Server-Protokolle gelöscht sind) lässt sich kein Eintrag mehr einer Person zuordnen, und er bleibt nur als anonyme Statistik erhalten. Bei Website- und App-Besuchen werden IP-Adresse, Ort, Kontoschlüssel, Besuchs-ID und (mit Einwilligung) dein Konto nach 30 Tagen entfernt; übrig bleibt eine anonyme Zählung nach Land, Gerätetyp, Seite bzw. App-Version, Tag und Stunde. Abgeschlossene Todos werden nach 24 Stunden automatisch ausgeblendet. Google Analytics-Daten werden, sofern du zugestimmt hast, nach 14 Monaten gelöscht. Meldungen von Inhalten werden aufbewahrt, bis der Fall erledigt ist, danach höchstens 6 Monate. Das Protokoll der Verwaltung wird nach 365 Tagen gelöscht, Fehlerberichte der Apps nach 30 Tagen. Der Fortschritt im versteckten Klassenzimmer liegt nur in deinem Browser, bis du ihn dort löschst."
            },
            {
              "p": "Die gewählte Schule bleibt in deinem Browser bis zum 31. August des laufenden Schuljahres, mindestens 30 Tage. Die für Push-Benachrichtigungen gespeicherte WebUntis-Sitzung ist nur gültig, bis WebUntis sie beendet, und wird mit der Push-Adresse gelöscht. Die Zuordnung deines Kontos zu deiner Schule wird mit deinem Konto gelöscht. Zwischengespeicherte Treffer der Schulsuche verfallen nach 10 Minuten."
            }
          ]
        },
        {
          "id": "minderjaehrige",
          "title": "Kinder und Jugendliche",
          "blocks": [
            {
              "p": "POKYH ist für Personen ab 14 Jahren. Jüngere dürfen POKYH nur mit dem Einverständnis ihrer Eltern nutzen. Einwilligungen (persönliche Nutzungsstatistik, Statistik-Cookies) können in Italien erst ab 14 Jahren selbst erteilt werden (Art. 8 DSGVO, Art. 2-quinquies Codice in materia di protezione dei dati personali); darunter nur durch die Eltern. Erfahren wir, dass Daten eines Kindes ohne diese Zustimmung verarbeitet werden, löschen wir sie."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "Deine Rechte",
          "blocks": [
            {
              "p": "Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:"
            },
            {
              "list": [
                "Auskunft (Art. 15 DSGVO)",
                "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
                "Löschung / Recht auf Vergessenwerden (Art. 17 DSGVO)",
                "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
                "Datenübertragbarkeit (Art. 20 DSGVO)",
                "Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO)",
                "Widerruf einer Einwilligung"
              ]
            },
            {
              "contact": "privacy"
            },
            {
              "complaint": "Beschwerde bei der zuständigen Aufsichtsbehörde: Garante per la protezione dei dati personali (Italien),"
            }
          ]
        },
        {
          "id": "pflicht",
          "title": "Pflicht zur Angabe und automatisierte Entscheidungen",
          "blocks": [
            {
              "p": "Du musst POKYH keine Daten geben. Ohne deine WebUntis-Zugangsdaten kann POKYH aber keine Daten aus WebUntis anzeigen. Es gibt keine automatisierte Entscheidungsfindung und kein Profiling im Sinne von Art. 22 DSGVO."
            }
          ]
        },
        {
          "id": "sicherheit",
          "title": "Datensicherheit",
          "blocks": [
            {
              "p": "Alle Verbindungen erfolgen über HTTPS/TLS (bereitgestellt via Cloudflare Tunnel). WebUntis-Session-Tokens werden serverseitig AES-GCM-verschlüsselt und ausschließlich in httpOnly-Cookies gespeichert (kein JavaScript-Zugriff). Passwörter werden nie auf POKYH-Servern gespeichert. Eingaben werden serverseitig validiert. Der Server wird auf privater Hardware betrieben und ist ausschließlich über den verschlüsselten Cloudflare-Tunnel zugänglich."
            }
          ]
        },
        {
          "id": "cookies",
          "title": "Cookies und lokaler Speicher",
          "blocks": [
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Verschlüsseltes Schulportal-Session-Token (httpOnly, AES-GCM, 4 Stunden)"
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Nicht-sensible Benutzerinfo zur Anzeige (kein Token, kein Passwort, 4 Stunden, bei einem POKYH-Konto ohne Schulkonto 8 Stunden)"
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "POKYH Backend JWT für API-Zugriff (nicht httpOnly, 8 Stunden)"
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "POKYH Backend Refresh-Token zum automatischen Erneuern des API-Tokens (httpOnly, 30 Tage)"
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Zugangsdaten und gewählte Schule zur automatischen Sitzungserneuerung, AES-GCM-verschlüsselt (httpOnly, nur an die Anmeldeadresse gesendet, nur zusammen mit der Sitzung gültig, 4 Stunden, beim Abmelden gelöscht)"
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "Die beim Anmelden gewählte Schule (localStorage, bis zum 31. August, mindestens 30 Tage)"
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Merkt sich, wenn du Fotos von anderen Seiten ausgeblendet hast (localStorage, bis du sie wieder einblendest)"
                },
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Gespeichertes Farbschema (localStorage, kein Cookie)"
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Sidebar-Status (localStorage, kein Cookie)"
                },
                {
                  "name": "passkey_declined",
                  "kind": "setting",
                  "desc": "Merkt sich, dass du das Speichern der Anmeldung im Browser abgelehnt hast (Cookie, 1 Jahr)"
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Zwischenspeicher zuletzt geladener Schuldaten für schnellere Anzeige (localStorage, verlässt das Gerät nicht, beim Abmelden gelöscht)"
                },
                {
                  "name": "_ga, _ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: anonymisierte Nutzungsstatistiken (nur bei Einwilligung), 1-2 Jahre Laufzeit"
                }
              ]
            },
            {
              "link": {
                "view": "cookies",
                "label": "Cookies und Speicher"
              }
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Änderungen",
          "blocks": [
            {
              "p": "Diese Datenschutzerklärung wird angepasst, wenn sich POKYH oder die Rechtslage ändert. Die aktuelle Fassung steht immer unter pokyh.com/legal. Über wesentliche Änderungen informiert POKYH nach der Anmeldung."
            }
          ]
        }
      ]
    },
    "it": {
      "title": "Informativa sulla privacy",
      "lead": "Quali dati tratta POKYH, perché, per quanto tempo e i tuoi diritti",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Titolare del trattamento",
          "blocks": [
            {
              "p": "Titolare del trattamento ai sensi del Regolamento generale sulla protezione dei dati (UE) 2016/679 (GDPR) è:"
            },
            {
              "identity": "controller"
            },
            {
              "p": "Non è stato nominato un responsabile della protezione dei dati, perché non ricorrono i presupposti di legge. Per qualsiasi domanda sulla privacy puoi contattare il titolare all’indirizzo indicato sopra."
            }
          ]
        },
        {
          "id": "kurz",
          "title": "In breve",
          "blocks": [
            {
              "list": [
                "POKYH è gratuita, senza pubblicità e non vende dati.",
                "La tua password WebUntis va solo al server WebUntis della tua scuola e non viene salvata sui server di POKYH.",
                "I dati di WebUntis (orario, voti, assenze, messaggi) vengono richiesti solo per mostrarli e non vengono conservati in modo permanente sui server di POKYH.",
                "Le statistiche facoltative ci sono solo con il tuo consenso, revocabile in qualsiasi momento. Le foto da altri siti si possono nascondere in qualsiasi momento.",
                "Puoi chiedere in qualsiasi momento accesso, cancellazione e altro; basta un’e-mail."
              ]
            }
          ]
        },
        {
          "id": "daten",
          "title": "Quali dati tratta POKYH",
          "blocks": [
            {
              "items": [
                {
                  "label": "Credenziali scolastiche (accesso a WebUntis)",
                  "desc": "Nome utente e password vengono usati solo per accedere al server WebUntis della scuola che hai scelto; questi server sono gestiti da Untis GmbH per conto della rispettiva scuola. Sui server di POKYH la password non viene salvata né registrata. Per rinnovare automaticamente una sessione chiusa da WebUntis, credenziali e scuola scelta sono salvate sul tuo dispositivo, cifrate con AES-GCM, in un cookie httpOnly (pokyh_renew); viene inviato solo all’indirizzo di accesso, vale solo insieme alla tua sessione, scade dopo 4 ore e viene eliminato al logout. Anche la sessione WebUntis è cifrata con AES-GCM in un cookie httpOnly. L’accesso consiste solo di questi cookie: se li elimini, sei disconnesso. Base giuridica: fornitura del servizio da te richiesto (art. 6, par. 1, lett. b GDPR)."
                },
                {
                  "label": "Cookie di sessione (pokyh_session)",
                  "desc": "Cookie httpOnly cifrato contenente il token di sessione del portale scolastico. Scade al logout o dopo 4 ore. Non accessibile da JavaScript (protezione XSS)."
                },
                {
                  "label": "Account POKYH (accesso alternativo)",
                  "desc": "Chi non ha un account scolastico può registrarsi con un account proprio di POKYH (nome utente + password). La password viene memorizzata con hash bcrypt. Una password in chiaro non viene mai salvata."
                },
                {
                  "label": "Cookie utente (pokyh_user)",
                  "desc": "Contiene informazioni di visualizzazione non sensibili (nome utente, classe, scuola) per la presentazione nell’app. Nessuna password, nessun token."
                },
                {
                  "label": "Ricerca della scuola e scuola scelta",
                  "desc": "Per trovare la tua scuola, il server di POKYH invia il termine di ricerca (nome, città o CAP di una scuola) alla ricerca pubblica delle scuole di WebUntis (Untis GmbH). Untis riceve solo il termine di ricerca e l’indirizzo del server di POKYH, non il tuo indirizzo IP. I risultati restano fino a 10 minuti nella memoria di lavoro del server e non vengono associati a nessuno. La scuola scelta (nome di accesso, nome, indirizzo e server secondo WebUntis) viene salvata dal tuo browser fino alla fine dell’anno scolastico (31 agosto, almeno 30 giorni) come pokyh_school, così non devi cercarla ogni volta; puoi cambiarla in qualsiasi momento all’accesso. Dopo l’accesso il backend di POKYH associa il tuo account a questa scuola (nome di accesso, nome e server della scuola), così classi, promemoria, commenti e menù restano separati per scuola; quando qualcuno di una scuola accede per la prima volta, la scuola viene creata. Base giuridica: art. 6, par. 1, lett. b GDPR."
                },
                {
                  "label": "Backend POKYH (cose da fare e promemoria)",
                  "desc": "Le attività e i promemoria di classe vengono salvati sul backend proprio di POKYH: titolo, dettagli, timestamp, nome utente. Puoi eliminarli tu stesso in qualsiasi momento. Per queste funzioni non vengono utilizzati servizi cloud esterni."
                },
                {
                  "label": "Valutazioni e commenti della mensa",
                  "desc": "Quando valuti o commenti un piatto, il backend di POKYH salva la valutazione in stelle o il testo del commento, il nome utente, l’ID utente interno e la data. I commenti sono visibili con il tuo nome utente agli altri utenti registrati; le valutazioni compaiono solo come media e numero. Puoi eliminare i tuoi commenti in qualsiasi momento."
                },
                {
                  "label": "Segnalazioni di contenuti (Digital Services Act)",
                  "desc": "Se segnali un commento o un altro contenuto (con «Segnala» o via e-mail), trattiamo la tua segnalazione: il tuo nome e il tuo indirizzo e-mail, se li indichi, il contenuto segnalato e la tua motivazione. Ci servono per esaminare la segnalazione, risponderti e motivare la nostra decisione. Non comunichiamo il tuo nome alla persona il cui contenuto è stato segnalato. Base giuridica: obbligo legale (art. 6, par. 1, lett. c GDPR in combinato disposto con gli artt. 16 e 17 del regolamento (UE) 2022/2065). Conservazione: fino alla chiusura del caso, poi al massimo 6 mesi per domande e reclami."
                },
                {
                  "label": "Notifiche push (sito web, facoltative)",
                  "desc": "Solo se consenti le notifiche nel browser: il backend di POKYH salva l’indirizzo push (endpoint) del tuo browser con il tuo ID utente. Per informarti dei nuovi messaggi WebUntis salva inoltre la tua sessione WebUntis attuale (identificativo di sessione e token di accesso, non la password) e chiede con essa circa ogni 5 minuti al server WebUntis della tua scuola quanti messaggi non sono letti. I contenuti dei messaggi non vengono salvati. La richiesta termina quando WebUntis chiude la sessione. Le notifiche vengono recapitate tramite il servizio push del produttore del browser (ad es. Google, Mozilla o Apple). Puoi revocarle in qualsiasi momento nelle impostazioni del browser; l’indirizzo push viene allora cancellato."
                },
                {
                  "label": "Foto da altri siti (mensa)",
                  "desc": "Le foto dei piatti nel menù della mensa si trovano su siti di ricette di terzi e vengono mostrate da lì; POKYH non le copia. Il browser le carica direttamente da questi siti, che ricevono come per ogni visita il tuo indirizzo IP e dati tecnici del browser (ad es. il tipo di browser), senza referrer, cioè senza l’indirizzo della pagina di POKYH. Cosa fanno questi siti con i dati, ad esempio se impostano cookie, dipende da loro; molti browser bloccano i cookie di siti terzi. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR) a mostrare il menù in modo chiaro. Puoi opporti in qualsiasi momento (art. 21 GDPR): con «Nascondi le foto» nella pagina della mensa il browser non carica più foto di terzi; la scelta viene salvata come pokyh_external_media."
                },
                {
                  "label": "Google Analytics 4 (GA4)",
                  "desc": "Questo sito può utilizzare Google Analytics 4 (Google LLC), ma solo previo tuo consenso esplicito espresso nel banner dei cookie; prima non viene stabilita alcuna connessione con Google. GA4 raccoglie dati d’uso pseudonimizzati (visualizzazioni di pagina, categoria del dispositivo, paese di origine approssimativo) e a tal fine imposta i cookie _ga e _ga_*. Secondo Google, GA4 non memorizza indirizzi IP; i segnali Google e le funzioni pubblicitarie sono disattivati. Base giuridica: il tuo consenso (art. 6, par. 1, lett. a GDPR, art. 122 Codice privacy). Puoi revocarlo in qualsiasi momento nelle impostazioni dei cookie; i cookie vengono allora cancellati. Puoi inoltre opporti alla raccolta dati su tools.google.com/dlpage/gaoptout."
                },
                {
                  "label": "Cloudflare Tunnel (Cloudflare, Inc.)",
                  "desc": "Per la raggiungibilità pubblica del server autogestito viene utilizzato Cloudflare Tunnel. Cloudflare tratta metadati di rete (indirizzi IP, intestazioni delle richieste) per l’inoltro del traffico. Nessun contenuto viene conservato in modo permanente. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR) per la gestione sicura del server. Cloudflare ci trasmette inoltre il paese ricavato dall’indirizzo IP (eventualmente regione e città), che usiamo per la statistica dei visitatori del sito e delle app; non avviene alcuna localizzazione presso altri fornitori."
                },
                {
                  "label": "Registrazione dei log del server (request log)",
                  "desc": "Il server backend di POKYH registra automaticamente i log di accesso: indirizzo IP, metodo HTTP, percorso richiesto, codice di stato HTTP, durata della risposta, nome utente e user agent. Finalità: sicurezza, diagnosi degli errori e rilevamento degli abusi. Inoltre ne ricaviamo, senza nomi, quanti account sono stati attivi ogni giorno e negli ultimi 7 o 30 giorni e se hanno usato l’app iOS, l’app Android o il sito. Per il tuo account viene annotato giorno per giorno se hai usato POKYH, con quale tipo di dispositivo (app iOS, app Android, sito da telefono o computer) e quante volte hai effettuato l’accesso, senza indirizzo IP e senza pagine visitate; questo riepilogo giornaliero lo vedi tu stesso nel tuo profilo. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR). I log vengono cancellati al più tardi dopo 30 giorni, il riepilogo giornaliero del tuo account alla fine dell’anno scolastico (vedi Periodo di conservazione)."
                },
                {
                  "label": "Registro delle attività di amministrazione",
                  "desc": "Se gli amministratori modificano qualcosa che riguarda il tuo account o i tuoi contenuti (ad esempio rimuovono un commento o assegnano diritti), il backend di POKYH registra chi ha modificato cosa e quando e quale account o contenuto è interessato, senza password o altri segreti. Finalità: tracciabilità e protezione dagli abusi. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR) e principio di responsabilizzazione (art. 5, par. 2 GDPR). Le voci vengono cancellate dopo 365 giorni."
                },
                {
                  "label": "Statistiche di utilizzo (app e sito)",
                  "desc": "Finché hai effettuato l’accesso e POKYH è aperto in primo piano, l’app iOS, l’app Android e il sito comunicano al backend di POKYH circa ogni 30-60 secondi per quanto tempo POKYH è stato usato e quante schermate sono state aperte. Per ogni visita vengono salvati: un ID di visita casuale, la piattaforma (app iOS, app Android o sito, per il sito anche smartphone o computer e se è installato come web app), la versione dell’app, giorno e ora, la durata d’uso e il numero di schermate aperte. Insieme a questi dati non vengono salvati indirizzo IP, user agent, contenuti o dati inseriti; nel browser o sul dispositivo non viene memorizzato nulla. Senza consenso (anonimo): al posto del tuo account la visita contiene solo una chiave giornaliera, un valore hash del tuo ID account e di un valore casuale che viene cancellato alla fine della giornata. Così si può contare quante persone diverse hanno usato POKYH in un giorno senza sapere chi, e i giorni non possono essere collegati tra loro. Le visualizzazioni di pagina del sito contano inoltre come visita al sito, l’apertura di un’app come visita all’app, a questo scopo l’indirizzo IP viene salvato separatamente dalle statistiche di utilizzo (vedi «Visitatori del sito e delle app»). Per ogni classe e giorno viene inoltre sommato soltanto per quanto tempo e da quante persone è stato usato POKYH (senza nomi; una classe viene mostrata solo a partire da 5 giorni-persona). I dati vengono analizzati solo in forma aggregata (ad es. utenti per piattaforma, durata media d’uso, orari di punta), visibili esclusivamente agli amministratori. Base giuridica: legittimo interesse al funzionamento e al miglioramento del servizio (art. 6, par. 1, lett. f GDPR); puoi opporti in qualsiasi momento (art. 21 GDPR): basta un breve messaggio al contatto indicato sopra. I browser con «Global Privacy Control» attivo non inviano statistiche di utilizzo. Con consenso (personale, «Accetta tutto» o profilo): la visita viene inoltre associata al tuo account e gli amministratori possono vedere per il tuo account quale piattaforma e versione dell’app usi, quando sei stato attivo l’ultima volta, per quanto tempo, quanto spesso e in quanti giorni hai usato POKYH, quali pagine hai aperto e da quali indirizzi IP e luoghi hai usato il sito e le app (ad es. per il supporto o per segnalare versioni dell’app obsolete). Base giuridica: il tuo consenso (art. 6, par. 1, lett. a GDPR); sotto i 14 anni solo con il permesso dei genitori (art. 8 GDPR, art. 2-quinquies Codice privacy). Puoi revocarlo in qualsiasi momento nel profilo o nelle impostazioni dei cookie; il tuo nome viene allora rimosso da tutti i dati raccolti finora. Questi dati non vengono ceduti a terzi, non vengono usati per pubblicità e non vengono collegati a voti o altri dati scolastici."
                },
                {
                  "label": "Visitatori del sito e delle app (portata e sicurezza)",
                  "desc": "A ogni visualizzazione di pagina del sito (con o senza account) il backend di POKYH salva: l’indirizzo IP, il paese ricavato da Cloudflare dall’indirizzo IP (e, se trasmessi, regione e città), il tipo di dispositivo (smartphone, tablet, computer), la pagina aperta, data e ora e se avevi effettuato l’accesso. Allo stesso modo, nell’app iOS e Android (che inviano dati d’uso solo ad accesso effettuato) salva ogni apertura dell’app una volta per indirizzo IP e giorno: l’indirizzo IP, il paese (e, se trasmessi, regione e città), il dispositivo (iPhone o Android), la versione dell’app, data e ora e l’ID di visita casuale delle statistiche di utilizzo, così che una visita venga contata una sola volta. L’app non invia nulla in più; viene usato l’indirizzo da cui arrivano comunque le statistiche di utilizzo. Se hai effettuato l’accesso si aggiunge una chiave pseudonima dell’account (un valore hash calcolato con un segreto del server, senza nome), per contare quanti account diversi usano un indirizzo IP, ad esempio in una rete scolastica. I visitatori diversi al giorno vengono contati tramite una chiave giornaliera (ricavata dal tuo account se hai effettuato l’accesso, altrimenti da indirizzo IP e identificativo del browser) che alla fine della giornata non è più riconducibile. Finalità: sapere quante persone raggiunge il sito e da dove provengono, nonché riconoscere abusi, bot e attacchi. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR); puoi opporti in qualsiasi momento (art. 21 GDPR): basta un breve messaggio al contatto indicato sopra. Se hai acconsentito alle statistiche di utilizzo personali, la visita viene inoltre associata al tuo account, così gli amministratori vedono il tuo nome presso l’indirizzo IP (art. 6, par. 1, lett. a GDPR); senza consenso non viene salvato alcun nome, dopo la revoca viene rimosso. Indirizzo IP, luogo, chiave dell’account, ID di visita e account vengono cancellati dopo 30 giorni; resta solo un conteggio anonimo per paese, tipo di dispositivo, pagina o versione dell’app, giorno e ora. I browser con «Global Privacy Control» attivo vengono contati senza indirizzo IP e account. I dati sono visibili esclusivamente agli amministratori; non vengono ceduti a terzi né usati per pubblicità."
                },
                {
                  "label": "Informativa e consensi",
                  "desc": "Per il tuo account salviamo quale versione di questa informativa ti è stata mostrata e quando (all’accesso o dopo una modifica, sul sito o nell’app), e se e quando hai dato o revocato il consenso alle statistiche di utilizzo personali, come prova (art. 5, par. 2, art. 7, par. 1 GDPR). La visualizzazione non è un consenso. I dati vengono cancellati insieme al tuo account. La tua scelta nel banner dei cookie viene inoltre salvata sul tuo dispositivo (vedi Cookie)."
                },
                {
                  "label": "App mobile (iOS e Android)",
                  "desc": "Le app native di POKYH memorizzano le credenziali esclusivamente in forma cifrata sul dispositivo (Keychain di iOS o con una chiave dell’Android Keystore), per poter rinnovare l’accesso; non vengono salvate sui server di POKYH. La sincronizzazione con iCloud è disattivata. Oltre alle statistiche di utilizzo e alla statistica dei visitatori dell’app descritte sopra, l’app non raccoglie dati di analisi; non sono integrati SDK di analisi di terze parti. Dopo il primo accesso e dopo una modifica di questa informativa l’app mostra una volta un avviso; il fatto che sia stato mostrato viene salvato come sul sito (vedi «Informativa e consensi»). Per l’uso offline l’app conserva gli ultimi dati caricati (ad es. orario, voti, assenze, mensa) nella memoria privata dell’app sul dispositivo. I promemoria vengono recapitati come notifiche locali del dispositivo (nessun push remoto). I controlli degli aggiornamenti avvengono tramite l’API pubblica di GitHub; per motivi tecnici GitHub riceve l’indirizzo IP, ma nessun dato dell’account o scolastico."
                },
                {
                  "label": "Segnalazioni di errore (app e amministrazione)",
                  "desc": "Se nell’app iOS o Android o nell’area di amministrazione si verifica un errore, queste inviano una segnalazione tecnica al backend di POKYH: il messaggio di errore e il suo svolgimento (ripuliti da indirizzi, token e parametri di ricerca), la pagina interessata, la versione dell’app, la famiglia approssimativa di browser o app e la tua scuola, senza indirizzo IP, senza account e senza identificativo completo del dispositivo. Base giuridica: legittimo interesse a un servizio funzionante e sicuro (art. 6, par. 1, lett. f GDPR). Le segnalazioni vengono cancellate dopo 30 giorni."
                },
                {
                  "label": "Memoria locale (localStorage)",
                  "desc": "La memoria del browser viene usata per le impostazioni (aspetto, lingua, scuola e mensa scelte, foto sì/no, i progressi nell’aula nascosta della pagina di accesso) e come memoria temporanea degli ultimi dati scolastici caricati (orario, voti, assenze, messaggi) per una visualizzazione più rapida. Questi dati non lasciano il dispositivo; le singole voci sono elencate nell’informativa sui cookie."
                },
                {
                  "label": "Sostegno tramite Buy Me a Coffee (volontario)",
                  "desc": "Il link «Sostieni POKYH» (impostazioni, Chi siamo) non carica nulla da Buy Me a Coffee prima che tu lo apra; si apre in una nuova scheda senza referrer. Se sostieni POKYH lì, Buy Me a Coffee è titolare autonomo del pagamento; valgono le sue condizioni e la sua informativa privacy, e Buy Me a Coffee ha sede negli Stati Uniti. Da Buy Me a Coffee riceviamo solo i dati che indichi (ad esempio nome, indirizzo e-mail, messaggio e importo), nessun dato di pagamento o di carta, e li usiamo solo per attribuire il sostegno ed eventualmente ringraziarti. Base giuridica: art. 6, par. 1, lett. b GDPR; conservati finché lo richiedono obblighi di legge, ad esempio fiscali."
                }
              ]
            }
          ]
        },
        {
          "id": "zwecke",
          "title": "Finalità e basi giuridiche",
          "blocks": [
            {
              "p": "Il trattamento avviene per l’erogazione del servizio (art. 6, par. 1, lett. b GDPR). Le misure di sicurezza necessarie (ad es. inoltro di rete, log di accesso), la statistica dei visitatori del sito e delle app con indirizzo IP e le statistiche di utilizzo anonime si basano sul nostro legittimo interesse a un funzionamento sicuro e al miglioramento del servizio (art. 6, par. 1, lett. f GDPR). Le statistiche di utilizzo personali e Google Analytics avvengono esclusivamente con il tuo consenso (art. 6, par. 1, lett. a GDPR), che dai nel banner dei cookie («Accetta tutto» o «Impostazioni») o nel profilo e che puoi revocare lì in qualsiasi momento; la revoca non pregiudica la liceità del trattamento effettuato prima. Nessuna delle due opzioni è preselezionata e POKYH è pienamente utilizzabile anche senza."
            },
            {
              "p": "La ricerca della scuola e l’associazione del tuo account alla scuola servono alla fornitura del servizio (art. 6, par. 1, lett. b GDPR). Le foto da altri siti vengono caricate sulla base del legittimo interesse (art. 6, par. 1, lett. f GDPR); puoi opporti in qualsiasi momento nascondendole (art. 21 GDPR)."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Destinatari e servizi",
          "blocks": [
            {
              "parties": [
                {
                  "name": "Untis GmbH (WebUntis della tua scuola)",
                  "purpose": "Accesso e richiesta di orario, voti, assenze e messaggi. Dei dati WebUntis è titolare la tua scuola; Untis gestisce i server per suo conto nell’UE.",
                  "url": "https://www.untis.at/en/privacy-policy-wu-apps"
                },
                {
                  "name": "Untis GmbH (ricerca pubblica delle scuole)",
                  "purpose": "Ricerca della tua scuola all’accesso; Untis riceve solo il termine di ricerca dal server di POKYH",
                  "url": "https://www.untis.at/en/privacy-policy"
                },
                {
                  "name": "Backend POKYH",
                  "purpose": "Server proprio per account, scuole, to-do, promemoria, mensa, commenti, notifiche e statistiche",
                  "url": null
                },
                {
                  "name": "Google Analytics 4 (Google LLC)",
                  "purpose": "Statistiche d’uso anonimizzate per migliorare il servizio, solo previo consenso",
                  "url": "https://policies.google.com/privacy"
                },
                {
                  "name": "Cloudflare, Inc.",
                  "purpose": "Instradamento di rete tramite Cloudflare Tunnel per il server autogestito",
                  "url": "https://www.cloudflare.com/privacypolicy/"
                },
                {
                  "name": "Servizi push dei produttori di browser",
                  "purpose": "Recapito delle notifiche web push: solo se le consenti",
                  "url": "https://developer.mozilla.org/docs/Web/API/Push_API"
                },
                {
                  "name": "API GitHub (GitHub, Inc.)",
                  "purpose": "Verifica degli aggiornamenti delle app; GitHub riceve per motivi tecnici l’indirizzo IP, nessun dato dell’account o della scuola",
                  "url": "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                },
                {
                  "name": "Siti di ricette (foto dei piatti)",
                  "purpose": "Foto nel menù della mensa caricate direttamente dai siti che le pubblicano (disattivabili con «Nascondi le foto»)",
                  "url": null
                },
                {
                  "name": "Buy Me a Coffee",
                  "purpose": "Sostegno volontario: solo se apri il link e sostieni lì; titolare autonomo del pagamento",
                  "url": null
                }
              ]
            }
          ]
        },
        {
          "id": "drittlaender",
          "title": "Trasferimento verso paesi terzi",
          "blocks": [
            {
              "p": "Secondo quanto dichiara, Untis GmbH tratta i dati di WebUntis esclusivamente nell’UE. Cloudflare, Inc., GitHub, Inc. (solo per la verifica degli aggiornamenti delle app), Google LLC (solo con il tuo consenso alla statistica) e i servizi push dei produttori di browser (ad esempio Google, Apple o Mozilla; solo se consenti le notifiche) possono trattare dati negli Stati Uniti; il trasferimento si basa sulla decisione di adeguatezza relativa al Data Privacy Framework UE-USA (art. 45 GDPR), secondo cui questi fornitori sono certificati, e sulle clausole contrattuali standard (art. 46 GDPR). I siti di ricette da cui provengono le foto del menù della mensa possono avere sede fuori dall’UE, anche in paesi senza decisione di adeguatezza. Il tuo browser carica le foto direttamente da lì finché non le disattivi con «Nascondi le foto»; questi siti ricevono così il tuo indirizzo IP. Se non lo desideri, nascondi le foto."
            }
          ]
        },
        {
          "id": "speicherdauer",
          "title": "Periodo di conservazione",
          "blocks": [
            {
              "p": "I cookie di accesso vengono eliminati al logout e altrimenti scadono automaticamente (sessione 4 ore, token API 8 ore, token di refresh 30 giorni). Attività, promemoria, valutazioni e commenti della mensa restano sul backend di POKYH finché non li elimini tu stesso. I log del server vengono cancellati dopo 30 giorni, i backup del database dopo 7 giorni. Il riepilogo giornaliero del tuo account (giorni attivi, tipo di dispositivo, accessi) resta salvato fino alla fine dell’anno scolastico in corso; le statistiche di utilizzo indicano il tuo account solo con il consenso e al massimo per lo stesso periodo. Al cambio di anno scolastico (1° agosto) i dati dell’anno per ogni account (giorni attivi, accessi, con il consenso la durata d’uso) passano, insieme agli account, alle classi, alle attività e ai promemoria dell’anno concluso, in un archivio dell’anno scolastico consultabile solo dagli amministratori; le voci dell’anno vengono poi cancellate. Le visualizzazioni di pagina vengono cancellate dopo 30 giorni. Dopo (e per le visite anonime, non appena i log del server sono stati cancellati) nessuna voce può più essere ricondotta a una persona e resta solo come statistica anonima. Per le visite al sito e alle app indirizzo IP, luogo, chiave dell’account, ID di visita e (con il consenso) il tuo account vengono rimossi dopo 30 giorni; resta un conteggio anonimo per paese, tipo di dispositivo, pagina o versione dell’app, giorno e ora. Le attività completate vengono nascoste automaticamente dopo 24 ore. I dati di Google Analytics vengono cancellati, se hai prestato il consenso, dopo 14 mesi. Le segnalazioni di contenuti vengono conservate fino alla chiusura del caso, poi al massimo 6 mesi. Il registro delle attività di amministrazione viene cancellato dopo 365 giorni, le segnalazioni di errore delle app dopo 30 giorni. I progressi nell’aula nascosta restano solo nel tuo browser finché non li cancelli lì."
            },
            {
              "p": "La scuola scelta resta nel browser fino al 31 agosto dell’anno scolastico in corso, per almeno 30 giorni. La sessione WebUntis salvata per le notifiche push è valida solo finché WebUntis non la chiude e viene cancellata insieme all’indirizzo push. L’associazione del tuo account alla scuola viene cancellata con il tuo account. I risultati della ricerca delle scuole in memoria scadono dopo 10 minuti."
            }
          ]
        },
        {
          "id": "minderjaehrige",
          "title": "Minori",
          "blocks": [
            {
              "p": "POKYH è per persone dai 14 anni in su. I più giovani possono usare POKYH solo con il consenso dei genitori. In Italia il consenso (statistiche personali di utilizzo, cookie statistici) si può dare da soli solo dai 14 anni (art. 8 GDPR, art. 2-quinquies Codice in materia di protezione dei dati personali); sotto questa età solo tramite i genitori. Se veniamo a sapere che dati di un minore sono trattati senza questo consenso, li cancelliamo."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "I tuoi diritti",
          "blocks": [
            {
              "p": "Hai i seguenti diritti riguardo ai tuoi dati personali:"
            },
            {
              "list": [
                "Accesso (art. 15 GDPR)",
                "Rettifica dei dati inesatti (art. 16 GDPR)",
                "Cancellazione / diritto all’oblio (art. 17 GDPR)",
                "Limitazione del trattamento (art. 18 GDPR)",
                "Portabilità dei dati (art. 20 GDPR)",
                "Opposizione al trattamento basato sul legittimo interesse (art. 21 GDPR)",
                "Revoca del consenso"
              ]
            },
            {
              "contact": "privacy"
            },
            {
              "complaint": "Reclamo all’autorità di controllo competente: Garante per la protezione dei dati personali,"
            }
          ]
        },
        {
          "id": "pflicht",
          "title": "Obbligo di fornire i dati e decisioni automatizzate",
          "blocks": [
            {
              "p": "Non sei obbligato a fornire dati a POKYH. Senza le credenziali WebUntis, però, POKYH non può mostrare i dati di WebUntis. Non ci sono processi decisionali automatizzati né profilazione ai sensi dell’art. 22 GDPR."
            }
          ]
        },
        {
          "id": "sicherheit",
          "title": "Sicurezza dei dati",
          "blocks": [
            {
              "p": "Tutte le connessioni avvengono tramite HTTPS/TLS (fornito tramite Cloudflare Tunnel). I token di sessione WebUntis vengono cifrati lato server con AES-GCM e conservati esclusivamente in cookie httpOnly (nessun accesso da JavaScript). Le password non vengono mai salvate sui server di POKYH. Gli input vengono validati lato server. Il server è gestito su hardware privato ed è raggiungibile esclusivamente tramite il tunnel Cloudflare cifrato."
            }
          ]
        },
        {
          "id": "cookies",
          "title": "Cookie e memoria locale",
          "blocks": [
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Token di sessione cifrato del portale scolastico (httpOnly, AES-GCM, 4 ore)"
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Informazioni utente non sensibili per la visualizzazione (nessun token, nessuna password, 4 ore, con un account POKYH senza account scolastico 8 ore)"
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "JWT del backend POKYH per l’accesso alle API (non httpOnly, 8 ore)"
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "Token di refresh del backend POKYH per rinnovare automaticamente il token API (httpOnly, 30 giorni)"
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Credenziali e scuola scelta per il rinnovo automatico della sessione, cifrate con AES-GCM (httpOnly, inviato solo all’indirizzo di accesso, valido solo insieme alla sessione, 4 ore, eliminato al logout)"
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "La scuola scelta all’accesso (localStorage, fino al 31 agosto, almeno 30 giorni)"
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Ricorda se hai nascosto le foto da altri siti (localStorage, finché non le mostri di nuovo)"
                },
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Schema colori salvato (localStorage, non è un cookie)"
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Stato della barra laterale (localStorage, non è un cookie)"
                },
                {
                  "name": "passkey_declined",
                  "kind": "setting",
                  "desc": "Ricorda che hai rifiutato di salvare l’accesso nel browser (cookie, 1 anno)"
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Memoria temporanea degli ultimi dati scolastici caricati per una visualizzazione più rapida (localStorage, non lascia il dispositivo, eliminata al logout)"
                },
                {
                  "name": "_ga, _ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: statistiche d’uso anonimizzate (solo con consenso), durata 1-2 anni"
                }
              ]
            },
            {
              "link": {
                "view": "cookies",
                "label": "Cookie e memoria"
              }
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Modifiche",
          "blocks": [
            {
              "p": "Questa informativa viene aggiornata quando cambiano POKYH o la normativa. La versione attuale è sempre su pokyh.com/legal. Delle modifiche importanti POKYH informa dopo l’accesso."
            }
          ]
        }
      ]
    },
    "en": {
      "title": "Privacy notice",
      "lead": "Which data POKYH processes, why, for how long and your rights",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Controller",
          "blocks": [
            {
              "p": "The controller within the meaning of the General Data Protection Regulation (EU) 2016/679 (GDPR) is:"
            },
            {
              "identity": "controller"
            },
            {
              "p": "No data protection officer has been appointed, as the legal requirements for one are not met. For any privacy question you can reach the controller at the address above."
            }
          ]
        },
        {
          "id": "kurz",
          "title": "In short",
          "blocks": [
            {
              "list": [
                "POKYH is free, ad-free and does not sell data.",
                "Your WebUntis password only goes to your school’s WebUntis server and is not stored on POKYH servers.",
                "Data from WebUntis (timetable, grades, absences, messages) is fetched only to show it and is not kept permanently on POKYH servers.",
                "Optional statistics are only used with your consent, which you can withdraw at any time. Photos from other sites can be hidden at any time.",
                "You can ask for access, deletion and more at any time; an e-mail is enough."
              ]
            }
          ]
        },
        {
          "id": "daten",
          "title": "Which data POKYH processes",
          "blocks": [
            {
              "items": [
                {
                  "label": "School credentials (WebUntis sign-in)",
                  "desc": "Your username and password are only used to sign you in at the WebUntis server of the school you chose; Untis GmbH runs these servers on behalf of each school. On POKYH servers the password is neither stored nor logged. So that a session WebUntis ended can be renewed automatically, the credentials and the chosen school are kept on your device, AES-GCM encrypted in an httpOnly cookie (pokyh_renew); it is only sent to the sign-in address, only valid together with your session, expires after 4 hours and is deleted when you sign out. The WebUntis session is AES-GCM encrypted in an httpOnly cookie as well. Your sign-in consists of these cookies only: delete them and you are signed out. Legal basis: providing the service you asked for (Art. 6(1)(b) GDPR)."
                },
                {
                  "label": "Session cookie (pokyh_session)",
                  "desc": "Encrypted httpOnly cookie holding the school-portal session token. Expires on logout or after 4 hours. Not accessible to JavaScript (XSS protection)."
                },
                {
                  "label": "POKYH account (alternative sign-in)",
                  "desc": "Users without a school account can register with a POKYH-only account (username + password). The password is stored bcrypt-hashed. A plaintext password is never stored."
                },
                {
                  "label": "User cookie (pokyh_user)",
                  "desc": "Contains non-sensitive display information (username, class, school) for rendering in the app. No password, no token."
                },
                {
                  "label": "School search and chosen school",
                  "desc": "To help you find your school, the POKYH server sends your search term (name, town or postcode of a school) to the public WebUntis school search (Untis GmbH). Untis only receives the search term and the address of the POKYH server, not your IP address. Results are kept in the server’s memory for up to 10 minutes and are not linked to anyone. Your browser stores the chosen school (login name, name, address and server as listed by WebUntis) until the end of the school year (31 August, at least 30 days) as pokyh_school, so you do not have to search for it every time; you can change it whenever you sign in. After you sign in, the POKYH backend assigns your account to this school (the school’s login name, name and server), so that classes, reminders, comments and the menu stay separate per school; when someone from a school signs in for the first time, the school is created. Legal basis: Art. 6(1)(b) GDPR."
                },
                {
                  "label": "POKYH backend (to-dos & reminders)",
                  "desc": "To-dos and class reminders are stored on POKYH’s own backend: title, details, timestamp, username. You can delete them yourself at any time. No external cloud services are used for these features."
                },
                {
                  "label": "Canteen ratings & comments",
                  "desc": "When you rate or comment on a dish, the POKYH backend stores the star rating or comment text, your username, internal user ID, and a timestamp. Comments are visible with your username to other signed-in users; ratings appear only as an average and count. You can delete your own comments at any time."
                },
                {
                  "label": "Reports of content (Digital Services Act)",
                  "desc": "If you report a comment or other content (with “Report” or by e-mail), we process your report: your name and e-mail address if you give them, the reported content and your reasons. We need them to review the report, to answer you and to give reasons for our decision. We do not tell the person whose content was reported your name. Legal basis: legal obligation (Art. 6(1)(c) GDPR in conjunction with Articles 16 and 17 of Regulation (EU) 2022/2065). Retention: until the case is closed, then at most 6 months for questions and complaints."
                },
                {
                  "label": "Push notifications (website, optional)",
                  "desc": "Only if you allow notifications in your browser: the POKYH backend stores your browser’s push address (endpoint) with your user ID. So that it can tell you about new WebUntis messages, it also stores your current WebUntis session (session identifier and access token, not your password) and uses it to ask your school’s WebUntis server about every 5 minutes how many messages are unread. Message contents are not stored. This stops as soon as WebUntis ends the session. Notifications are delivered through your browser vendor’s push service (e.g. Google, Mozilla or Apple). You can withdraw at any time in your browser settings; the push address is then deleted."
                },
                {
                  "label": "Photos from other sites (cafeteria)",
                  "desc": "The dish photos in the cafeteria menu are hosted on third-party recipe sites and shown from there; POKYH does not copy them. Your browser loads them directly from those sites, which, as with any page request, receive your IP address and technical details of your browser (e.g. the browser type), without a referrer, so without the address of the POKYH page. What those sites do with it, for example whether they set cookies, is up to them; many browsers block third-party cookies. Legal basis: legitimate interest (Art. 6(1)(f) GDPR) in showing the menu clearly. You can object at any time (Art. 21 GDPR): with “Hide photos” on the cafeteria page your browser no longer loads photos from other sites; it stores the choice as pokyh_external_media."
                },
                {
                  "label": "Google Analytics 4 (GA4)",
                  "desc": "This website may use Google Analytics 4 (Google LLC), but only after your explicit consent in the cookie banner; before that, no connection to Google is made. GA4 collects pseudonymised usage data (page views, device category, approximate country of origin) and sets the cookies _ga and _ga_* for this. According to Google, GA4 does not store IP addresses; Google signals and advertising features are switched off. Legal basis: your consent (Art. 6(1)(a) GDPR, Art. 122 Italian Privacy Code). You can withdraw it at any time in the cookie settings; the cookies are then deleted. You can additionally opt out of data collection at tools.google.com/dlpage/gaoptout."
                },
                {
                  "label": "Cloudflare Tunnel (Cloudflare, Inc.)",
                  "desc": "Cloudflare Tunnel is used for the public reachability of the self-hosted server. Cloudflare processes network metadata (IP addresses, request headers) to forward traffic. No content is stored permanently. Legal basis: legitimate interest (Art. 6(1)(f) GDPR) for secure server operation. Cloudflare also passes on to us the country derived from the IP address (where applicable region and city), which we use for the visitor statistics of the website and the apps; no location lookup with other providers takes place."
                },
                {
                  "label": "Server logging (request logs)",
                  "desc": "The POKYH backend server automatically records access logs: IP address, HTTP method, requested path, HTTP status code, response time, username and user agent. Purpose: security, error diagnosis and abuse detection. We also count from them, without names, how many accounts were active each day and in the last 7 or 30 days and whether they used the iOS app, the Android app or the website. For your account, a day-by-day overview records whether you used POKYH, on which kind of device (iOS app, Android app, website on a phone or computer) and how often you signed in, without IP address and without the pages you opened; you can see this overview yourself in your profile. Legal basis: legitimate interest (Art. 6(1)(f) GDPR). Logs are deleted after 30 days at the latest, your account's day-by-day overview at the end of the school year (see Retention)."
                },
                {
                  "label": "Administration log",
                  "desc": "If administrators change something that concerns your account or your content (for example removing a comment or granting rights), the POKYH backend records who changed what and when, and which account or content was affected, without passwords or other secrets. Purpose: accountability and protection against misuse. Legal basis: legitimate interest (Art. 6(1)(f) GDPR) and accountability (Art. 5(2) GDPR). The entries are deleted after 365 days."
                },
                {
                  "label": "Usage statistics (apps & website)",
                  "desc": "While you are signed in and POKYH is open in the foreground, the iOS app, the Android app and the website tell the POKYH backend about every 30 to 60 seconds how long POKYH was used and how many screens were opened. Stored per visit: a random visit ID, the platform (iOS app, Android app or website, for the website also phone or computer and whether it is installed as a web app), the app version, day and time, the duration of use and the number of screens opened. Not stored with it: IP address, user agent, content or input; nothing is stored in the browser or on the device for this. Without consent (anonymous): instead of your account the visit holds only a day key, a hash of your account ID and a random value that is deleted at the end of the day. This lets us count how many different people used POKYH on a day without knowing who, and days cannot be linked together. Page views of the website also count as website visits, and opening an app as an app visit, for this the IP address is stored separately from the usage statistics (see “Website and app visitors”). Per class and day, only the total time and the number of people who used POKYH are also added up (no names; a class is shown only from 5 person-days up). Analysis is in totals only (e.g. users per platform, average duration of use, peak times), seen only by administrators. Legal basis: legitimate interest in operating and improving the service (Art. 6(1)(f) GDPR); you can object at any time (Art. 21 GDPR): a short message to the contact address above is enough. Browsers with “Global Privacy Control” enabled send no usage statistics. With consent (personal, “Accept all” or profile): the visit is also linked to your account, and administrators can see for your account which platform and app version you use, when you were last active, how long, how often and on how many days you used POKYH, which pages you opened and from which IP addresses and places you used the website and the apps (e.g. for support or to point out outdated app versions). Legal basis: your consent (Art. 6(1)(a) GDPR); under 14 only with your parents’ permission (Art. 8 GDPR, Art. 2-quinquies Italian Privacy Code). You can withdraw it at any time in your profile or the cookie settings; your name is then removed from everything collected so far. This data is not passed on to third parties, not used for advertising and not linked to grades or other school data."
                },
                {
                  "label": "Website and app visitors (reach & security)",
                  "desc": "For every page view of the website (with or without an account) the POKYH backend stores: the IP address, the country Cloudflare derives from it (and, where provided, region and city), the device type (phone, tablet, computer), the page opened, date and time, and whether you were signed in. In the same way, in the iOS and Android apps (which send usage data only while you are signed in) it stores each opening of the app once per IP address and day: the IP address, the country (and, where provided, region and city), the device (iPhone or Android), the app version, date and time, and the random visit ID of the usage statistics, so that a visit is counted only once. The app sends nothing extra for this; the address used is the one the usage statistics come from anyway. If you are signed in, a pseudonymous account key is added (a hash formed with a server secret, without your name), so it can be counted how many different accounts use an IP address, for example in a school network. Different visitors per day are counted with a day key (made from your account if you are signed in, otherwise from the IP address and browser identifier) that can no longer be resolved once the day is over. Purpose: knowing how many people the website and the apps reach and where they come from, and detecting abuse, bots and attacks. Legal basis: legitimate interest (Art. 6(1)(f) GDPR); you can object at any time (Art. 21 GDPR): a short message to the contact address above is enough. If you have agreed to the personal usage statistics, the visit is also linked to your account, so administrators see your name at the IP address (Art. 6(1)(a) GDPR); without consent no name is stored, and after withdrawal it is removed. IP address, place, account key, visit ID and account are deleted after 30 days; after that only an anonymous count by country, device type, page or app version, day and hour remains. Browsers with “Global Privacy Control” enabled are counted without IP address and account. Only administrators see this data; it is not passed on to third parties and not used for advertising."
                },
                {
                  "label": "Notice & consents",
                  "desc": "For your account we store which version of this notice was shown to you and when (at sign-in or after a change, on the website or in the app), and whether and when you gave or withdrew consent to the personal usage statistics, as proof (Art. 5(2), Art. 7(1) GDPR). Being shown the notice is not consent. This data is deleted with your account. Your cookie-banner choice is also stored on your device (see Cookies)."
                },
                {
                  "label": "Mobile app (iOS & Android)",
                  "desc": "The native POKYH apps store credentials only encrypted on the device (iOS Keychain, or with a key from the Android Keystore) so the sign-in can be renewed; they are not stored on POKYH servers. iCloud sync is disabled. Apart from the usage statistics and the app visitor statistics described above, the app collects no analytics data; no third-party analytics SDKs are included. After the first sign-in and after a change to this notice the app shows a note about it once; that it was shown is stored as on the website (see “Notice & consents”). For offline use the app keeps the most recently loaded data (e.g. timetable, grades, absences, canteen) in the app’s private storage on the device. Reminders are delivered as local device notifications (no remote push). Update checks use the public GitHub API; for technical reasons GitHub receives the IP address, but no account or school data."
                },
                {
                  "label": "Error reports (apps and administration)",
                  "desc": "If an error occurs in the iOS or Android app or in the administration area, they send a technical error report to the POKYH backend: the error message and its trace (cleaned of addresses, tokens and query parameters), the affected page, the app version, the rough browser or app family and your school, without IP address, without account and without a full device identifier. Legal basis: legitimate interest in a working, secure service (Art. 6(1)(f) GDPR). The reports are deleted after 30 days."
                },
                {
                  "label": "Local storage (localStorage)",
                  "desc": "Your browser’s storage is used for settings (appearance, language, chosen school and cafeteria, photos yes/no, the progress in the hidden classroom of the sign-in page) and as a cache of recently loaded school data (timetable, grades, absences, messages) for faster display. This data does not leave your device; each entry is listed in the cookie policy."
                },
                {
                  "label": "Support via Buy Me a Coffee (voluntary)",
                  "desc": "The “Support POKYH” link (settings, About) loads nothing from Buy Me a Coffee before you open it; it opens in a new tab without a referrer. If you support POKYH there, Buy Me a Coffee is independently responsible for the payment; its terms and privacy notice apply, and Buy Me a Coffee is based in the USA. We only receive from Buy Me a Coffee the details you give there (for example name, e-mail address, message and amount), no payment or card data, and use them only to match the support and, where appropriate, to thank you. Legal basis: Art. 6(1)(b) GDPR; kept as long as legal duties, for example tax duties, require."
                }
              ]
            }
          ]
        },
        {
          "id": "zwecke",
          "title": "Purposes and legal bases",
          "blocks": [
            {
              "p": "Processing takes place to provide the service (Art. 6(1)(b) GDPR). Necessary security measures (e.g. network forwarding, access logs), the visitor statistics of the website and the apps with IP address and the anonymous usage statistics are based on our legitimate interest in secure operation and in improving the service (Art. 6(1)(f) GDPR). The personal usage statistics and Google Analytics happen only with your consent (Art. 6(1)(a) GDPR), which you give in the cookie banner (“Accept all” or “Settings”) or in your profile and can withdraw there at any time; withdrawal does not affect the lawfulness of processing before it. Neither option is preselected, and POKYH is fully usable without them."
            },
            {
              "p": "The school search and assigning your account to your school serve to provide the service (Art. 6(1)(b) GDPR). Photos from other sites are loaded on the basis of legitimate interest (Art. 6(1)(f) GDPR); you can object at any time by hiding them (Art. 21 GDPR)."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Recipients and services",
          "blocks": [
            {
              "parties": [
                {
                  "name": "Untis GmbH (your school’s WebUntis)",
                  "purpose": "Sign-in and fetching of timetable, grades, absences and messages. Your school is the controller of its WebUntis data; Untis runs the servers on its behalf in the EU.",
                  "url": "https://www.untis.at/en/privacy-policy-wu-apps"
                },
                {
                  "name": "Untis GmbH (public school search)",
                  "purpose": "Finding your school when signing in; Untis only receives the search term from the POKYH server",
                  "url": "https://www.untis.at/en/privacy-policy"
                },
                {
                  "name": "POKYH backend",
                  "purpose": "Own server for accounts, schools, to-dos, reminders, cafeteria, comments, notifications and statistics",
                  "url": null
                },
                {
                  "name": "Google Analytics 4 (Google LLC)",
                  "purpose": "Anonymised usage statistics to improve the service, only with consent",
                  "url": "https://policies.google.com/privacy"
                },
                {
                  "name": "Cloudflare, Inc.",
                  "purpose": "Network routing via Cloudflare Tunnel for the self-hosted server",
                  "url": "https://www.cloudflare.com/privacypolicy/"
                },
                {
                  "name": "Browser vendors’ push services",
                  "purpose": "Delivery of web push notifications: only if you allow them",
                  "url": "https://developer.mozilla.org/docs/Web/API/Push_API"
                },
                {
                  "name": "GitHub API (GitHub, Inc.)",
                  "purpose": "Update checks for the mobile apps; GitHub technically receives the IP address, no account or school data",
                  "url": "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                },
                {
                  "name": "Recipe sites (dish photos)",
                  "purpose": "Photos in the cafeteria menu loaded directly from the sites that publish them (can be switched off with “Hide photos”)",
                  "url": null
                },
                {
                  "name": "Buy Me a Coffee",
                  "purpose": "Voluntary support: only if you open the link and support there; independently responsible for the payment",
                  "url": null
                }
              ]
            }
          ]
        },
        {
          "id": "drittlaender",
          "title": "Transfers to third countries",
          "blocks": [
            {
              "p": "According to its own statements, Untis GmbH processes WebUntis data exclusively in the EU. Cloudflare, Inc., GitHub, Inc. (only for the apps’ update checks), Google LLC (only with your consent to statistics) and the browser vendors’ push services (for example Google, Apple or Mozilla; only if you allow notifications) may process data in the USA; transfers rely on the adequacy decision for the EU-US Data Privacy Framework (Art. 45 GDPR), under which these providers are certified, and on standard contractual clauses (Art. 46 GDPR). Recipe sites that the cafeteria photos come from may be based outside the EU, including in countries without an adequacy decision. Your browser loads the photos directly from there unless you switch them off with “Hide photos”; these sites thereby receive your IP address. If you do not want that, hide the photos."
            }
          ]
        },
        {
          "id": "speicherdauer",
          "title": "Retention",
          "blocks": [
            {
              "p": "Sign-in cookies are deleted on logout and otherwise expire automatically (session 4 hours, API token 8 hours, refresh token 30 days). To-dos, reminders, canteen ratings, and comments remain on the POKYH backend until you delete them yourself. Server logs are deleted after 30 days, database backups after 7 days. Your account's day-by-day overview (active days, device type, sign-ins) is kept until the end of the current school year; the usage statistics name your account only with consent and for at most as long. At the change of school year (1 August), each account's figures for the year (active days, sign-ins and, with consent, time spent) are moved, together with the accounts, classes, to-dos and reminders of the past school year, into a school-year archive that only administrators can see; the year's entries are then deleted. Page views are deleted after 30 days. After that (and for anonymous visits once the server logs are deleted) no entry can be traced back to a person any more, and it remains only as an anonymous statistic. For website and app visits, IP address, place, account key, visit ID and (with consent) your account are removed after 30 days; an anonymous count by country, device type, page or app version, day and hour remains. Completed to-dos are automatically hidden after 24 hours. Google Analytics data is deleted, where you have consented, after 14 months. Reports of content are kept until the case is closed, then at most 6 months. The administration log is deleted after 365 days, the apps’ error reports after 30 days. The progress in the hidden classroom stays only in your browser until you delete it there."
            },
            {
              "p": "The chosen school stays in your browser until 31 August of the current school year, for at least 30 days. The WebUntis session stored for push notifications is only valid until WebUntis ends it and is deleted together with the push address. The assignment of your account to your school is deleted with your account. Cached school search results expire after 10 minutes."
            }
          ]
        },
        {
          "id": "minderjaehrige",
          "title": "Children and young people",
          "blocks": [
            {
              "p": "POKYH is for people aged 14 and over. Younger people may only use POKYH with their parents’ consent. In Italy, consent (personal usage statistics, statistics cookies) can only be given by yourself from the age of 14 (Art. 8 GDPR, Art. 2-quinquies of the Italian Data Protection Code); below that only by the parents. If we learn that a child’s data is processed without this consent, we delete it."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "Your rights",
          "blocks": [
            {
              "p": "You have the following rights regarding your personal data:"
            },
            {
              "list": [
                "Access (Art. 15 GDPR)",
                "Rectification of inaccurate data (Art. 16 GDPR)",
                "Erasure / right to be forgotten (Art. 17 GDPR)",
                "Restriction of processing (Art. 18 GDPR)",
                "Data portability (Art. 20 GDPR)",
                "Objection to processing based on legitimate interests (Art. 21 GDPR)",
                "Withdrawal of consent"
              ]
            },
            {
              "contact": "privacy"
            },
            {
              "complaint": "Complaint to the competent supervisory authority: the Italian Garante per la protezione dei dati personali,"
            }
          ]
        },
        {
          "id": "pflicht",
          "title": "Obligation to provide data and automated decisions",
          "blocks": [
            {
              "p": "You are not obliged to give POKYH any data. Without your WebUntis credentials, however, POKYH cannot show data from WebUntis. There is no automated decision-making or profiling within the meaning of Art. 22 GDPR."
            }
          ]
        },
        {
          "id": "sicherheit",
          "title": "Data security",
          "blocks": [
            {
              "p": "All connections use HTTPS/TLS (provided via Cloudflare Tunnel). WebUntis session tokens are encrypted server-side with AES-GCM and stored only in httpOnly cookies (no JavaScript access). Passwords are never stored on POKYH servers. Input is validated server-side. The server runs on private hardware and is reachable only through the encrypted Cloudflare Tunnel."
            }
          ]
        },
        {
          "id": "cookies",
          "title": "Cookies and local storage",
          "blocks": [
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Encrypted school-portal session token (httpOnly, AES-GCM, 4 hours)"
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Non-sensitive display info (no token, no password, 4 hours, 8 hours with a POKYH account without a school account)"
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "POKYH backend JWT for API access (not httpOnly, 8 hours)"
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "POKYH backend refresh token to automatically renew the API token (httpOnly, 30 days)"
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Credentials and chosen school for automatic session renewal, AES-GCM encrypted (httpOnly, only sent to the sign-in address, only valid together with the session, 4 hours, deleted when you sign out)"
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "The school chosen at sign-in (localStorage, until 31 August, at least 30 days)"
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Remembers that you hid photos from other sites (localStorage, until you show them again)"
                },
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Saved colour scheme (localStorage, not a cookie)"
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Sidebar collapsed/expanded state (localStorage, not a cookie)"
                },
                {
                  "name": "passkey_declined",
                  "kind": "setting",
                  "desc": "Remembers that you declined saving the sign-in in the browser (cookie, 1 year)"
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Cache of recently loaded school data for faster display (localStorage, never leaves the device, deleted when you sign out)"
                },
                {
                  "name": "_ga, _ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: anonymised usage statistics (only with consent), 1-2 year lifetime"
                }
              ]
            },
            {
              "link": {
                "view": "cookies",
                "label": "Cookies and storage"
              }
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Changes",
          "blocks": [
            {
              "p": "This privacy notice is updated when POKYH or the law changes. The current version is always at pokyh.com/legal. POKYH informs you about important changes after you sign in."
            }
          ]
        }
      ]
    }
  },
  "nutzungsbedingungen": {
    "de": {
      "title": "Nutzungsbedingungen",
      "lead": "Regeln für die Nutzung, Mindestalter 14 und Haftung",
      "sections": [
        {
          "id": "geltung",
          "title": "Geltung",
          "blocks": [
            {
              "p": "Diese Bedingungen gelten für die Nutzung von POKYH im Browser, als Web-App und in den Apps für iOS und Android. Anbieter ist POKYH (siehe Impressum). Mit der Anmeldung akzeptierst du diese Bedingungen. Wie POKYH mit deinen Daten umgeht, steht in der Datenschutzerklärung."
            }
          ]
        },
        {
          "id": "leistung",
          "title": "Was POKYH bietet",
          "blocks": [
            {
              "p": "POKYH ist kostenlos und ohne Werbung. Es zeigt Daten aus WebUntis deiner Schule und ergänzt eigene Funktionen. Welche Daten zur Verfügung stehen, hängt davon ab, was deine Schule in WebUntis freigegeben hat. Weil POKYH ein freiwilliges, unentgeltliches Projekt ist, besteht kein Anspruch auf eine bestimmte Verfügbarkeit oder auf bestimmte Funktionen; Funktionen können sich ändern oder eingestellt werden. Über wesentliche Änderungen informieren wir in der App. Spielerische Extras, etwa die Sternchen und Gegenstände im versteckten Klassenzimmer der Anmeldeseite, haben keinen Geldwert: Sie können nicht gekauft, verkauft oder getauscht werden und liegen nur in deinem Browser, sodass sie mit den Browserdaten verloren gehen können. Eine freiwillige Unterstützung (zum Beispiel über Buy Me a Coffee) ist ein Geschenk ohne Gegenleistung und ändert nichts an den Funktionen."
            }
          ]
        },
        {
          "id": "konto",
          "title": "Dein Konto und deine Zugangsdaten",
          "blocks": [
            {
              "list": [
                "Du meldest dich mit deinem eigenen WebUntis-Konto an. Nutze nur dein eigenes Konto, als Elternteil nur deinen Elternzugang.",
                "Halte deine Zugangsdaten geheim. Dein Passwort geht nur an den WebUntis-Server deiner Schule und wird auf POKYH-Servern nicht gespeichert.",
                "Deine Schule kann eigene Regeln für die Nutzung von WebUntis und von Apps anderer Anbieter haben. Bitte halte sie ein; im Zweifel frag deine Schule.",
                "Ein POKYH-Konto ohne Schulkonto ist möglich; dann fehlen die Daten aus WebUntis."
              ]
            }
          ]
        },
        {
          "id": "alter",
          "title": "Mindestalter",
          "blocks": [
            {
              "p": "POKYH ist für Personen ab 14 Jahren. Bist du jünger, darfst du POKYH nur mit dem Einverständnis deiner Eltern bzw. Erziehungsberechtigten nutzen, zum Beispiel gemeinsam über deren Elternzugang. Einwilligungen in freiwillige Statistiken kannst du erst ab 14 Jahren selbst erteilen (Art. 8 DSGVO, Art. 2-quinquies Codice in materia di protezione dei dati personali)."
            }
          ]
        },
        {
          "id": "regeln",
          "title": "Faire Nutzung",
          "blocks": [
            {
              "p": "Bei der Nutzung von POKYH ist nicht erlaubt:"
            },
            {
              "list": [
                "auf Daten anderer Personen zuzugreifen oder es zu versuchen;",
                "POKYH, WebUntis oder die Schule mit automatisierten Massenabfragen zu belasten, Sicherheitsmaßnahmen zu umgehen oder Schwachstellen auszunutzen (Sicherheitslücken bitte vertraulich an die Kontaktadresse melden);",
                "in Kommentaren, Bewertungen oder Erinnerungen rechtswidrige, beleidigende, diskriminierende oder fremde persönliche Inhalte zu veröffentlichen;",
                "POKYH für Werbung oder kommerzielle Zwecke zu nutzen."
              ]
            },
            {
              "p": "Wir dürfen Inhalte, die gegen diese Regeln verstoßen, entfernen und Konten bei schweren oder wiederholten Verstößen sperren."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "Deine Inhalte",
          "blocks": [
            {
              "p": "Für Kommentare, Bewertungen, To-dos und Erinnerungen, die du erstellst, bist du selbst verantwortlich. Du räumst POKYH das einfache, unentgeltliche Recht ein, sie innerhalb von POKYH anzuzeigen, solange sie bestehen. Du kannst sie jederzeit löschen."
            }
          ]
        },
        {
          "id": "melden",
          "title": "Inhalte melden und Moderation",
          "blocks": [
            {
              "p": "Kommentare und Erinnerungen anderer siehst du nur innerhalb deiner Schule bzw. deiner Klasse. Hältst du einen Inhalt für rechtswidrig oder für einen Verstoß gegen diese Bedingungen, melde ihn: mit „Melden“ direkt am Kommentar oder per E-Mail an die Kontaktadresse. Nenne dabei möglichst, wo der Inhalt steht (Link), warum er rechtswidrig ist, deinen Namen und deine E-Mail-Adresse, und bestätige, dass deine Angaben nach bestem Wissen richtig sind (Art. 16 der Verordnung (EU) 2022/2065, Digital Services Act)."
            },
            {
              "list": [
                "Jede Meldung prüft ein Mensch aus dem POKYH-Team. Eine automatische Moderation oder automatisierte Entscheidungen gibt es nicht.",
                "Wir bestätigen den Eingang einer Meldung, wenn du eine E-Mail-Adresse angibst, und teilen dir unsere Entscheidung mit.",
                "Ist ein Inhalt rechtswidrig oder verstößt er gegen diese Bedingungen, entfernen wir ihn. Bei schweren oder wiederholten Verstößen können wir das Kommentieren oder das Konto sperren, nach Möglichkeit erst nach einer Verwarnung.",
                "Wird dein Inhalt entfernt oder dein Konto eingeschränkt, nennen wir dir die Gründe, soweit wir dich erreichen können (Art. 17 DSA). Du kannst innerhalb von 6 Monaten per E-Mail widersprechen; dann prüfen wir die Entscheidung erneut.",
                "Wer wiederholt offensichtlich unbegründete Meldungen schickt, dessen Meldungen können wir nach einer Warnung eine Zeit lang nicht mehr bearbeiten."
              ]
            }
          ]
        },
        {
          "id": "richtigkeit",
          "title": "Richtigkeit der Daten",
          "blocks": [
            {
              "p": "POKYH zeigt Schuldaten so, wie WebUntis sie liefert. Maßgeblich sind immer die Angaben in WebUntis bzw. der Schule. Berechnete Werte (zum Beispiel Notenschnitt, Fehlstunden und Prozentwerte) und der Notenrechner sind unverbindliche Hilfen und ersetzen keine Auskunft der Schule."
            }
          ]
        },
        {
          "id": "haftung",
          "title": "Haftung",
          "blocks": [
            {
              "p": "POKYH wird kostenlos und mit Sorgfalt bereitgestellt. Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit (Art. 1229 Codice civile). Im Übrigen haften wir, soweit gesetzlich zulässig, nicht für die ständige Verfügbarkeit von POKYH, für Daten, die WebUntis oder die Schule liefern, und nicht für Schäden, die durch eine falsche Anzeige solcher Daten entstehen. Zwingende Rechte als Verbraucherin oder Verbraucher nach dem Codice del consumo bleiben unberührt."
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Änderungen",
          "blocks": [
            {
              "p": "Wir können diese Bedingungen anpassen, etwa wegen neuer Funktionen oder rechtlicher Vorgaben. Über wesentliche Änderungen informieren wir rechtzeitig in der App. Du kannst POKYH jederzeit nicht mehr nutzen und dein Konto löschen lassen."
            }
          ]
        },
        {
          "id": "recht",
          "title": "Anwendbares Recht",
          "blocks": [
            {
              "p": "Es gilt italienisches Recht. Bist du Verbraucherin oder Verbraucher, bleiben dir die zwingenden Schutzvorschriften des Staates erhalten, in dem du lebst (Art. 6 Verordnung (EG) Nr. 593/2008), und für Streitigkeiten ist das Gericht deines Wohnsitzes zuständig (Art. 66-bis Codice del consumo)."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Kontakt",
          "blocks": [
            {
              "contact": "contact"
            }
          ]
        }
      ]
    },
    "it": {
      "title": "Condizioni d’uso",
      "lead": "Regole d’uso, età minima 14 anni e responsabilità",
      "sections": [
        {
          "id": "geltung",
          "title": "Ambito",
          "blocks": [
            {
              "p": "Queste condizioni valgono per l’uso di POKYH nel browser, come web app e nelle app per iOS e Android. Il fornitore è POKYH (vedi note legali). Con l’accesso accetti queste condizioni. Come POKYH tratta i tuoi dati è spiegato nell’informativa sulla privacy."
            }
          ]
        },
        {
          "id": "leistung",
          "title": "Cosa offre POKYH",
          "blocks": [
            {
              "p": "POKYH è gratuita e senza pubblicità. Mostra i dati di WebUntis della tua scuola e aggiunge funzioni proprie. Quali dati sono disponibili dipende da ciò che la tua scuola ha attivato in WebUntis. Poiché POKYH è un progetto volontario e gratuito, non c’è diritto a una determinata disponibilità o a determinate funzioni; le funzioni possono cambiare o essere sospese. Delle modifiche importanti informiamo nell’app. Gli extra giocosi, come le stelline e gli oggetti nell’aula nascosta della pagina di accesso, non hanno valore monetario: non possono essere acquistati, venduti o scambiati e restano solo nel tuo browser, per cui possono andare persi insieme ai dati del browser. Un sostegno volontario (ad esempio tramite Buy Me a Coffee) è un dono senza controprestazione e non cambia nulla nelle funzioni."
            }
          ]
        },
        {
          "id": "konto",
          "title": "Il tuo account e le tue credenziali",
          "blocks": [
            {
              "list": [
                "Accedi con il tuo account WebUntis. Usa solo il tuo account; come genitore solo il tuo accesso per genitori.",
                "Tieni segrete le tue credenziali. La password va solo al server WebUntis della tua scuola e non viene salvata sui server di POKYH.",
                "La tua scuola può avere regole proprie sull’uso di WebUntis e di app di altri fornitori. Rispettale; nel dubbio chiedi alla scuola.",
                "È possibile un account POKYH senza account scolastico; in quel caso mancano i dati di WebUntis."
              ]
            }
          ]
        },
        {
          "id": "alter",
          "title": "Età minima",
          "blocks": [
            {
              "p": "POKYH è per persone dai 14 anni in su. Se sei più giovane puoi usare POKYH solo con il consenso dei tuoi genitori o di chi esercita la responsabilità genitoriale, per esempio insieme a loro tramite l’accesso per genitori. Il consenso alle statistiche facoltative puoi darlo da solo solo dai 14 anni (art. 8 GDPR, art. 2-quinquies Codice in materia di protezione dei dati personali)."
            }
          ]
        },
        {
          "id": "regeln",
          "title": "Uso corretto",
          "blocks": [
            {
              "p": "Nell’uso di POKYH non è consentito:"
            },
            {
              "list": [
                "accedere o tentare di accedere ai dati di altre persone;",
                "sovraccaricare POKYH, WebUntis o la scuola con richieste automatizzate di massa, aggirare misure di sicurezza o sfruttare vulnerabilità (segnala le vulnerabilità in modo riservato all’indirizzo di contatto);",
                "pubblicare in commenti, valutazioni o promemoria contenuti illeciti, offensivi, discriminatori o dati personali altrui;",
                "usare POKYH per pubblicità o scopi commerciali."
              ]
            },
            {
              "p": "Possiamo rimuovere i contenuti che violano queste regole e bloccare gli account in caso di violazioni gravi o ripetute."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "I tuoi contenuti",
          "blocks": [
            {
              "p": "Sei responsabile dei commenti, delle valutazioni, dei to-do e dei promemoria che crei. Concedi a POKYH il diritto semplice e gratuito di mostrarli all’interno di POKYH finché esistono. Puoi eliminarli in qualsiasi momento."
            }
          ]
        },
        {
          "id": "melden",
          "title": "Segnalare contenuti e moderazione",
          "blocks": [
            {
              "p": "I commenti e i promemoria degli altri sono visibili solo all’interno della tua scuola o della tua classe. Se ritieni che un contenuto sia illegale o violi queste condizioni, segnalalo: con «Segnala» direttamente accanto al commento o via e-mail all’indirizzo di contatto. Indica possibilmente dove si trova il contenuto (link), perché è illegale, il tuo nome e il tuo indirizzo e-mail, e conferma che le tue indicazioni sono esatte secondo scienza e coscienza (art. 16 del regolamento (UE) 2022/2065, Digital Services Act)."
            },
            {
              "list": [
                "Ogni segnalazione viene esaminata da una persona del team di POKYH. Non esistono moderazione automatica né decisioni automatizzate.",
                "Confermiamo la ricezione di una segnalazione se indichi un indirizzo e-mail e ti comunichiamo la nostra decisione.",
                "Se un contenuto è illegale o viola queste condizioni, lo rimuoviamo. In caso di violazioni gravi o ripetute possiamo bloccare i commenti o l’account, se possibile solo dopo un avvertimento.",
                "Se un tuo contenuto viene rimosso o il tuo account limitato, ti comunichiamo i motivi, nella misura in cui possiamo raggiungerti (art. 17 DSA). Puoi opporti via e-mail entro 6 mesi; in tal caso riesaminiamo la decisione.",
                "Chi invia ripetutamente segnalazioni manifestamente infondate può vedere, dopo un avvertimento, le proprie segnalazioni non trattate per un certo periodo."
              ]
            }
          ]
        },
        {
          "id": "richtigkeit",
          "title": "Correttezza dei dati",
          "blocks": [
            {
              "p": "POKYH mostra i dati scolastici così come li fornisce WebUntis. Fanno sempre fede i dati in WebUntis o quelli della scuola. I valori calcolati (ad esempio media dei voti, ore di assenza e percentuali) e il calcolatore dei voti sono aiuti non vincolanti e non sostituiscono le informazioni della scuola."
            }
          ]
        },
        {
          "id": "haftung",
          "title": "Responsabilità",
          "blocks": [
            {
              "p": "POKYH è fornita gratuitamente e con cura. Rispondiamo senza limiti in caso di dolo e colpa grave e per i danni alla vita, al corpo e alla salute (art. 1229 Codice civile). Per il resto, nei limiti consentiti dalla legge, non rispondiamo della disponibilità continua di POKYH, dei dati forniti da WebUntis o dalla scuola né dei danni derivanti da una visualizzazione errata di tali dati. Restano salvi i diritti inderogabili dei consumatori previsti dal Codice del consumo."
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Modifiche",
          "blocks": [
            {
              "p": "Possiamo modificare queste condizioni, ad esempio per nuove funzioni o requisiti di legge. Delle modifiche importanti informiamo in tempo nell’app. Puoi smettere di usare POKYH in qualsiasi momento e chiedere la cancellazione del tuo account."
            }
          ]
        },
        {
          "id": "recht",
          "title": "Legge applicabile",
          "blocks": [
            {
              "p": "Si applica la legge italiana. Se sei un consumatore, restano salve le norme imperative di tutela dello Stato in cui vivi (art. 6 Regolamento (CE) n. 593/2008) e per le controversie è competente il giudice del tuo luogo di residenza (art. 66-bis Codice del consumo)."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contatto",
          "blocks": [
            {
              "contact": "contact"
            }
          ]
        }
      ]
    },
    "en": {
      "title": "Terms of use",
      "lead": "Rules of use, minimum age 14 and liability",
      "sections": [
        {
          "id": "geltung",
          "title": "Scope",
          "blocks": [
            {
              "p": "These terms apply to the use of POKYH in the browser, as a web app and in the apps for iOS and Android. The provider is POKYH (see imprint). By signing in you accept these terms. How POKYH handles your data is explained in the privacy notice."
            }
          ]
        },
        {
          "id": "leistung",
          "title": "What POKYH offers",
          "blocks": [
            {
              "p": "POKYH is free and without ads. It shows data from your school’s WebUntis and adds its own features. Which data is available depends on what your school has enabled in WebUntis. As POKYH is a voluntary, free project, there is no entitlement to any particular availability or feature; features may change or be discontinued. We announce important changes in the app. Playful extras, such as the gold stars and items in the hidden classroom of the sign-in page, have no monetary value: they cannot be bought, sold or exchanged and live only in your browser, so they can be lost with the browser data. Voluntary support (for example via Buy Me a Coffee) is a gift with nothing in return and does not change any features."
            }
          ]
        },
        {
          "id": "konto",
          "title": "Your account and credentials",
          "blocks": [
            {
              "list": [
                "You sign in with your own WebUntis account. Only use your own account; as a parent only your parent access.",
                "Keep your credentials secret. Your password only goes to your school’s WebUntis server and is not stored on POKYH servers.",
                "Your school may have its own rules for using WebUntis and apps of other providers. Please follow them; if in doubt, ask your school.",
                "A POKYH account without a school account is possible; WebUntis data is then missing."
              ]
            }
          ]
        },
        {
          "id": "alter",
          "title": "Minimum age",
          "blocks": [
            {
              "p": "POKYH is for people aged 14 and over. If you are younger, you may only use POKYH with the consent of your parents or guardians, for example together through their parent access. You can give consent to optional statistics yourself only from the age of 14 (Art. 8 GDPR, Art. 2-quinquies of the Italian Data Protection Code)."
            }
          ]
        },
        {
          "id": "regeln",
          "title": "Fair use",
          "blocks": [
            {
              "p": "When using POKYH, it is not allowed to:"
            },
            {
              "list": [
                "access or try to access other people’s data;",
                "burden POKYH, WebUntis or the school with automated mass requests, bypass security measures or exploit vulnerabilities (please report vulnerabilities confidentially to the contact address);",
                "publish unlawful, insulting or discriminatory content or other people’s personal data in comments, ratings or reminders;",
                "use POKYH for advertising or commercial purposes."
              ]
            },
            {
              "p": "We may remove content that breaks these rules and block accounts for serious or repeated violations."
            }
          ]
        },
        {
          "id": "inhalte",
          "title": "Your content",
          "blocks": [
            {
              "p": "You are responsible for the comments, ratings, to-dos and reminders you create. You grant POKYH the simple, free right to show them within POKYH as long as they exist. You can delete them at any time."
            }
          ]
        },
        {
          "id": "melden",
          "title": "Reporting content and moderation",
          "blocks": [
            {
              "p": "Other people’s comments and reminders are only visible within your school or your class. If you think content is illegal or breaks these terms, report it: with “Report” right next to the comment or by e-mail to the contact address. If possible, say where the content is (link), why it is illegal, your name and e-mail address, and confirm that your information is accurate to the best of your knowledge (Art. 16 of Regulation (EU) 2022/2065, Digital Services Act)."
            },
            {
              "list": [
                "Every report is reviewed by a person from the POKYH team. There is no automated moderation and no automated decision-making.",
                "We confirm receipt of a report if you give an e-mail address, and tell you our decision.",
                "If content is illegal or breaks these terms, we remove it. For serious or repeated violations we may block commenting or the account, where possible only after a warning.",
                "If your content is removed or your account restricted, we tell you the reasons as far as we can reach you (Art. 17 DSA). You can object by e-mail within 6 months; we will then review the decision again.",
                "If someone repeatedly sends manifestly unfounded reports, we may stop handling their reports for a while after a warning."
              ]
            }
          ]
        },
        {
          "id": "richtigkeit",
          "title": "Accuracy of data",
          "blocks": [
            {
              "p": "POKYH shows school data as WebUntis delivers it. The information in WebUntis or from the school is always authoritative. Calculated values (for example grade averages, missed hours and percentages) and the grade calculator are non-binding aids and do not replace information from the school."
            }
          ]
        },
        {
          "id": "haftung",
          "title": "Liability",
          "blocks": [
            {
              "p": "POKYH is provided free of charge and with care. We are liable without limitation for intent and gross negligence and for injury to life, body and health (Art. 1229 of the Italian Civil Code). Otherwise, to the extent permitted by law, we are not liable for the continuous availability of POKYH, for data supplied by WebUntis or the school, or for damage caused by such data being shown incorrectly. Mandatory consumer rights under the Italian Consumer Code remain unaffected."
            }
          ]
        },
        {
          "id": "aenderungen",
          "title": "Changes",
          "blocks": [
            {
              "p": "We may update these terms, for example because of new features or legal requirements. We announce important changes in the app in good time. You can stop using POKYH at any time and have your account deleted."
            }
          ]
        },
        {
          "id": "recht",
          "title": "Applicable law",
          "blocks": [
            {
              "p": "Italian law applies. If you are a consumer, you keep the mandatory protection of the country you live in (Art. 6 Regulation (EC) No 593/2008), and the court of your place of residence has jurisdiction over disputes (Art. 66-bis Italian Consumer Code)."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contact",
          "blocks": [
            {
              "contact": "contact"
            }
          ]
        }
      ]
    }
  },
  "cookies": {
    "de": {
      "title": "Cookies und Speicher",
      "lead": "Was im Browser gespeichert wird und wie du es änderst",
      "sections": [
        {
          "id": "was",
          "title": "Was sind Cookies?",
          "blocks": [
            {
              "p": "Cookies sind kleine Textdateien, die beim Besuch einer Website auf deinem Gerät gespeichert werden. Sie ermöglichen es uns, dich wiederzuerkennen, deine Einstellungen zu speichern und den Dienst bereitzustellen. Neben Cookies verwenden wir auch den lokalen Browserspeicher (localStorage) für Einstellungen, die ausschließlich auf deinem Gerät verbleiben."
            }
          ]
        },
        {
          "id": "notwendig",
          "title": "Notwendige Cookies",
          "blocks": [
            {
              "p": "Diese Cookies sind für den Betrieb der App zwingend erforderlich. Ohne sie funktioniert die Anmeldung und Sitzungsverwaltung nicht. Sie können nicht abgelehnt werden."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Verschlüsseltes WebUntis-Session-Token (AES-GCM, httpOnly). Enthält keine persönlichen Daten im Klartext. Läuft nach 4 Stunden ab."
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Nicht-sensible Anzeigeinformationen (Benutzername, Klasse). Kein Passwort, kein Session-Token. Läuft nach 4 Stunden ab, bei einem POKYH-Konto ohne Schulkonto nach 8 Stunden."
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "Zugangstoken (JWT) für das POKYH-Backend. Läuft nach 8 Stunden ab."
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "Refresh-Token zum automatischen Erneuern des Zugangstokens (httpOnly). Läuft nach 30 Tagen ab."
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Verschlüsselte Zugangsdaten und gewählte Schule (AES-GCM, httpOnly), damit eine von WebUntis beendete Sitzung automatisch erneuert werden kann. Wird nur an die Anmeldeadresse gesendet, gilt nur zusammen mit der Sitzung und wird beim Abmelden gelöscht. Läuft nach 4 Stunden ab."
                },
                {
                  "name": "passkey_declined",
                  "kind": "necessary",
                  "desc": "Merkt sich, dass du das Speichern der Anmeldung im Browser abgelehnt hast. Läuft nach 1 Jahr ab."
                }
              ]
            }
          ]
        },
        {
          "id": "statistik",
          "title": "Statistik-Cookies (optional)",
          "blocks": [
            {
              "mixed": [
                "Diese Cookies werden nur gesetzt, wenn du",
                "„Alle akzeptieren“",
                "wählst. Sie helfen uns, die App zu verbessern, indem sie anonymisierte Nutzungsdaten erfassen."
              ]
            },
            {
              "cookies": [
                {
                  "name": "_ga",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: eindeutiger Zähler für Websitebesuche. Läuft nach 2 Jahren ab. IP-Adresse wird vor Übermittlung anonymisiert."
                },
                {
                  "name": "_ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: Session-Status und Seitenzähler. Läuft nach 2 Jahren ab."
                }
              ]
            }
          ]
        },
        {
          "id": "speicher",
          "title": "Speicher im Browser",
          "blocks": [
            {
              "p": "Diese Einträge werden nur lokal in deinem Browser gespeichert (localStorage bzw. sessionStorage) und verlassen niemals dein Gerät. Sie sind keine Cookies im rechtlichen Sinne, werden aber der Vollständigkeit halber aufgeführt."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Gespeichertes Farbschema (hell/dunkel/System). Kein Ablaufdatum."
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Sidebar ein- oder ausgeklappt. Kein Ablaufdatum."
                },
                {
                  "name": "pokyh_cookie_consent_v2",
                  "kind": "setting",
                  "desc": "Deine Auswahl im Cookie-Banner (persönliche Nutzungsstatistik ja/nein, ggf. Google Analytics) mit Datum und dem Konto, für das sie gilt. Nach „Nur notwendige“ fragen wir frühestens nach 6 Monaten erneut. Kein Ablaufdatum."
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "Die beim Anmelden gewählte Schule (Anmeldename, Name, Adresse und Server laut WebUntis). Läuft am 31. August ab, frühestens nach 30 Tagen."
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Merkt sich, wenn du die Fotos der Gerichte von anderen Seiten ausgeblendet hast. Bleibt, bis du sie auf der Mensa-Seite wieder einblendest."
                },
                {
                  "name": "pokyh_locale",
                  "kind": "setting",
                  "desc": "Gewählte Sprache (Cookie, 1 Jahr)."
                },
                {
                  "name": "pokyh_privacy_ack_pending",
                  "kind": "necessary",
                  "desc": "Merkt sich zwischen Anmeldeformular und Anmeldung, dass dir die Datenschutzerklärung angezeigt wurde; wird danach gelöscht."
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Zwischenspeicher zuletzt geladener Schuldaten (Stundenplan, Noten, Abwesenheiten, Nachrichten) für schnellere Anzeige. Wird beim Abmelden gelöscht."
                },
                {
                  "name": "pokyh_abscalc_*",
                  "kind": "necessary",
                  "desc": "Zwischengespeicherte Berechnung der Fehlstunden."
                },
                {
                  "name": "pokyh_grade_drafts_v1",
                  "kind": "setting",
                  "desc": "Von dir eingegebene Noten-Entwürfe für die Durchschnittsberechnung."
                },
                {
                  "name": "pokyh_popups_seen",
                  "kind": "setting",
                  "desc": "Welche Hinweis-Popups du bereits gesehen hast."
                },
                {
                  "name": "pokyh_bell_seen_*",
                  "kind": "setting",
                  "desc": "Welche Benachrichtigungen der Glocke du schon gesehen hast (nur Kennungen, keine Inhalte), je Konto. Bleibt im Browser, bis du ihn dort löschst."
                },
                {
                  "name": "pokyh_app_icon",
                  "kind": "setting",
                  "desc": "Gewähltes App-Symbol."
                },
                {
                  "name": "pokyh_mensa_choice",
                  "kind": "setting",
                  "desc": "Die zuletzt gewählte Mensa auf der öffentlichen Mensa-Seite, wenn es mehrere gibt."
                },
                {
                  "name": "pokyh_room_2b",
                  "kind": "setting",
                  "desc": "Fortschritt im versteckten Klassenzimmer hinter der Tür der Anmeldeseite (Sternchen, gesammelte Dinge, Rekorde). Bleibt im Browser, bis du ihn dort löschst."
                },
                {
                  "name": "pokyh_motion_notice_closed",
                  "kind": "setting",
                  "desc": "Merkt sich für diesen Tab, dass du den Hinweis zu „Bewegung reduzieren“ geschlossen hast (sessionStorage, bis der Tab geschlossen wird)."
                },
                {
                  "name": "pokyh_privacy_gate_open",
                  "kind": "necessary",
                  "desc": "Hält den Datenschutzhinweis nach der Anmeldung offen, bis du ihn bestätigst, auch bei einem Neuladen (sessionStorage, bis der Tab geschlossen wird)."
                }
              ]
            }
          ]
        },
        {
          "id": "aendern",
          "title": "Auswahl ändern",
          "blocks": [
            {
              "p": "Du kannst deine Auswahl jederzeit mit derselben Leichtigkeit ändern: Öffne die Cookie-Einstellungen und schalte die persönliche Nutzungsstatistik oder Google Analytics aus, oder wähle „Nur notwendige“. Die persönliche Nutzungsstatistik kannst du auch im Profil ausschalten."
            },
            {
              "cookieButton": "Cookie-Einstellungen öffnen"
            },
            {
              "optout": {
                "prefix": "Alternativ kannst du Google Analytics dauerhaft deaktivieren:",
                "label": "Google Analytics Opt-out"
              }
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Rechtsgrundlage",
          "blocks": [
            {
              "p": "Notwendige Cookies werden auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) gesetzt. Die persönliche Nutzungsstatistik und Analytics-Cookies beruhen ausschließlich auf deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit widerrufen, ohne dass die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung berührt wird."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Kontakt",
          "blocks": [
            {
              "p": "Bei Fragen zur Cookie-Nutzung wende dich an:"
            },
            {
              "contact": "privacy"
            }
          ]
        }
      ]
    },
    "it": {
      "title": "Cookie e memoria",
      "lead": "Cosa viene salvato nel browser e come modificarlo",
      "sections": [
        {
          "id": "was",
          "title": "Cosa sono i cookie?",
          "blocks": [
            {
              "p": "I cookie sono piccoli file di testo che vengono salvati sul tuo dispositivo quando visiti un sito web. Ci permettono di riconoscerti, memorizzare le tue preferenze e fornire il servizio. Oltre ai cookie, utilizziamo anche la memoria locale del browser (localStorage) per le impostazioni che restano esclusivamente sul tuo dispositivo."
            }
          ]
        },
        {
          "id": "notwendig",
          "title": "Cookie necessari",
          "blocks": [
            {
              "p": "Questi cookie sono indispensabili per il funzionamento dell’app. Senza di essi l’accesso e la gestione della sessione non funzionano. Non possono essere rifiutati."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Token di sessione WebUntis cifrato (AES-GCM, httpOnly). Non contiene dati personali in chiaro. Scade dopo 4 ore."
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Informazioni di visualizzazione non sensibili (nome utente, classe). Nessuna password, nessun token di sessione. Scade dopo 4 ore, con un account POKYH senza account scolastico dopo 8 ore."
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "Token di accesso (JWT) per il backend POKYH. Scade dopo 8 ore."
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "Token di refresh per rinnovare automaticamente il token di accesso (httpOnly). Scade dopo 30 giorni."
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Credenziali cifrate e scuola scelta (AES-GCM, httpOnly), per rinnovare automaticamente una sessione chiusa da WebUntis. Viene inviato solo all’indirizzo di accesso, vale solo insieme alla sessione e viene eliminato al logout. Scade dopo 4 ore."
                },
                {
                  "name": "passkey_declined",
                  "kind": "necessary",
                  "desc": "Ricorda che hai rifiutato di salvare l’accesso nel browser. Scade dopo 1 anno."
                }
              ]
            }
          ]
        },
        {
          "id": "statistik",
          "title": "Cookie statistici (facoltativi)",
          "blocks": [
            {
              "mixed": [
                "Questi cookie vengono impostati solo se scegli",
                "«Accetta tutto»",
                ". Ci aiutano a migliorare l’app raccogliendo dati d’uso anonimizzati."
              ]
            },
            {
              "cookies": [
                {
                  "name": "_ga",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: contatore univoco delle visite al sito. Scade dopo 2 anni. L’indirizzo IP viene anonimizzato prima della trasmissione."
                },
                {
                  "name": "_ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: stato della sessione e conteggio delle pagine. Scade dopo 2 anni."
                }
              ]
            }
          ]
        },
        {
          "id": "speicher",
          "title": "Memoria del browser",
          "blocks": [
            {
              "p": "Queste voci vengono salvate solo localmente nel tuo browser (localStorage o sessionStorage) e non lasciano mai il dispositivo. Non sono cookie in senso giuridico, ma vengono elencate per completezza."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Schema colori salvato (chiaro/scuro/sistema). Nessuna scadenza."
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Barra laterale espansa o compressa. Nessuna scadenza."
                },
                {
                  "name": "pokyh_cookie_consent_v2",
                  "kind": "setting",
                  "desc": "La tua scelta nel banner dei cookie (statistiche di utilizzo personali sì/no, eventualmente Google Analytics) con la data e l’account a cui si riferisce. Dopo «Solo necessari» la chiediamo di nuovo non prima di 6 mesi. Nessuna scadenza."
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "La scuola scelta all’accesso (nome di accesso, nome, indirizzo e server secondo WebUntis). Scade il 31 agosto, non prima di 30 giorni."
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Ricorda se hai nascosto le foto dei piatti da altri siti. Resta finché non le mostri di nuovo nella pagina della mensa."
                },
                {
                  "name": "pokyh_locale",
                  "kind": "setting",
                  "desc": "Lingua scelta (cookie, 1 anno)."
                },
                {
                  "name": "pokyh_privacy_ack_pending",
                  "kind": "necessary",
                  "desc": "Ricorda tra il modulo di accesso e l’accesso che ti è stata mostrata l’informativa sulla privacy; viene poi cancellato."
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Memoria temporanea degli ultimi dati scolastici caricati (orario, voti, assenze, messaggi) per una visualizzazione più rapida. Viene eliminata al logout."
                },
                {
                  "name": "pokyh_abscalc_*",
                  "kind": "necessary",
                  "desc": "Calcolo delle ore di assenza memorizzato temporaneamente."
                },
                {
                  "name": "pokyh_grade_drafts_v1",
                  "kind": "setting",
                  "desc": "Bozze di voti inserite da te per il calcolo della media."
                },
                {
                  "name": "pokyh_popups_seen",
                  "kind": "setting",
                  "desc": "Quali popup informativi hai già visto."
                },
                {
                  "name": "pokyh_bell_seen_*",
                  "kind": "setting",
                  "desc": "Quali notifiche della campanella hai già visto (solo identificativi, nessun contenuto), per account. Resta nel browser finché non lo elimini lì."
                },
                {
                  "name": "pokyh_app_icon",
                  "kind": "setting",
                  "desc": "Icona dell’app scelta."
                },
                {
                  "name": "pokyh_mensa_choice",
                  "kind": "setting",
                  "desc": "La mensa scelta per ultima sulla pagina pubblica della mensa, se ce ne sono più di una."
                },
                {
                  "name": "pokyh_room_2b",
                  "kind": "setting",
                  "desc": "Progressi nell’aula nascosta dietro la porta della pagina di accesso (stelline, oggetti raccolti, record). Restano nel browser finché non li cancelli lì."
                },
                {
                  "name": "pokyh_motion_notice_closed",
                  "kind": "setting",
                  "desc": "Ricorda per questa scheda che hai chiuso l’avviso su «Riduci movimento» (sessionStorage, finché la scheda resta aperta)."
                },
                {
                  "name": "pokyh_privacy_gate_open",
                  "kind": "necessary",
                  "desc": "Mantiene aperto l’avviso sulla privacy dopo l’accesso finché non lo confermi, anche dopo un ricaricamento (sessionStorage, finché la scheda resta aperta)."
                }
              ]
            }
          ]
        },
        {
          "id": "aendern",
          "title": "Modificare la scelta",
          "blocks": [
            {
              "p": "Puoi modificare la tua scelta in qualsiasi momento con la stessa facilità: apri le impostazioni dei cookie e disattiva le statistiche di utilizzo personali o Google Analytics, oppure scegli «Solo necessari». Le statistiche personali si possono disattivare anche nel profilo."
            },
            {
              "cookieButton": "Apri impostazioni cookie"
            },
            {
              "optout": {
                "prefix": "In alternativa puoi disattivare Google Analytics in modo permanente:",
                "label": "Opt-out di Google Analytics"
              }
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Base giuridica",
          "blocks": [
            {
              "p": "I cookie necessari vengono impostati sulla base dell’art. 6, par. 1, lett. b GDPR (esecuzione del contratto). Le statistiche di utilizzo personali e i cookie di analisi si basano esclusivamente sul tuo consenso (art. 6, par. 1, lett. a GDPR). Puoi revocare il consenso in qualsiasi momento, senza che ciò pregiudichi la liceità del trattamento effettuato prima della revoca."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contatto",
          "blocks": [
            {
              "p": "Per domande sull’uso dei cookie scrivi a:"
            },
            {
              "contact": "privacy"
            }
          ]
        }
      ]
    },
    "en": {
      "title": "Cookies and storage",
      "lead": "What is stored in the browser and how to change it",
      "sections": [
        {
          "id": "was",
          "title": "What are cookies?",
          "blocks": [
            {
              "p": "Cookies are small text files stored on your device when you visit a website. They let us recognise you, save your preferences, and provide the service. Besides cookies, we also use the browser’s local storage (localStorage) for settings that stay exclusively on your device."
            }
          ]
        },
        {
          "id": "notwendig",
          "title": "Necessary cookies",
          "blocks": [
            {
              "p": "These cookies are strictly required for the app to operate. Without them, sign-in and session management do not work. They cannot be declined."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_session",
                  "kind": "necessary",
                  "desc": "Encrypted WebUntis session token (AES-GCM, httpOnly). Contains no personal data in plaintext. Expires after 4 hours."
                },
                {
                  "name": "pokyh_user",
                  "kind": "necessary",
                  "desc": "Non-sensitive display information (username, class). No password, no session token. Expires after 4 hours, after 8 hours with a POKYH account without a school account."
                },
                {
                  "name": "pokyh_api_token",
                  "kind": "necessary",
                  "desc": "Access token (JWT) for the POKYH backend. Expires after 8 hours."
                },
                {
                  "name": "pokyh_api_refresh",
                  "kind": "necessary",
                  "desc": "Refresh token to renew the access token automatically (httpOnly). Expires after 30 days."
                },
                {
                  "name": "pokyh_renew",
                  "kind": "necessary",
                  "desc": "Encrypted credentials and chosen school (AES-GCM, httpOnly), so a session WebUntis ended can be renewed automatically. Only sent to the sign-in address, only valid together with the session, deleted when you sign out. Expires after 4 hours."
                },
                {
                  "name": "passkey_declined",
                  "kind": "necessary",
                  "desc": "Remembers that you declined saving the sign-in in the browser. Expires after 1 year."
                }
              ]
            }
          ]
        },
        {
          "id": "statistik",
          "title": "Statistics cookies (optional)",
          "blocks": [
            {
              "mixed": [
                "These cookies are only set if you choose",
                "“Accept all”",
                ". They help us improve the app by collecting anonymised usage data."
              ]
            },
            {
              "cookies": [
                {
                  "name": "_ga",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: unique counter for site visits. Expires after 2 years. The IP address is anonymised before transmission."
                },
                {
                  "name": "_ga_*",
                  "kind": "analytics",
                  "desc": "Google Analytics 4: session state and page counter. Expires after 2 years."
                }
              ]
            }
          ]
        },
        {
          "id": "speicher",
          "title": "Storage in the browser",
          "blocks": [
            {
              "p": "These entries are stored only locally in your browser (localStorage or sessionStorage) and never leave your device. They are not cookies in the legal sense but are listed here for completeness."
            },
            {
              "cookies": [
                {
                  "name": "pokyh_theme",
                  "kind": "setting",
                  "desc": "Saved colour scheme (light/dark/system). No expiry."
                },
                {
                  "name": "pokyh_sidebar_collapsed",
                  "kind": "setting",
                  "desc": "Sidebar collapsed or expanded state. No expiry."
                },
                {
                  "name": "pokyh_cookie_consent_v2",
                  "kind": "setting",
                  "desc": "Your cookie-banner choice (personal usage statistics yes/no, Google Analytics where offered) with its date and the account it applies to. After “Necessary only” we ask again no sooner than 6 months later. No expiry."
                },
                {
                  "name": "pokyh_school",
                  "kind": "setting",
                  "desc": "The school chosen at sign-in (login name, name, address and server as listed by WebUntis). Expires on 31 August, not before 30 days."
                },
                {
                  "name": "pokyh_external_media",
                  "kind": "setting",
                  "desc": "Remembers that you hid the dish photos from other sites. Stays until you show them again on the cafeteria page."
                },
                {
                  "name": "pokyh_locale",
                  "kind": "setting",
                  "desc": "Chosen language (cookie, 1 year)."
                },
                {
                  "name": "pokyh_privacy_ack_pending",
                  "kind": "necessary",
                  "desc": "Remembers between the sign-in form and the sign-in that the privacy notice was shown to you; deleted afterwards."
                },
                {
                  "name": "pokyh_cache_*",
                  "kind": "necessary",
                  "desc": "Cache of recently loaded school data (timetable, grades, absences, messages) for faster display. Deleted when you sign out."
                },
                {
                  "name": "pokyh_abscalc_*",
                  "kind": "necessary",
                  "desc": "Cached calculation of absence hours."
                },
                {
                  "name": "pokyh_grade_drafts_v1",
                  "kind": "setting",
                  "desc": "Grade drafts you entered for the average calculation."
                },
                {
                  "name": "pokyh_popups_seen",
                  "kind": "setting",
                  "desc": "Which notice popups you have already seen."
                },
                {
                  "name": "pokyh_bell_seen_*",
                  "kind": "setting",
                  "desc": "Which of the bell’s notifications you have already seen (identifiers only, no content), per account. Stays in the browser until you delete it there."
                },
                {
                  "name": "pokyh_app_icon",
                  "kind": "setting",
                  "desc": "Chosen app icon."
                },
                {
                  "name": "pokyh_mensa_choice",
                  "kind": "setting",
                  "desc": "The canteen last chosen on the public canteen page, when there are several."
                },
                {
                  "name": "pokyh_room_2b",
                  "kind": "setting",
                  "desc": "Progress in the hidden classroom behind the door of the sign-in page (gold stars, collected items, records). Stays in the browser until you delete it there."
                },
                {
                  "name": "pokyh_motion_notice_closed",
                  "kind": "setting",
                  "desc": "Remembers for this tab that you closed the notice about “Reduce motion” (sessionStorage, until the tab is closed)."
                },
                {
                  "name": "pokyh_privacy_gate_open",
                  "kind": "necessary",
                  "desc": "Keeps the privacy notice open after signing in until you confirm it, also across a reload (sessionStorage, until the tab is closed)."
                }
              ]
            }
          ]
        },
        {
          "id": "aendern",
          "title": "Change your choice",
          "blocks": [
            {
              "p": "You can change your choice at any time just as easily: open the cookie settings and turn off the personal usage statistics or Google Analytics, or choose “Necessary only”. The personal statistics can also be turned off in your profile."
            },
            {
              "cookieButton": "Open cookie settings"
            },
            {
              "optout": {
                "prefix": "Alternatively, you can permanently disable Google Analytics:",
                "label": "Google Analytics opt-out"
              }
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Legal basis",
          "blocks": [
            {
              "p": "Necessary cookies are set on the basis of Art. 6(1)(b) GDPR (performance of a contract). The personal usage statistics and analytics cookies are based solely on your consent (Art. 6(1)(a) GDPR). You can withdraw consent at any time, without affecting the lawfulness of processing carried out before the withdrawal."
            }
          ]
        },
        {
          "id": "kontakt",
          "title": "Contact",
          "blocks": [
            {
              "p": "For questions about cookie use, contact:"
            },
            {
              "contact": "privacy"
            }
          ]
        }
      ]
    }
  },
  "learn": {
    "de": {
      "title": "Datenschutzhinweise · Pokyh Learn",
      "lead": "Transparente Informationen zur WebUntis-Anmeldung und Nutzung von Pokyh Learn. Stand: 12. September 2026.",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Verantwortlicher und Schulfreigabe",
          "blocks": [
            {
              "p": "Der Verantwortliche und seine öffentlichen Kontaktdaten stehen im POKYH-Impressum. Vor einer Aktivierung muss der Verantwortliche die Freigabe der zuständigen Schule bzw. Stelle für die WebUntis-Integration dokumentieren und (soweit erforderlich) das Verhältnis nach Art. 28 DSGVO regeln. Eine Bestätigung durch Nutzende ersetzt diese Freigabe nicht."
            },
            {
              "identity": "controller"
            }
          ]
        },
        {
          "id": "daten",
          "title": "Daten und Zweck",
          "blocks": [
            {
              "p": "Zur Zugangsprüfung werden der WebUntis-Benutzername und die minimalen Rückgabedaten zur Zuordnung zu einem bestehenden POKYH-Konto verarbeitet. Für den Lerndienst verarbeitet POKYH Präferenzen, selbst erstellte Inhalte, Berechtigungen, Fortschritt, Quizversuche und strikt notwendige technische Sicherheitsdaten. Das WebUntis-Passwort wird nur über eine geschützte Verbindung für die serverseitige Prüfung übermittelt; es wird nicht gespeichert, nicht geloggt und nicht im Browser-Persistenzspeicher abgelegt."
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Rechtsgrundlage und Transparenz",
          "blocks": [
            {
              "p": "Der Verantwortliche muss vor der Erhebung den konkreten Zweck, die Rechtsgrundlage, Empfänger, einen gegebenenfalls vorhandenen Datenschutzbeauftragten, Drittlandtransfers und die Speicherdauer in seinem Verzeichnis und dieser Information benennen. Die Login-Bestätigung dokumentiert die Kenntnisnahme; sie macht eine Einwilligung nicht automatisch zur Rechtsgrundlage."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Empfänger und Dienste",
          "blocks": [
            {
              "p": "WebUntis wird ausschließlich für die Kontoprüfung angesprochen. Das POKYH-Backend und autorisierte technische Dienstleister verarbeiten Daten nur zur Bereitstellung und Absicherung des Dienstes. Ein optionales Wörterbuch erhält (falls vom Verantwortlichen aktiviert und von einem Editor ausdrücklich angefragt) nur das abgefragte Wort und die Sprachrichtung; keine WebUntis-Passwörter, Tokens, Profile oder Lernhistorien."
            }
          ]
        },
        {
          "id": "aufbewahrung",
          "title": "Aufbewahrung und Datenminimierung",
          "blocks": [
            {
              "p": "Lerndaten bleiben von den Schuldaten getrennt und werden nur für die vom Verantwortlichen festgelegte und veröffentlichte Dauer gespeichert. Ein persönlicher Export enthält ausschließlich eigene Inhalte und Lernstände; Rollen, Teams, Zugangsdaten und fremde Daten bleiben ausgeschlossen. Der Verantwortliche muss ein überprüfbares Verfahren für Löschung, Archivierung und Betroffenenanfragen festlegen."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "Rechte und Beschwerde in Italien",
          "blocks": [
            {
              "p": "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit oder Widerspruch nach Art. 15-21 DSGVO beim Verantwortlichen verlangen. Außerdem kannst du dich beim italienischen Garante per la protezione dei dati personali beschweren. Gibt es einen Datenschutzbeauftragten, müssen seine Kontaktdaten vom Verantwortlichen veröffentlicht werden."
            }
          ]
        },
        {
          "id": "aktivierung",
          "title": "Aktivierungssperre",
          "blocks": [
            {
              "p": "Der Learn-Zugang in Produktion ist so ausgelegt, dass er deaktiviert bleibt, bis der Betreiber eine Version dieser Information und einen nicht geheimen Verweis auf die WebUntis-Freigabe konfiguriert. Vor Freischaltung sind zusätzlich die Rechtsprüfung durch Verantwortliche/Schule sowie die Prüfung der tatsächlich umgesetzten technischen und organisatorischen Maßnahmen erforderlich."
            }
          ]
        },
        {
          "id": "quellen",
          "title": "Offizielle Referenzen",
          "blocks": [
            {
              "links": [
                {
                  "href": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
                  "label": "Regolamento (UE) 2016/679"
                },
                {
                  "href": "https://www.garanteprivacy.it/temi/trasparenza-ai-sensi-del-gdpr",
                  "label": "Garante per la protezione dei dati personali"
                },
                {
                  "href": "https://www.untis.at/datenschutz-wu-integrationen",
                  "label": "Untis · WebUntis"
                }
              ]
            }
          ]
        }
      ]
    },
    "it": {
      "title": "Informativa privacy · Pokyh Learn",
      "lead": "Informazioni trasparenti sull’accesso con WebUntis e sull’uso di Pokyh Learn. Versione: 12 settembre 2026.",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Titolare e autorizzazione della scuola",
          "blocks": [
            {
              "p": "Il titolare e i contatti pubblici sono indicati nell’Impressum POKYH. Prima dell’attivazione, il titolare deve ottenere e documentare l’autorizzazione della scuola o dell’ente competente per l’integrazione WebUntis e, se applicabile, il rapporto previsto dall’art. 28 GDPR. L’accettazione da parte dell’utente non sostituisce tale autorizzazione."
            },
            {
              "identity": "controller"
            }
          ]
        },
        {
          "id": "daten",
          "title": "Dati e finalità",
          "blocks": [
            {
              "p": "Per verificare l’accesso vengono trattati il nome utente WebUntis e i dati minimi restituiti per associare un account POKYH esistente. Per il servizio di apprendimento vengono trattati preferenze, contenuti creati dall’utente, autorizzazioni, progressi, tentativi di quiz e dati tecnici strettamente necessari alla sicurezza. La password WebUntis è inviata solo tramite una connessione protetta per la verifica lato server: non viene salvata, registrata nei log né inserita nello spazio di archiviazione del browser."
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Base giuridica e trasparenza",
          "blocks": [
            {
              "p": "Il titolare deve indicare, prima della raccolta, la finalità concreta, la base giuridica, i destinatari, l’eventuale DPO, i trasferimenti e il periodo di conservazione nel proprio registro e nella presente informativa. La casella mostrata al login documenta la presa visione dell’informativa; non trasforma automaticamente il consenso nella base giuridica del trattamento."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Destinatari e fornitori",
          "blocks": [
            {
              "p": "WebUntis è contattato esclusivamente per la verifica dell’account. Il backend POKYH e i fornitori tecnici autorizzati trattano i dati solo per fornire e proteggere il servizio. Un dizionario esterno, se attivato dal titolare, riceve esclusivamente la parola richiesta e la coppia linguistica quando un editor lo chiede espressamente; non riceve password WebUntis, token, profili o cronologie di apprendimento."
            }
          ]
        },
        {
          "id": "aufbewahrung",
          "title": "Conservazione e minimizzazione",
          "blocks": [
            {
              "p": "I dati di apprendimento restano separati dai dati della scuola e sono conservati soltanto per il tempo definito e pubblicato dal titolare. Un export personale è limitato ai contenuti e progressi propri; ruoli, team, credenziali e dati altrui sono esclusi. Il titolare deve definire una procedura verificabile per cancellazione, archiviazione e risposta alle richieste."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "Diritti e reclamo in Italia",
          "blocks": [
            {
              "p": "Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opposizione nei casi previsti dagli artt. 15-21 GDPR rivolgendoti al titolare. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali. Se è stato designato un DPO, i suoi contatti devono essere resi disponibili dal titolare."
            }
          ]
        },
        {
          "id": "aktivierung",
          "title": "Blocco di attivazione",
          "blocks": [
            {
              "p": "L’accesso Learn in produzione è progettato per restare disabilitato finché l’operatore non configura una versione di questa informativa e un riferimento non segreto all’autorizzazione WebUntis. Prima del rilascio sono necessari anche una revisione giuridica del titolare/scuola e la verifica delle misure tecniche e organizzative effettivamente adottate."
            }
          ]
        },
        {
          "id": "quellen",
          "title": "Fonti ufficiali di riferimento",
          "blocks": [
            {
              "links": [
                {
                  "href": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
                  "label": "Regolamento (UE) 2016/679"
                },
                {
                  "href": "https://www.garanteprivacy.it/temi/trasparenza-ai-sensi-del-gdpr",
                  "label": "Garante per la protezione dei dati personali"
                },
                {
                  "href": "https://www.untis.at/datenschutz-wu-integrationen",
                  "label": "Untis · WebUntis"
                }
              ]
            }
          ]
        }
      ]
    },
    "en": {
      "title": "Privacy notice · Pokyh Learn",
      "lead": "Transparent information about WebUntis sign-in and Pokyh Learn. Version: 12 September 2026.",
      "sections": [
        {
          "id": "verantwortlicher",
          "title": "Controller and school authorisation",
          "blocks": [
            {
              "p": "The controller and public contact details are listed in the POKYH imprint. Before activation, the controller must document authorisation from the responsible school or body for the WebUntis integration and, where applicable, put the Article 28 GDPR processor relationship in place. A user acknowledgement does not replace that authorisation."
            },
            {
              "identity": "controller"
            }
          ]
        },
        {
          "id": "daten",
          "title": "Data and purpose",
          "blocks": [
            {
              "p": "To verify access, the service processes the WebUntis username and the minimum returned data needed to associate an existing POKYH account. For learning, it processes preferences, user-created content, permissions, progress, quiz attempts, and strictly necessary technical security data. The WebUntis password is transmitted only over a protected connection for server-side verification; it is not stored, logged, or put in browser persistent storage."
            }
          ]
        },
        {
          "id": "rechtsgrundlage",
          "title": "Legal basis and transparency",
          "blocks": [
            {
              "p": "Before collection, the controller must state the concrete purpose, legal basis, recipients, any data protection officer, international transfers, and retention period in its records and this notice. The login acknowledgement records that the notice was read; it does not automatically turn consent into the legal basis."
            }
          ]
        },
        {
          "id": "empfaenger",
          "title": "Recipients and providers",
          "blocks": [
            {
              "p": "WebUntis is contacted only to verify the account. The POKYH backend and authorised technical providers process data solely to provide and protect the service. If enabled by the controller and explicitly requested by an editor, an optional dictionary receives only the requested word and language pair-not WebUntis passwords, tokens, profiles, or learning history."
            }
          ]
        },
        {
          "id": "aufbewahrung",
          "title": "Retention and minimisation",
          "blocks": [
            {
              "p": "Learning data remains separate from school data and is retained only for the period defined and published by the controller. A personal export is limited to the user’s own content and progress; roles, teams, credentials, and other people’s data are excluded. The controller must maintain a verifiable deletion, archive, and data-subject request process."
            }
          ]
        },
        {
          "id": "rechte",
          "title": "Rights and complaint in Italy",
          "blocks": [
            {
              "p": "You may request access, rectification, erasure, restriction, portability, or objection under Articles 15-21 GDPR from the controller. You may also lodge a complaint with the Italian Garante per la protezione dei dati personali. If a data protection officer is appointed, the controller must publish their contact details."
            }
          ]
        },
        {
          "id": "aktivierung",
          "title": "Activation gate",
          "blocks": [
            {
              "p": "Production Learn access is designed to remain disabled until the operator configures a version of this notice and a non-secret reference to the WebUntis authorisation. A legal review by the controller/school and verification of the actual technical and organisational measures are still required before launch."
            }
          ]
        },
        {
          "id": "quellen",
          "title": "Official references",
          "blocks": [
            {
              "links": [
                {
                  "href": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
                  "label": "Regolamento (UE) 2016/679"
                },
                {
                  "href": "https://www.garanteprivacy.it/temi/trasparenza-ai-sensi-del-gdpr",
                  "label": "Garante per la protezione dei dati personali"
                },
                {
                  "href": "https://www.untis.at/datenschutz-wu-integrationen",
                  "label": "Untis · WebUntis"
                }
              ]
            }
          ]
        }
      ]
    }
  }
};
