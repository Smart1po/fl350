/* FL350 · the first frame of an arrival.
 *
 * When a page is opened by clicking a link on this site, waiting.js leaves a
 * note in sessionStorage before the browser navigates. This runs in the <head>
 * of the next page, WITHOUT defer, so it can hold the incoming page back
 * before it paints — otherwise the departure board would be interrupted by one
 * frame of the new page, which is exactly the flash it exists to remove.
 *
 * It is deliberately tiny and deliberately paranoid. If anything at all goes
 * wrong after this point — a script fails to load, waiting.js never runs — the
 * timer below tears the cover off anyway. A broken animation must never cost
 * somebody the page underneath it.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var FRESH_MS = 9000;   // older than this is a back button, not a click
  var GIVE_UP_MS = 4000;

  var arriving = false;
  try {
    var raw = sessionStorage.getItem('fl350.transit');
    if (raw) {
      var note = JSON.parse(raw);
      arriving = !!(note && (Date.now() - Number(note.at || 0)) < FRESH_MS);
    }
  } catch (e) {
    arriving = false;
  }

  if (!arriving) return;

  html.classList.add('arriving');
  window.setTimeout(function () { html.classList.remove('arriving'); }, GIVE_UP_MS);
})();
