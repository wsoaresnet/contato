// Define um nome e versão para o nosso cache
const CACHE_NAME = 'willian-soares-portfolio-v1';

// Lista de arquivos essenciais para o funcionamento offline
const urlsToCache = [
  '/',
  'index.html',
  'artigo-redes.html',
  'artigo-lgpd.html',
  'artigo-ia.html',
  'artigo-seguranca-digital.html',
  'artigo-informatica-mercado.html',
  'artigo-automacao.html',
  'case-junitex.html',
  'case-dreamschool.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/SplitText.min.js',
  'img/artigo-redes.jpg',
  'img/artigo-lgpd.jpg',
  'img/artigo-ia.jpg',
  'img/artigo-comunidade.jpg',
  'img/artigo-carreira.jpg',
  'img/artigo-automacao.jpg',
  'img/case-junitex.jpg',
  'img/case-dreamschool.jpg'
];

// Evento de Instalação: Ocorre quando o Service Worker é instalado.
self.addEventListener('install', event => {
  // Espera até que o cache seja aberto e todos os nossos arquivos sejam adicionados a ele.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com sucesso!');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Fetch: Ocorre toda vez que o navegador tenta buscar um arquivo.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar o arquivo no cache primeiro.
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna o arquivo do cache.
        if (response) {
          return response;
        }
        // Se não encontrar, busca na rede.
        return fetch(event.request);
      })
  );
});
