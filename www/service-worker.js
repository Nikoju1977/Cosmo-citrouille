const VERSION='cosmo-citrouille-v3.0.3';
const ASSETS=["./","./index.html","./styles.css","./game.js","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cosmo-citrouille-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));}return resp;})));});
