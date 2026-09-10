/* FL350 · the boarding pass, in one place.
 *
 * The locker renders a list of these and the share page renders exactly one,
 * so the markup lives here rather than twice. What differs between the two is
 * passed in: the share page gets no actions and, more importantly, no note.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var ICON = {
    plane:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-1.7l-7.5-4.4V4.2a1.3 1.3 0 0 0-2.6 0v5.2L3.4 13.8v1.7l7.5-2.2v4.4l-2.1 1.5v1.2l3.4-1 3.4 1v-1.2l-2.1-1.5v-4.4l7.5 2.2Z"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/></svg>',
    window:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="7"/><path d="M6.5 14.5c2.5-1.6 4.2-1.6 5.5 0s3 1.6 5.5 0"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5"/><path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>',
    empty:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 15.5 21 9M7.5 12.8 5 8l2.2-.6 3 3.1M14 19l1.4-4.4"/><rect x="2.5" y="19.5" width="19" height="1.6" rx=".8" fill="currentColor" stroke="none"/></svg>'
  };

  function ui() { return FL.ui; }
  function geo() { return FL.geo; }

  function legKm(flight) {
    if (!geo() || !ui()) return null;
    return ui().greatCircleKm(geo().airport(flight.from_iata), geo().airport(flight.to_iata));
  }

  function fact(label, value) {
    var esc = ui().esc;
    return '<div class="fact"><dt>' + esc(label) + '</dt><dd class="ltr">' + esc(value) + '</dd></div>';
  }

  // Decorative only. Bar widths come from the row id, so a pass always looks
  // the same as itself and different from its neighbour. Classes rather than
  // inline styles, because the policy on this site forbids a style attribute.
  function barcode(seed) {
    var text = String(seed || '');
    var bars = '';
    for (var i = 0; i < 34; i++) {
      var code = text.charCodeAt(i % Math.max(1, text.length)) || 65;
      bars += (code + i) % 3 === 0 ? '<i class="b2"></i>' : '<i></i>';
    }
    return '<div class="barcode" aria-hidden="true">' + bars + '</div>';
  }

  /* --------------------------------------------------------------- markup */

  // opts: { tag, note, actions, photo, shareState }
  function markup(flight, opts) {
    opts = opts || {};
    var esc = ui().esc;
    var tag = opts.tag || 'li';
    var from = geo().airport(flight.from_iata);
    var to = geo().airport(flight.to_iata);
    var km = legKm(flight);

    var facts = [];
    if (flight.aircraft) facts.push(fact('Aircraft', flight.aircraft));
    if (km !== null) facts.push(fact('Distance', ui().number(km) + ' km'));
    if (from && to) facts.push(fact('Route', from.city + ' to ' + to.city));

    var actions = '';
    if (opts.actions) {
      actions =
        '<div class="pass-actions">' +
          '<button type="button" class="btn btn-ghost" data-window="' + esc(flight.id) + '" title="Look out of the window">' +
            ICON.window + '<span class="visually-hidden">Window seat</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost" data-share="' + esc(flight.id) + '"' +
            (flight.is_public ? ' data-on="true" title="Shared — open to anyone with the link"' : ' title="Share this flight"') + '>' +
            ICON.share + '<span class="visually-hidden">Share</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost" data-edit="' + esc(flight.id) + '">Edit</button>' +
          '<button type="button" class="btn btn-ghost" data-delete="' + esc(flight.id) + '">Delete</button>' +
        '</div>';
    }

    var photo = '';
    if (opts.photo && flight.photo_path) {
      // The image itself arrives later: the bucket is private, so the source
      // has to be a signed link fetched after this markup is on the page.
      photo =
        '<figure class="pass-photo" data-photo="' + esc(flight.photo_path) + '">' +
          '<div class="skeleton pass-photo-wait"></div>' +
        '</figure>';
    }

    return (
      '<' + tag + ' class="pass">' +
        '<div class="pass-main">' +
          '<div class="pass-head">' +
            '<span class="pass-airline">' + esc(flight.airline) + '</span>' +
            '<span class="pass-flightno ltr">' + esc(flight.flight_no) + '</span>' +
            (flight.is_public
              ? '<span class="pass-flag" title="Open to anyone with the link">Shared</span>'
              : '') +
            '<span class="pass-date">' + esc(formatDay(flight.flown_on)) + '</span>' +
          '</div>' +
          '<div class="route">' +
            '<div class="route-end">' +
              '<div class="route-iata ltr">' + esc(flight.from_iata) + '</div>' +
              '<div class="route-city">' + esc(from ? from.city : 'Unlisted airport') + '</div>' +
            '</div>' +
            '<div class="route-line" aria-hidden="true">' + ICON.plane + '</div>' +
            '<div class="route-end to">' +
              '<div class="route-iata ltr">' + esc(flight.to_iata) + '</div>' +
              '<div class="route-city">' + esc(to ? to.city : 'Unlisted airport') + '</div>' +
            '</div>' +
          '</div>' +
          (facts.length ? '<dl class="pass-facts">' + facts.join('') + '</dl>' : '') +
          photo +
          (opts.note && flight.note
            ? '<div class="pass-note">' + ICON.lock + '<p>' + esc(flight.note) + '</p></div>'
            : '') +
        '</div>' +
        '<div class="pass-stub">' +
          '<dl class="stub-seat"><dt>Seat</dt><dd class="ltr">' + esc(flight.seat || '—') + '</dd></dl>' +
          barcode(flight.id || flight.flight_no) +
          actions +
        '</div>' +
      '</' + tag + '>'
    );
  }

  function formatDay(value) {
    // Arabic month names when the interface is in Arabic, if that module is loaded.
    if (FL.i18n && typeof FL.i18n.formatDay === 'function') return FL.i18n.formatDay(value);
    return ui().formatDay(value);
  }

  /* -------------------------------------------------------------- photos */

  // Turns every <figure data-photo="..."> inside a container into a real image
  // by asking for a signed link. A failure leaves a caption rather than a
  // broken image icon.
  function hydratePhotos(container) {
    if (!container || !FL.photos) return;
    var pending = container.querySelectorAll('[data-photo]');

    Array.prototype.forEach.call(pending, function (figure) {
      if (figure.getAttribute('data-hydrated') === '1') return;
      figure.setAttribute('data-hydrated', '1');
      var path = figure.getAttribute('data-photo');

      FL.photos.signedUrl(path, 3600).then(
        function (url) {
          var img = document.createElement('img');
          img.className = 'pass-photo-img';
          img.alt = 'A photograph attached to this flight.';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.onload = function () { figure.setAttribute('data-ready', '1'); };
          img.onerror = function () { figure.innerHTML = '<figcaption class="caption">That photograph could not be opened.</figcaption>'; };
          img.src = url;
          figure.innerHTML = '';
          figure.appendChild(img);
        },
        function () {
          figure.innerHTML = '<figcaption class="caption">That photograph could not be opened.</figcaption>';
        }
      );
    });
  }

  FL.pass = {
    markup: markup,
    hydratePhotos: hydratePhotos,
    icon: ICON,
    legKm: legKm
  };
})();
