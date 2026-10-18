// Place names as people type them, mapped to the form WebUntis lists them
// under. WebUntis' school search matches the school's own address, which in
// South Tyrol, Austria, Germany and Switzerland is usually in German: someone
// searching "Bolzano" or "Vienna" would otherwise find nothing. Used only
// when the search as typed finds no school.

export const PLACE_ALIASES: Record<string, string> = {
  // South Tyrol (Italian → German)
  bolzano: 'bozen', bressanone: 'brixen', merano: 'meran', brunico: 'bruneck', vipiteno: 'sterzing',
  laives: 'leifers', appiano: 'eppan', caldaro: 'kaltern', silandro: 'schlanders', egna: 'neumarkt',
  chiusa: 'klausen', ortisei: 'st. ulrich', malles: 'mals', 'san candido': 'innichen', dobbiaco: 'toblach',
  renon: 'ritten', 'campo tures': 'sand in taufers', 'val badia': 'abtei', 'naturno': 'naturns',
  // Cities by their English, Italian or French names
  vienna: 'wien', vienne: 'wien', munich: 'münchen', 'monaco di baviera': 'münchen', cologne: 'köln',
  colonia: 'köln', zurich: 'zürich', zurigo: 'zürich', geneva: 'genf', ginevra: 'genf', genève: 'genf',
  berna: 'bern', berne: 'bern', lucerne: 'luzern', lucerna: 'luzern', basle: 'basel', basilea: 'basel',
  salisburgo: 'salzburg', nuremberg: 'nürnberg', norimberga: 'nürnberg', 'frankfurt am main': 'frankfurt',
};

export function aliasFor(query: string): string | null {
  const key = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return PLACE_ALIASES[key] ?? null;
}
