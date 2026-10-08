// 每次更新代码时改这个版本号，强制刷新缓存
const CACHE_VERSION = 'ganglei-v2'
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

// 运行时缓存策略：Stale-While-Revalidate
// 先返回缓存，同时后台更新；首次访问后离线可用
self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  // 导航请求优先返回缓存的 index.html，保证离线可打开
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetchPromise
      }),
    )
    return
  }

  // 其他资源（JS/CSS/图片/字体等）用 SWR 策略
  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    }),
  )
})
