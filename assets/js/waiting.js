/* FL350 · the wait between one page and the next.
 *
 * A real page load, dressed as a departure board. Clicking an internal link
 * puts the board up, writes where you are going into sessionStorage, and then
 * navigates; the next page reads that note before it paints and keeps the
 * board on screen until it is ready. Two documents, one continuous moment.
 *
 * Everything here is an enhancement. The links are ordinary links and the form
 * is an ordinary form — turn this file off and the site still works, it just
 * flashes white between pages like everything else.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var TRANSIT_KEY = 'fl350.transit';
  var TRANSIT_FRESH_MS = 9000;   // an older note is a back button, not a click
  var MIN_ON_SCREEN_MS = 620;    // long enough to read; short enough not to annoy
  var HARD_LIMIT_MS = 6000;      // never hold the page hostage

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  var el = null;      // the overlay, once mounted
  var shownAt = 0;
  var leaving = false;
  var hardTimer = null;

  /* ------------------------------------------------------------- wording */

  // Every string goes through the catalogue when it is loaded, and falls back
  // to the English literal when it is not, the same way pass.js does.
  function t(key, fallback) {
    if (FL.i18n && typeof FL.i18n.t === 'function') {
      var value = FL.i18n.t(key);
      if (value && value !== key) return value;
    }
    return fallback;
  }

  function isArabic() {
    return document.documentElement.getAttribute('lang') === 'ar';
  }

  // What the board should read for a given address on this site. The query
  // matters as well as the path: /login and /login?mode=signup are two
  // different errands.
  function destinationFor(path, search) {
    search = search || '';
    if (/^\/logbook/.test(path)) {
      return { word: 'YOUR LOCKER', status: t('wait.logbook', 'Opening your locker') };
    }
    if (/^\/login/.test(path)) {
      if (/mode=signup/.test(search)) {
        return { word: 'NEW LOCKER', status: t('wait.signup', 'Finding you a locker') };
      }
      return { word: 'SIGN IN', status: t('wait.login', 'Taking you to the door') };
    }
    if (/^\/f\//.test(path)) {
      return { word: 'BOARDING PASS', status: t('wait.share', 'Fetching that boarding pass') };
    }
    if (path === '/' || /^\/index/.test(path)) {
      return { word: 'FL350', status: t('wait.home', 'Back to the front') };
    }
    return { word: 'FL350', status: t('wait.generic', 'One moment') };
  }

  /* -------------------------------------------------------------- markup */

  var PLANE =
    '<path class="wait-arc-plane" d="M8.2 0 L-4 3.4 L-4 1.4 L-1.2 0 L-4 -1.4 L-4 -3.4 Z"/>';

  function arcMarkup() {
    // One quarter-ellipse. The path is declared twice — once as the dashed
    // route and once as the gold run — and handed to the aeroplane as an
    // offset-path through a custom property, so all three agree by
    // construction rather than by somebody keeping them in step.
    var d = 'M6 46 C 60 6, 200 6, 254 46';
    return (
      '<div class="wait-arc" aria-hidden="true">' +
        '<svg viewBox="0 0 260 52" fill="none">' +
          '<path class="wait-arc-line" d="' + d + '"/>' +
          '<path class="wait-arc-run"  d="' + d + '"/>' +
          '<circle class="wait-arc-dot" cx="6" cy="46" r="2.6"/>' +
          '<circle class="wait-arc-dot" cx="254" cy="46" r="2.6"/>' +
          '<g>' + PLANE + '</g>' +
        '</svg>' +
      '</div>'
    );
  }

  function mount() {
    if (el) return el;

    el = document.createElement('div');
    el.className = 'wait';
    el.id = 'wait';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    el.innerHTML =
      '<div class="sky wait-sky" aria-hidden="true">' +
        '<div class="sky-air"></div><div class="sky-stars"></div>' +
        '<div class="sky-clouds"></div><div class="sky-sun"></div>' +
        '<div class="sky-lamp sky-lamp-port"></div>' +
        '<div class="sky-lamp sky-lamp-stbd"></div>' +
      '</div>' +
      '<div class="wait-inner">' +
        '<p class="wait-mark">FL<span>350</span></p>' +
        '<div class="wait-board" id="wait-board" aria-hidden="true"></div>' +
        '<p class="wait-word" id="wait-word" hidden></p>' +
        arcMarkup() +
        '<p class="wait-status" id="wait-status"></p>' +
      '</div>';

    document.body.appendChild(el);

    // Hand the arc's own geometry to the animation, so the aeroplane follows
    // exactly the line that is drawn rather than a copy of it.
    var run = el.querySelector('.wait-arc-run');
    var plane = el.querySelector('.wait-arc-plane');
    if (run && plane && run.getTotalLength) {
      var length = run.getTotalLength();
      run.style.setProperty('--arc-len', length.toFixed(1));
      plane.style.setProperty('--arc-path', 'path("' + run.getAttribute('d') + '")');
    }

    return el;
  }

  /* ---------------------------------------------------------- the board */

  var boardTimers = [];

  function clearBoard() {
    boardTimers.forEach(function (id) { window.clearTimeout(id); });
    boardTimers = [];
  }

  function paintBoard(word) {
    var board = document.getElementById('wait-board');
    var line = document.getElementById('wait-word');
    if (!board || !line) return;

    clearBoard();

    // Arabic is cursive — one letter per cell would spell nonsense — so an
    // Arabic reader gets the sentence set large instead of the board.
    if (isArabic()) {
      board.hidden = true;
      board.innerHTML = '';
      line.hidden = false;
      line.textContent = word;
      return;
    }

    line.hidden = true;
    board.hidden = false;

    var letters = String(word).toUpperCase().split('');
    board.innerHTML = letters.map(function (ch) {
      return '<span class="flap"' + (ch === ' ' ? ' data-space="true"' : '') + '>' +
             '<span class="flap-face">' + (ch === ' ' ? '&nbsp;' : ch) + '</span></span>';
    }).join('');

    var cells = board.querySelectorAll('.flap');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    Array.prototype.forEach.call(cells, function (cell, index) {
      var target = letters[index];
      if (target === ' ') return;

      var face = cell.querySelector('.flap-face');
      var turns = 4 + (index % 5);           // a longer run the further along
      var step = 62;
      var start = index * 45;

      for (var turn = 0; turn < turns; turn++) {
        (function (turnIndex) {
          boardTimers.push(window.setTimeout(function () {
            face.textContent = GLYPHS.charAt(Math.floor((index * 7 + turnIndex * 13) % GLYPHS.length));
            cell.setAttribute('data-turning', 'true');
            window.setTimeout(function () { cell.removeAttribute('data-turning'); }, step - 4);
          }, start + turnIndex * step));
        })(turn);
      }

      boardTimers.push(window.setTimeout(function () {
        face.textContent = target;
        cell.setAttribute('data-settled', 'true');
        window.setTimeout(function () { cell.removeAttribute('data-settled'); }, 540);
      }, start + turns * step));
    });
  }

  /* ----------------------------------------------------------- show/hide */

  function show(spec) {
    spec = spec || {};
    mount();
    leaving = false;
    el.removeAttribute('data-leaving');
    el.hidden = false;
    document.documentElement.classList.remove('arriving');

    var status = document.getElementById('wait-status');
    if (status) status.textContent = spec.status || '';
    paintBoard(spec.word || 'FL350');

    shownAt = Date.now();

    window.clearTimeout(hardTimer);
    hardTimer = window.setTimeout(hide, HARD_LIMIT_MS);
  }

  function hide() {
    document.documentElement.classList.remove('arriving');
    if (!el || leaving || el.hidden) return;

    var waited = Date.now() - shownAt;
    if (waited < MIN_ON_SCREEN_MS) {
      window.setTimeout(hide, MIN_ON_SCREEN_MS - waited);
      return;
    }

    leaving = true;
    window.clearTimeout(hardTimer);
    clearBoard();
    el.setAttribute('data-leaving', 'true');
    window.setTimeout(function () {
      if (!el) return;
      el.hidden = true;
      leaving = false;
    }, 340);
  }

  /* -------------------------------------------------- leaving this page */

  function samePagePath(href) {
    var url;
    try { url = new URL(href, location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;
    if (!/^https?:$/.test(url.protocol)) return null;
    return { path: url.pathname, search: url.search };
  }

  function goingTo(path, spec) {
    try {
      sessionStorage.setItem(TRANSIT_KEY, JSON.stringify({
        to: path, word: spec.word, status: spec.status, at: Date.now()
      }));
    } catch (e) {
      /* private mode; the board simply will not carry across */
    }
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.getAttribute('rel') === 'external') return;

    var target = samePagePath(link.getAttribute('href'));
    if (!target) return;

    var spec = destinationFor(target.path, target.search);
    event.preventDefault();
    goingTo(target.path + target.search, spec);
    show(spec);

    // Let the board get one frame up before the browser starts tearing the
    // page down, or the transition is invisible on a fast connection.
    window.setTimeout(function () { location.href = link.href; }, 90);
  });

  // The door: signing in is the one form worth covering, because it is the
  // one that goes somewhere afterwards.
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.id !== 'auth-form') return;
    var mode = document.getElementById('tab-signup');
    var creating = mode && mode.getAttribute('aria-selected') === 'true';
    show({
      word: 'YOUR LOCKER',
      status: creating
        ? t('wait.creating', 'Building your locker')
        : t('wait.signingin', 'Checking your key')
    });
    // If the sign-in fails the page stays put, so the board must come down.
    window.setTimeout(function () {
      var alertBox = document.getElementById('auth-alert');
      if (alertBox && !alertBox.hidden) hide();
    }, 900);
  }, true);

  /* -------------------------------------------------- arriving at a page */

  function arrival() {
    var note = null;
    try {
      var raw = sessionStorage.getItem(TRANSIT_KEY);
      if (raw) note = JSON.parse(raw);
      sessionStorage.removeItem(TRANSIT_KEY);
    } catch (e) {
      note = null;
    }

    var arriving = document.documentElement.classList.contains('arriving');
    if (!note && !arriving) return false;

    var fresh = note && (Date.now() - Number(note.at || 0)) < TRANSIT_FRESH_MS;
    var spec = fresh
      ? { word: note.word, status: note.status }
      : destinationFor(location.pathname, location.search);

    show(spec);
    return true;
  }

  function ready() {
    var carried = arrival();

    // The locker has work to do after the document is parsed — it verifies the
    // session and fetches the rows — so it is given until window.load. Every
    // other page is ready when it is parsed.
    var gated = document.documentElement.getAttribute('data-gated') === 'true';

    if (!carried && !gated) return;

    if (document.readyState === 'complete') {
      window.setTimeout(hide, gated ? 260 : 0);
    } else {
      window.addEventListener('load', function () {
        window.setTimeout(hide, gated ? 260 : 0);
      });
    }
  }

  // Coming back with the back button hands you a restored page, and the
  // overlay from before must not still be sitting on top of it.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      document.documentElement.classList.remove('arriving');
      if (el) { el.hidden = true; leaving = false; }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  FL.waiting = {
    show: show,
    hide: hide,
    forPath: destinationFor
  };
})();
