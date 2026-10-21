import type { NextRequest } from 'next/server';

// Development only: `next dev` registers the .dev.ts extension (next.config.ts),
// the static build never sees this file.
//
// `next dev` hands the API's paths on to the API, so its cookies land on
// localhost (next.config.ts rewrites them here). The browser marks a POST, even
// a same-origin one, with its Origin (http://localhost:3011), which the API's
// CORS list rightly doesn't hold: the sign-in was refused. Here the request
// goes on without it, the way a server calls the API, which still asks for
// the API key and the sign-in.

const TARGET = (process.env.API_DEV_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');

// Hop-by-hop headers, and what fetch sets on its own.
const DROP_REQUEST = new Set([
  'origin', 'host', 'connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade',
  'proxy-connection', 'proxy-authorization', 'content-length', 'accept-encoding',
]);
// fetch has already unpacked the body.
const DROP_RESPONSE = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'set-cookie']);

async function pass(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await params;
  const headers = new Headers();
  req.headers.forEach((value, key) => { if (!DROP_REQUEST.has(key)) headers.set(key, value); });
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const upstream = await fetch(`${TARGET}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
    signal: req.signal,
  });

  const out = new Headers();
  upstream.headers.forEach((value, key) => { if (!DROP_RESPONSE.has(key)) out.set(key, value); });
  // The API's cookies are Secure; over plain http from another device on the
  // network (allowedDevOrigins) the browser would drop them.
  const plain = req.nextUrl.protocol === 'http:';
  for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', plain ? cookie.replace(/;\s*Secure/gi, '') : cookie);

  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export { pass as GET, pass as HEAD, pass as POST, pass as PUT, pass as PATCH, pass as DELETE, pass as OPTIONS };
