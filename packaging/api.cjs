// Queries the configured breach API. `fetchImpl` and `env` are parameters so tests can run offline.
async function checkLeak(apiUrl, query, { fetchImpl = fetch, env = process.env, log = console.error } = {}) {
  try {
    const url = new URL(apiUrl);
    url.searchParams.set('check', query);
    // Optional provider API key, sent as a header so it never appears in URLs or logs
    const headers = env.LEAKCHECK_API_KEY
      ? { [env.LEAKCHECK_API_KEY_HEADER || 'X-API-Key']: env.LEAKCHECK_API_KEY }
      : {};
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(15000) });
    // providers rate-limit per key; say so plainly instead of a bare status code
    if (response.status === 429) return { error: 'The breach API rate limit was reached, try again in a minute' };
    if (response.status === 401 || response.status === 403) return { error: 'The breach API rejected the request (check LEAKCHECK_API_KEY)' };
    if (!response.ok) return { error: `API returned status ${response.status}` };
    const data = await response.json().catch(() => null);
    // createEmbed relies on a boolean "found"; anything else means the provider speaks a different format
    if (!data || typeof data.found !== 'boolean') return { error: 'Unexpected response from the breach API (missing "found")' };
    return data;
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Breach API did not answer within 15 seconds' };
    // undici only says "fetch failed"; the real reason (ENOTFOUND, ECONNREFUSED...) is in e.cause
    log('Breach API request failed:', e.cause || e);
    if (e.cause?.code) return { error: `Could not reach the breach API (${e.cause.code})` };
    return { error: e.message };
  }
}

module.exports = { checkLeak };
