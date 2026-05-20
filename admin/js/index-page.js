
(async function() {
  const user = await admin.init();
  if (!user) return;

  // Fetch counts in parallel
  const [showsRes, perfRes, ensRes, awardsRes, sponsorsRes] = await Promise.all([
    sb.from('shows').select('id', { count: 'exact', head: true }),
    sb.from('performances').select('id', { count: 'exact', head: true }).gte('performance_date', new Date().toISOString().slice(0,10)),
    sb.from('ensemble_members').select('id', { count: 'exact', head: true }).eq('active', true),
    sb.from('awards').select('id', { count: 'exact', head: true }),
    sb.from('sponsors').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  const cards = [
    { href: 'predstave.html',   title: 'Predstave',  sub: 'Upravljaj predstave in cene',   count: showsRes.count   ?? '–' },
    { href: 'termini.html',     title: 'Termini',    sub: 'Prihajajoči datumi predstav',   count: perfRes.count    ?? '–' },
    { href: 'ansambel.html',    title: 'Članstvo',   sub: 'Aktivni člani in članice',      count: ensRes.count     ?? '–' },
    { href: 'nagrade.html',     title: 'Nagrade',    sub: 'Vse priznane nagrade',           count: awardsRes.count  ?? '–' },
    { href: 'sponzorji.html',   title: 'Sponzorji',  sub: 'Aktivni sponzorji in pokrovitelji', count: sponsorsRes.count ?? '–' },
    { href: 'nastavitve.html',  title: 'Nastavitve', sub: 'Kontaktni podatki, naslovi, hero', count: null },
  ];

  document.getElementById('dashGrid').innerHTML = cards.map(c => `
    <a href="${c.href}" class="dash-card">
      <div class="dash-card__title">${c.title}</div>
      <p class="dash-card__sub">${c.sub}</p>
      ${c.count !== null ? `<div class="dash-card__num">${c.count}</div>` : ''}
    </a>
  `).join('');
})();
