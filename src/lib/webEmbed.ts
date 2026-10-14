// Many sites refuse iframe embedding (X-Frame-Options). Convert known sites
// to their embeddable variants; everything else is tried as-is with an
// "open externally" fallback in the UI.
export const GOOGLE_HOME = 'https://www.google.com/webhp?igu=1';
export const googleSearch = (q: string) => `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;

export function toEmbeddable(raw: string): string {
  let s = raw.trim();
  if (!s) return GOOGLE_HOME;
  if (!/^https?:\/\//i.test(s)) {
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(s)) s = `https://${s}`;
    else return googleSearch(s);
  }
  let u: URL;
  try { u = new URL(s); } catch { return googleSearch(raw); }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'google.com' || host.endsWith('.google.com') && host.startsWith('google')) {
    if (u.pathname.startsWith('/maps')) return `https://maps.google.com/maps?q=${encodeURIComponent(u.searchParams.get('q') || 'Agrigento')}&output=embed`;
    u.searchParams.set('igu', '1');
    if (u.pathname === '/' ) u.pathname = '/webhp';
    return u.toString();
  }
  if (host === 'maps.google.com') { u.searchParams.set('output', 'embed'); return u.toString(); }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
    const q = u.searchParams.get('search_query');
    if (q) return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}`;
  }
  if (host === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
  if (host === 'open.spotify.com' && !u.pathname.startsWith('/embed')) return `https://open.spotify.com/embed${u.pathname}`;
  if (host.endsWith('wikipedia.org')) return s; // allows framing
  return s;
}
