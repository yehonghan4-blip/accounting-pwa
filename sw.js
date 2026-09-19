// 会计工作台 - Service Worker
const CACHE_NAME = 'accounting-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装：预缓存所有资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求：优先用缓存，离线也能用
self.addEventListener('fetch', function(event) {
  // 非 GET 请求不处理
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // 有缓存先用缓存，同时后台更新
      const fetchPromise = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });

      return cached || fetchPromise;
    })
  );
});
