// FL350 · where the front end learns the address of the database.
//
// The two values below are set in the Vercel project, not in this repository:
//   SUPABASE_URL               https://<project-ref>.supabase.co
//   SUPABASE_PUBLISHABLE_KEY   sb_publishable_...
//
// The publishable key is meant to ship to every visitor's browser. What keeps
// the flights private is row level security in the database, not secrecy here.
// The secret (service_role) key bypasses every policy and must never be added
// to this project, this repository, or any variable the browser can reach.
//
// Environment variables only reach the NEXT build. Change one, then redeploy.

module.exports = function handler(request, response) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(500).json({
      error: 'not_configured',
      missing: [!url && 'SUPABASE_URL', !key && 'SUPABASE_PUBLISHABLE_KEY'].filter(Boolean),
      hint: 'Add these in the Vercel project under Settings, Environment Variables, then redeploy. Variables only reach the next build.'
    });
    return;
  }

  // A last guard against the one mistake that would matter: a secret key
  // pasted into the publishable slot. Refuse to serve it rather than leak it.
  if (/^(sb_secret_|eyJ.*service_role)/.test(key) || key.includes('service_role')) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(500).json({
      error: 'wrong_key',
      hint: 'SUPABASE_PUBLISHABLE_KEY looks like a secret key. Replace it with the publishable key and redeploy.'
    });
    return;
  }

  response.status(200).json({ url: url.replace(/\/+$/, ''), key: key });
};
