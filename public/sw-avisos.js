// Recepción de avisos en el móvil/ordenador (lo carga el service worker de la app).
self.addEventListener('push', (evento) => {
  let datos = { titulo: 'Bolsa Sur', cuerpo: 'Hay novedades en SIPRI.', url: '/' };
  try {
    datos = { ...datos, ...evento.data.json() };
  } catch {
    /* aviso sin datos: se usa el texto por defecto */
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: '/icono-192.png',
      badge: '/favicon-32.png',
      data: { url: datos.url },
      tag: 'bolsa-sur', // un aviso nuevo sustituye al anterior: no se acumulan
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = evento.notification.data?.url || '/';
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) if ('focus' in v) return v.focus();
      return self.clients.openWindow(url);
    }),
  );
});
