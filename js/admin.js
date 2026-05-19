/* =============================================================
   Shared admin utilities — auth guard, CRUD helpers, toast
   =============================================================
   Loads after supabase-client.js and data.js. Pages should
   call adminInit() before rendering their content.
   ============================================================= */

const admin = {
  user: null,
  isAdmin: false,

  /**
   * Sign-in guard. Call this at top of every admin page.
   * If not signed in, redirects to /admin/login.html.
   * If signed in but not in admin_users allowlist, shows an error.
   * Returns the user object once verified.
   */
  async init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    this.user = session.user;

    // Verify allowlist membership
    const { data: row, error } = await sb.from('admin_users')
      .select('*').eq('email', session.user.email.toLowerCase()).maybeSingle();

    if (error || !row) {
      document.body.innerHTML = `
        <div style="max-width:500px; margin:5rem auto; padding:2rem; background:#fff; border-radius:8px; box-shadow:0 20px 40px -10px rgba(0,0,0,.2); font-family:system-ui;">
          <h2 style="margin-top:0; color:#cd1b39;">Nimate dovoljenja</h2>
          <p>E-naslov <strong>${session.user.email}</strong> ni v seznamu skrbnikov gledališča Zarja Celje.</p>
          <p>Če menite, da gre za napako, kontaktirajte administratorja na <a href="mailto:info@kud-zarja.si">info@kud-zarja.si</a>.</p>
          <button onclick="admin.signOut()" style="margin-top:1rem; padding:.6rem 1.2rem; background:#cd1b39; color:#fff; border:none; border-radius:4px; cursor:pointer;">Odjavi se</button>
        </div>
      `;
      return null;
    }

    this.isAdmin = true;
    this._renderUserChip();
    return this.user;
  },

  _renderUserChip() {
    const el = document.getElementById('adminUserEmail');
    if (el) el.textContent = this.user.email;
  },

  async signOut() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
  },

  /* ---- Toast notification ---- */
  toast(message, kind = 'info') {
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'error' ? ' toast--error' : '');
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  /* ---- Confirm dialog (simple) ---- */
  confirm(message) {
    return window.confirm(message);
  },

  /* ---- Storage upload ---- */
  async uploadPoster(file, slug) {
    // Use slug + original extension; replace if exists
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${slug}.${ext}`;
    const { error } = await sb.storage.from('posters').upload(filename, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;
    const { data: { publicUrl } } = sb.storage.from('posters').getPublicUrl(filename);
    return publicUrl;
  },
};

/* ---- Slug helper (Slovenian-aware) ---- */
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z')
    .replace(/đ/g, 'dj').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
