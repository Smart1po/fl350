/* FL350 · the language of the interface, and the direction it runs in.
 *
 * Two decisions worth writing down, because both of them look like bugs to
 * somebody who was expecting the other answer.
 *
 * 1. Digits stay Latin in both languages. An Arabic page here shows
 *    "7,136 كم" and "14 يوليو 2026", not "٧٬١٣٦". The reason is the rest of
 *    the boarding pass: KWI, KU 681, 32A and the browser's own date field are
 *    Latin and cannot be anything else, and a card that mixes two digit
 *    systems reads worse than one that picks a side. The mono stack the
 *    numbers are set in (Consolas, Menlo, SF Mono) has no tabular
 *    Arabic-Indic digits either, so font-variant-numeric: tabular-nums would
 *    quietly stop aligning the stats column. Latin digits keep the column
 *    straight. The unit and the month name are translated; the digits are not.
 *
 * 2. Grouping is done with 'en-GB' in both languages, so the separator is a
 *    comma in Arabic too. Latin digits with an Arabic thousands mark would be
 *    a third convention nobody uses.
 *
 * Nothing here reloads the page. apply() rewrites the DOM in place and fires
 * a 'fl350:langchange' event on document so a page script can re-render the
 * rows it is already holding in memory.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var STORE = 'fl350.lang';
  var html = document.documentElement;
  var toggles = [];
  var lang = 'en';
  var booted = false;

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function trim(value) {
    return String(value).replace(/^\s+|\s+$/g, '');
  }

  // read the catalogue late, so the two files can load in either order
  function cat() {
    return FL.strings || {};
  }

  /* ------------------------------------------------------ picking a language */

  function normalise(value) {
    var tag = String(value || '').toLowerCase();
    if (tag.indexOf('ar') === 0) return 'ar';
    if (tag.indexOf('en') === 0) return 'en';
    return null;
  }

  function saved() {
    try {
      return normalise(localStorage.getItem(STORE));
    } catch (e) {
      return null;
    }
  }

  function remember(value) {
    try {
      localStorage.setItem(STORE, value);
    } catch (e) {
      /* private browsing refused storage; the choice lasts this page only */
    }
  }

  // On a first visit, Arabic only when the browser asks for Arabic before it
  // asks for English. A list like ['fr-FR', 'en-GB'] is not a request for
  // Arabic, and neither is one with no Arabic in it at all.
  function preferred() {
    var list =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || navigator.userLanguage || 'en'];
    for (var i = 0; i < list.length; i++) {
      var hit = normalise(list[i]);
      if (hit) return hit;
    }
    return 'en';
  }

  /* ------------------------------------------------------------- formatting */

  function number(value) {
    var n = Number(value || 0);
    if (!isFinite(n)) return '';
    try {
      return n.toLocaleString('en-GB');
    } catch (e) {
      return String(n);
    }
  }

  // 'YYYY-MM-DD' by hand, for the same reason ui.js does it by hand: passing
  // that string to new Date() reads it as UTC and can slide a day backwards.
  function formatDay(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    if (!m) return '';
    return Number(m[3]) + ' ' + t('month.' + Number(m[2])) + ' ' + Number(m[1]);
  }

  /* --------------------------------------------------------------- plurals */

  // English needs one and other. Arabic needs six, and gets them wrong in a
  // way people notice: "3 رحلة" instead of "3 رحلات".
  function category(count) {
    if (window.Intl && window.Intl.PluralRules) {
      try {
        return new window.Intl.PluralRules(lang).select(count);
      } catch (e) {
        /* fall through to the hand-written rules */
      }
    }
    if (lang !== 'ar') return count === 1 ? 'one' : 'other';
    var mod100 = count % 100;
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    if (count === 2) return 'two';
    if (mod100 >= 3 && mod100 <= 10) return 'few';
    if (mod100 >= 11 && mod100 <= 99) return 'many';
    return 'other';
  }

  /* ------------------------------------------------------------ the lookup */

  // {year} is the one placeholder never grouped — a year is a label, not a
  // quantity, and '2,026' would be wrong in either language.
  function fill(text, vars) {
    if (!vars) return String(text);
    return String(text).replace(/\{(\w+)\}/g, function (whole, name) {
      if (!Object.prototype.hasOwnProperty.call(vars, name)) return whole;
      var value = vars[name];
      if (typeof value === 'number') return name === 'year' ? String(value) : number(value);
      return value === null || value === undefined ? '' : String(value);
    });
  }

  function t(key, vars) {
    var entry = cat()[key];
    if (!entry) return key; // a missing key showing itself is louder than silence
    var value = entry[lang];
    if (value === undefined || value === null) value = entry.en;

    if (value && typeof value === 'object') {
      // the noun agrees with {count} when the caller gives one, otherwise with
      // {n}. "3 of 12 flights" needs the 12: in Arabic the word after 12 is
      // singular and the word after 3 is plural, so agreeing with the wrong
      // number of the two is a mistake a reader hears immediately.
      var count = 0;
      if (vars && typeof vars.count === 'number') count = vars.count;
      else if (vars && typeof vars.n === 'number') count = vars.n;

      var picked = value[category(count)];
      if (picked === undefined) picked = value.other;
      if (picked === undefined) picked = value.one;
      value = picked || '';
    }

    return fill(value, vars);
  }

  function plural(key, count, vars) {
    var all = { n: count };
    if (vars) {
      for (var name in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, name)) all[name] = vars[name];
      }
    }
    return t(key, all);
  }

  /* ------------------------------------------------------- swapping the DOM */

  // data-i18n="key"                     → textContent
  // data-i18n-html="key"                → innerHTML, for the few sentences
  //                                       that carry a <strong> or a mono span
  // data-i18n-attr="placeholder:key"    → any attribute, several separated by
  //                                       a semicolon or a comma
  function translate(root) {
    var scope = root || document;

    each(scope.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });

    each(scope.querySelectorAll('[data-i18n-html]'), function (node) {
      node.innerHTML = t(node.getAttribute('data-i18n-html'));
    });

    each(scope.querySelectorAll('[data-i18n-attr]'), function (node) {
      each(node.getAttribute('data-i18n-attr').split(/[;,]/), function (pair) {
        var bits = pair.split(':');
        if (bits.length < 2) return;
        var attr = trim(bits[0]);
        var key = trim(bits[1]);
        if (attr && key) node.setAttribute(attr, t(key));
      });
    });
  }

  /* --------------------------------------------------------- the theme button */

  // ui.js writes the theme button's title and its hidden label in English and
  // rewrites them on every click. This module owns neither file, so it puts
  // the translated wording back afterwards instead of editing ui.js.
  function retitleTheme() {
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    var dark = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('title', t(dark ? 'theme.toLight' : 'theme.toDark'));
    var label = button.querySelector('.visually-hidden');
    if (label) label.textContent = t('theme.label');
  }

  function watchTheme() {
    var button = document.getElementById('theme-toggle');
    if (!button || button.getAttribute('data-i18n-wired') === '1') return;
    button.setAttribute('data-i18n-wired', '1');
    // registered after ui.js has wired its own click handler, so this runs
    // once ui.js has finished repainting the button
    button.addEventListener('click', function () {
      retitleTheme();
    });
  }

  /* ------------------------------------------------------ the language switch */

  function paintToggle(button) {
    var arabic = lang === 'ar';
    button.setAttribute('aria-checked', arabic ? 'true' : 'false');
    button.setAttribute('aria-label', t('lang.switch.aria'));
    button.setAttribute('title', t(arabic ? 'lang.switch.toEn' : 'lang.switch.toAr'));
    each(button.querySelectorAll('.langswitch-face'), function (face) {
      if (face.getAttribute('data-face') === lang) face.setAttribute('data-active', 'true');
      else face.removeAttribute('data-active');
    });
  }

  // A switch rather than a pair of buttons: there are two languages and the
  // control says which one is on. The two faces are always written in their
  // own language, so a reader of either can find theirs without reading the
  // other one first. Arabic is first in the markup, so the mirrored layout
  // puts it on the reading edge in both directions.
  function mountToggle(button) {
    if (!button) return;
    if (button.getAttribute('data-wired') === '1') return;
    button.setAttribute('data-wired', '1');
    button.setAttribute('type', 'button');
    button.setAttribute('role', 'switch');
    if (button.className.indexOf('langswitch') === -1) {
      button.className = button.className ? button.className + ' langswitch' : 'langswitch';
    }

    button.innerHTML =
      '<span class="langswitch-face" data-face="ar" lang="ar">' + t('lang.name.ar') + '</span>' +
      '<span class="langswitch-face" data-face="en" lang="en">' + t('lang.name.en') + '</span>';

    // the markup may ship it hidden, so that a reader with no JavaScript is
    // never offered a switch that cannot do anything
    button.removeAttribute('hidden');

    button.addEventListener('click', function () {
      apply(lang === 'ar' ? 'en' : 'ar');
      // the button keeps focus, and aria-checked flipping is what a screen
      // reader announces — nothing moves and nothing reloads
    });

    toggles.push(button);
    paintToggle(button);
  }

  /* ---------------------------------------------------------------- applying */

  function dir() {
    return lang === 'ar' ? 'rtl' : 'ltr';
  }

  function announce() {
    var detail = { lang: lang, dir: dir() };
    var event;
    if (typeof window.CustomEvent === 'function') {
      event = new window.CustomEvent('fl350:langchange', { detail: detail });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('fl350:langchange', true, false, detail);
    }
    document.dispatchEvent(event);
  }

  function apply(next) {
    var wanted = normalise(next) || lang;
    lang = wanted;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir());
    remember(lang);

    // before the body exists there is nothing to swap; the sweep happens on
    // DOMContentLoaded instead
    if (document.body) {
      translate(document);
      retitleTheme();
      each(toggles, function (button) {
        paintToggle(button);
      });
    }

    // the first pass is the page arriving, not a change of mind, so page
    // scripts are not asked to re-render before they have rendered once
    if (booted) announce();
    return lang;
  }

  /* -------------------------------------------------------------------- boot */

  lang = saved() || preferred();
  html.setAttribute('lang', lang);
  html.setAttribute('dir', dir());

  function ready() {
    apply(lang);
    watchTheme();
    mountToggle(document.getElementById('lang-toggle'));
    // ui.js paints the theme button from its own DOMContentLoaded handler,
    // which was registered after this one; catch up once that has run
    window.setTimeout(retitleTheme, 0);
    booted = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  FL.i18n = {
    apply: apply,
    current: function () {
      return lang;
    },
    dir: dir,
    t: t,
    plural: plural,
    number: number,
    formatDay: formatDay,
    translate: translate,
    mountToggle: mountToggle
  };
})();
