// IndexNow (https://www.indexnow.org): tells Bing, Yandex, Seznam, Naver and
// others right away when pages change, instead of waiting for their next crawl.
// Off unless INDEXNOW_KEY is set; the key is public by design (it only proves
// that the site owner sent the ping).

const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/;

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && KEY_RE.test(key) ? key : null;
}
