// Service Worker（オフライン対応）
// キャッシュ名のバージョンと事前キャッシュ一覧は scripts/build-sw.mjs がビルド後に埋め込みます。
// ビルド成果物（assets/ 配下）はハッシュ付きファイル名なので、一覧をここに埋め込んで事前キャッシュします。
const CACHE_PREFIX = "pickle-asobi-";
const CACHE_NAME = `${CACHE_PREFIX}__VERSION__`;
const APP_SHELL = __PRECACHE__;
// 声（ことばごと）。アプリから { type: "voices", lang } が来たら、そのことばの声だけを入れる
const VOICES = __VOICES__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // 同じドメインには旧アプリのキャッシュもあるため、自分の古い版だけを消す
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  const list = data.type === "voices" ? VOICES[data.lang] : null;
  if (!list) return;
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const missing = [];
      for (const url of list) if (!(await cache.match(url))) missing.push(url);
      // 少しずつ入れる（1つ失敗しても、ほかは入れる）
      for (let i = 0; i < missing.length; i += 8) {
        await Promise.all(missing.slice(i, i + 8).map((url) => cache.add(url).catch(() => {})));
      }
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // 別オリジンへの通信はしないが、念のため関与しない
  if (url.origin !== self.location.origin) return;

  // ページ本体: ネット優先、オフライン時はキャッシュ済み index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // それ以外（JS/CSS/画像）: キャッシュ優先、無ければ取得してキャッシュ
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
    )
  );
});
