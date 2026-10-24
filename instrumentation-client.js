// TEMPORARY local layout check - delete
if (typeof window !== 'undefined' && localStorage.getItem('tt-mock')) {
  const P = [[470,520],[520,570],[570,620],[635,685],[685,735],[735,785],[795,845],[845,895],[905,955],[955,1005]];
  const subj = {
    MAT: 'Mathematik', DEU: 'Deutsch', ENG: 'Englisch', ITA: 'Italienisch', FK: 'Fachkunde',
    WST: 'Werkstatt', REL: 'Religion', SPO: 'Sport', PHY: 'Physik', WIR: 'Wirtschaft', GES: 'Geschichte', INF: 'Informatik',
  };
  // [firstPeriod, length, subject, teacher, room, mark]
  const WEEK = [
    [[1,2,'MAT','GRU','204'],[3,1,'DEU','HOF','204'],[4,2,'FK','PLA','T2'],[6,1,'REL','MAI','204'],[7,2,'INF','KOF','EDV1']],
    [[1,3,'WST','OBE','W1'],[4,1,'ENG','KER','108','sub'],[5,2,'ITA','ROS','108'],[7,2,'SPO','WIE','TH'],[9,2,'GES','HUB','204']],
    [[1,1,'DEU','HOF','204'],[2,2,'MAT','GRU','204','exam'],[4,2,'FK','PLA','T2'],[6,1,'WIR','STE','112']],
    [[1,2,'ENG','KER','108'],[3,1,'PHY','LAN','L1','cancel'],[4,3,'WST','OBE','W1'],[7,1,'ITA','ROS','108'],[8,2,'INF','KOF','EDV1']],
    [[1,1,'WIR','STE','112'],[2,2,'FK','PLA','T2'],[4,1,'MAT','GRU','204'],[5,1,'DEU','HOF','204'],[6,1,'GES','HUB','204']],
    [],
  ];
  const pad = n => String(n).padStart(2, '0');
  const hm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  let id = 1000;
  const week = (iso) => {
    const [y, mo, d] = iso.split('-').map(Number);
    const days = WEEK.map((rows, i) => {
      const dt = new Date(y, mo - 1, d + i);
      const ds = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
      const gridEntries = [];
      for (const [p, len, s, t, r, mark] of rows) {
        for (let k = 0; k < len; k++) {
          const [a, b] = P[p - 1 + k];
          gridEntries.push({
            ids: [id++],
            duration: { start: `${ds}T${hm(a)}`, end: `${ds}T${hm(b)}` },
            type: mark === 'exam' ? 'EXAM' : 'NORMAL_TEACHING_PERIOD',
            status: mark === 'cancel' ? 'CANCELLED' : mark === 'sub' ? 'CHANGED' : 'REGULAR',
            position1: [{ current: { displayName: mark === 'sub' ? 'MÜL' : t, status: mark === 'sub' ? 'ADDED' : 'REGULAR' }, removed: mark === 'sub' ? { displayName: t } : null }],
            position2: [{ current: { shortName: s, longName: subj[s], displayName: s }, removed: null }],
            position3: [{ current: { displayName: r }, removed: null }],
          });
        }
      }
      return { date: ds, gridEntries };
    });
    return { days };
  };
  const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  const orig = window.__origFetch || window.fetch.bind(window);
  window.__origFetch = orig;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('webuntis/timetable')) {
      const m = url.match(/date=(\d{4}-\d{2}-\d{2})/);
      return json(week(m ? m[1] : '2026-10-19'));
    }
    if (url.includes('webuntis/absences')) return json({ absences: [] });
    if (['webuntis/', '/users/', 'activity-log', '/auth/', 'subject-images'].some(k => url.includes(k))) return json({ id: 1, username: 'test' });
    return orig(input, init);
  };
}
