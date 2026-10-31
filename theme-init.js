/* developingdvlpr token spine: sets theme + surface on the html element before
   first paint. Inline this file in a script tag in head, with the surface named
   on that tag as data-surface="teach" (see README). Unknown or missing surface
   falls back to "portfolio". */
(function () {
  var SURFACES = ['portfolio', 'learn', 'teach', 'build'];
  var script = document.currentScript;
  var surface = script && script.getAttribute('data-surface');
  if (SURFACES.indexOf(surface) === -1) surface = 'portfolio';

  var theme;
  try {
    theme = localStorage.getItem('theme');
  } catch (_) {}
  if (theme !== 'dark' && theme !== 'light') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var html = document.documentElement;
  html.classList.remove('dark', 'light');
  html.classList.add(theme);
  html.setAttribute('data-theme', theme);
  html.setAttribute('data-surface', surface);
})();
