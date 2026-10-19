const CACHE = "tm-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/offline.html", "/app-icon.svg"])),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("tm-shell-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    event.request.method !== "GET"
  )
    return;
  if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html")),
    );
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "میز کار", {
      body: data.body || "اعلان جدید دارید.",
      icon: "/app-icon.svg",
      tag: data.id,
      data: {
        url:
          typeof data.url === "string" &&
          data.url.startsWith("/") &&
          !data.url.startsWith("//")
            ? data.url
            : "/notifications",
      },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/notifications";
  const url = new URL(path, self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const client = clients.find(
          (c) => new URL(c.url).origin === self.location.origin,
        );
        if (client) {
          await client.navigate(url.href);
          return client.focus();
        }
        return self.clients.openWindow(url.href);
      }),
  );
});
