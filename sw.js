const CACHE_NAME = "chat-p2p-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// Notificações enviadas pela página (app em 2º plano)
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "notify") return;

  const title = data.title || "Chat P2P";
  const options = {
    body: data.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: data.tag || "chat-p2p",
    renotify: true,
    data: { url: data.url || "./" },
    vibrate: [120, 60, 120]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação → foca ou abre o app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.postMessage({ type: "notification-click" });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Espaço preparado para Push real (precisa de servidor + VAPID no futuro)
self.addEventListener("push", (event) => {
  let payload = { title: "Chat P2P", body: "Nova atividade" };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch (e) {
    try {
      payload.body = event.data.text();
    } catch (e2) {}
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Chat P2P", {
      body: payload.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      data: { url: payload.url || "./" }
    })
  );
});
