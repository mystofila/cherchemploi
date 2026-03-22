// Netlify Serverless Function — pas Edge Function

const handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-ft-token',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    if (action === 'token') {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FT_CLIENT_ID,
        client_secret: process.env.FT_CLIENT_SECRET,
        scope: 'api_offresdemploiv2 o2dsoffre',
      });
      const res = await fetch(
        'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }
      );
      const data = await res.json();
      return { statusCode: res.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    if (action === 'search') {
      const token = event.headers['x-ft-token'];
      if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token manquant' }) };
      const sp = new URLSearchParams({ motsCles: params.motsCles||'', distance: params.distance||'30', range: '0-49', sort: '1' });
      if (params.commune) sp.set('commune', params.commune);
      if (params.typeContrat) sp.set('typeContrat', params.typeContrat);
      const res = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${sp}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      const data = await res.json();
      return { statusCode: res.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Action inconnue' }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

module.exports = { handler };
