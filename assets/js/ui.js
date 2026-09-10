/* FL350 · small shared pieces of interface: toasts, escaping, formatting,
 * the theme switch, and the button loading state.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  /* ------------------------------------------------------------- escaping */

  // Everything a member types goes through this before it reaches innerHTML.
  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* --------------------------------------------------------------- toasts */

  function toast(message, kind) {
    var host = document.getElementById('toasts');
    if (!host) return;

    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('data-kind', kind || 'good');
    el.textContent = message;
    host.appendChild(el);

    window.setTimeout(function () {
      el.style.transition = 'opacity .25s ease';
      el.style.opacity = '0';
      window.setTimeout(function () { el.remove(); }, 260);
    }, kind === 'bad' ? 6000 : 3600);
  }

  /* ------------------------------------------------------- button loading */

  function busy(button, isBusy) {
    if (!button) return;
    if (isBusy) {
      button.setAttribute('data-loading', 'true');
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
    } else {
      button.removeAttribute('data-loading');
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  }

  /* ---------------------------------------------------------- formatting */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // A date column comes back as 'YYYY-MM-DD'. Parsing that with new Date()
  // treats it as UTC and can slide a day backwards west of Greenwich, so the
  // string is split by hand instead.
  function parseDay(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    if (!m) return null;
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  }

  function formatDay(value) {
    var p = parseDay(value);
    if (!p) return '';
    return p.d + ' ' + MONTHS[p.m - 1] + ' ' + p.y;
  }

  function yearOf(value) {
    var p = parseDay(value);
    return p ? p.y : null;
  }

  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  function number(value) {
    return Number(value || 0).toLocaleString('en-GB');
  }

  /* ------------------------------------------------------------- distance */

  var EARTH_KM = 6371;

  function greatCircleKm(a, b) {
    if (!a || !b) return null;
    var toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad;
    var dLon = (b.lon - a.lon) * toRad;
    var lat1 = a.lat * toRad;
    var lat2 = b.lat * toRad;
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h))));
  }

  /* ----------------------------------------------------------------- theme */

  function mountThemeToggle(button) {
    if (!button) return;
    if (button.getAttribute('data-wired') === '1') return; // never wire twice
    button.setAttribute('data-wired', '1');

    function currentIsDark() {
      var forced = document.documentElement.getAttribute('data-theme');
      if (forced === 'dark') return true;
      if (forced === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function paint() {
      var dark = currentIsDark();
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.title = dark ? 'Switch to the light theme' : 'Switch to the dark theme';
      button.innerHTML = dark
        ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg><span class="visually-hidden">Theme</span>'
        : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 13a8.5 8.5 0 1 1-10-10 7 7 0 0 0 10 10Z"/></svg><span class="visually-hidden">Theme</span>';
    }

    button.addEventListener('click', function () {
      var next = currentIsDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('fl350.theme', next); } catch (e) {}
      paint();
    });

    paint();
  }

  // Every page has the same switch in the same corner, so wire it here once
  // rather than asking each page script to remember.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mountThemeToggle(document.getElementById('theme-toggle'));
    });
  } else {
    mountThemeToggle(document.getElementById('theme-toggle'));
  }

  FL.ui = {
    esc: esc,
    toast: toast,
    busy: busy,
    formatDay: formatDay,
    parseDay: parseDay,
    yearOf: yearOf,
    todayISO: todayISO,
    number: number,
    greatCircleKm: greatCircleKm,
    mountThemeToggle: mountThemeToggle
  };
})();
