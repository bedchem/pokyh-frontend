import type { Dictionary } from '../dictionary';

// The console greeting for people who open the developer tools (F12).
export type ConsoleSecretKey =
  | 'hello'
  | 'curious'
  | 'warnTitle'
  | 'warnText'
  | 'help'
  | 'caught'
  | 'cmdHelp'
  | 'cmdParty'
  | 'cmdMensa'
  | 'cmdTheme'
  | 'cmdSource'
  | 'cmdQuote'
  | 'party'
  | 'mensaNone'
  | 'mensaToday'
  | 'theme'
  | 'source'
  | 'quotes';

export const consoleSecretDict: Dictionary<ConsoleSecretKey> = {
  de: {
    hello: 'Servus, Neugier!',
    curious: 'Du schaust unter die Haube. Gefällt uns. POKYH ist Open Source, schau gern rein und mach mit.',
    warnTitle: 'Stopp!',
    warnText: 'Füge hier nichts ein, was dir jemand geschickt hat. Wer dich dazu bringt, Code in die Konsole zu kopieren, will meistens an dein Konto.',
    help: 'Tipp: pokyh.help()',
    caught: 'Erwischt! F12 gedrückt. Als Belohnung: ein paar geheime Befehle.',
    cmdHelp: 'diese Liste',
    cmdParty: 'ein kleines Fest auf der Seite',
    cmdMensa: 'was es heute in der Mensa gibt',
    cmdTheme: 'hell und dunkel tauschen',
    cmdSource: 'zum Quellcode',
    cmdQuote: 'ein Satz für den Schultag',
    party: 'P! O! K! Y! H!',
    mensaNone: 'Heute steht nichts auf dem Plan.',
    mensaToday: 'Heute in der Mensa: {dish}',
    theme: 'Licht an, Licht aus.',
    source: 'Der Quellcode: {url}',
    quotes: 'Montag ist auch nur ein Tag.|Die Pause ist die wichtigste Stunde.|Hausaufgaben erledigen sich nicht von allein. Leider.|Der Stundenplan ändert sich, die Freunde bleiben.|Noch fünf Minuten bis zum Gong.',
  },
  it: {
    hello: 'Ciao, curiosità!',
    curious: 'Stai guardando sotto il cofano. Ci piace. POKYH è open source: dai un’occhiata e partecipa.',
    warnTitle: 'Stop!',
    warnText: 'Non incollare qui niente che ti abbia mandato qualcuno. Chi ti chiede di copiare codice nella console di solito vuole il tuo account.',
    help: 'Suggerimento: pokyh.help()',
    caught: 'Beccato! Hai premuto F12. In premio: qualche comando segreto.',
    cmdHelp: 'questa lista',
    cmdParty: 'una piccola festa sulla pagina',
    cmdMensa: 'cosa c’è oggi in mensa',
    cmdTheme: 'scambia chiaro e scuro',
    cmdSource: 'al codice sorgente',
    cmdQuote: 'una frase per la giornata a scuola',
    party: 'P! O! K! Y! H!',
    mensaNone: 'Oggi non c’è niente nel menù.',
    mensaToday: 'Oggi in mensa: {dish}',
    theme: 'Luce accesa, luce spenta.',
    source: 'Il codice sorgente: {url}',
    quotes: 'Anche il lunedì è solo un giorno.|La ricreazione è l’ora più importante.|I compiti non si fanno da soli. Purtroppo.|L’orario cambia, gli amici restano.|Mancano cinque minuti alla campanella.',
  },
  en: {
    hello: 'Hello, curious one!',
    curious: 'You are looking under the hood. We like that. POKYH is open source, take a look and join in.',
    warnTitle: 'Stop!',
    warnText: 'Do not paste anything here that someone sent you. Whoever asks you to copy code into the console usually wants your account.',
    help: 'Tip: pokyh.help()',
    caught: 'Caught you! F12 pressed. Your reward: a few secret commands.',
    cmdHelp: 'this list',
    cmdParty: 'a little party on the page',
    cmdMensa: 'what the cafeteria serves today',
    cmdTheme: 'swap light and dark',
    cmdSource: 'to the source code',
    cmdQuote: 'a line for the school day',
    party: 'P! O! K! Y! H!',
    mensaNone: 'Nothing on the menu today.',
    mensaToday: 'Today in the cafeteria: {dish}',
    theme: 'Lights on, lights off.',
    source: 'The source code: {url}',
    quotes: 'Monday is just another day.|Break time is the most important lesson.|Homework does not do itself. Sadly.|Timetables change, friends stay.|Five more minutes until the bell.',
  },
};
