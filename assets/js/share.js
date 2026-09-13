/* FL350 · the share page.
 *
 * No account, no session, no table. This page knows one id and asks the share
 * door for it. Everything else about the owner's locker stays shut.
 */
(function () {
  'use strict';

  var FL = window.FL350;
  var ui = FL.ui;
  var t = FL.i18n.t;

  var title = document.getElementById('share-title');
  var sub = document.getElementById('share-sub');
  var host = document.getElementById('share-pass');

  // The heading starts life as data-i18n="share.opening" so it says something
  // sensible before this script runs. From the first time we write to it, it
  // is ours: i18n's sweep runs on DOMContentLoaded, which is AFTER the
  // synchronous showMissing() path, and would otherwise put the placeholder
  // back on top of the answer. The langchange listener below keeps it
  // translated by repainting, so nothing is lost by dropping the attribute.
  function claimTitle(text) {
    title.removeAttribute('data-i18n');
    title.textContent = text;
  }

  // What the page is currently showing, so a change of language can paint it
  // again from memory instead of asking the share door a second time.
  var shown = null;      // the flight row, once it has arrived
  var failure = null;    // the error, if the door answered with one instead
  var missing = false;   // the link opens nothing, and said so

  // The link is /f/<uuid>, and /share.html?id=<uuid> is accepted too so the
  // page still works if the rewrite is ever removed.
  function shareIdFromLocation() {
    var fromPath = /\/f\/([0-9a-fA-F-]{36})\/?$/.exec(location.pathname);
    if (fromPath) return fromPath[1].toLowerCase();
    var fromQuery = new URLSearchParams(location.search).get('id') || '';
    return /^[0-9a-fA-F-]{36}$/.test(fromQuery) ? fromQuery.toLowerCase() : null;
  }

  function state(spec) {
    return (
      '<div class="state' + (spec.bad ? ' state-bad' : '') + '" role="status">' +
      '<div class="state-icon">' + spec.icon + '</div>' +
      '<h2>' + ui.esc(spec.heading) + '</h2>' +
      '<p>' + ui.esc(spec.body) + '</p>' +
      (spec.action || '') +
      '</div>'
    );
  }

  function showMissing() {
    shown = null;
    failure = null;
    missing = true;
    claimTitle(t('share.missing.title'));
    sub.textContent = '';
    host.innerHTML = state({
      bad: true,
      icon: FL.pass.icon.lock,
      heading: t('share.missing.heading'),
      body: t('share.missing.body'),
      action: '<a class="btn btn-outline" href="/">' + ui.esc(t('share.missing.action')) + '</a>'
    });
  }

  function showFailure(err) {
    shown = null;
    missing = false;
    failure = err || {};
    claimTitle(t('share.fail.title'));
    sub.textContent = '';
    host.innerHTML = state({
      bad: true,
      icon: FL.pass.icon.lock,
      heading: t('share.fail.heading'),
      body: (failure && failure.message) || t('share.fail.body'),
      action: '<a class="btn btn-outline" href="/">' + ui.esc(t('e404.back')) + '</a>'
    });
  }

  function showFlight(flight) {
    shown = flight;
    failure = null;
    missing = false;

    var from = FL.geo.airport(flight.from_iata);
    var to = FL.geo.airport(flight.to_iata);

    // the codes first, because they are what the link's owner sent; the two
    // city names are the same sentence again, in words, when both are known
    claimTitle(
      t('pass.route.value', { from: flight.from_iata, to: flight.to_iata }) +
      (from && to ? ' · ' + t('pass.route.value', { from: from.city, to: to.city }) : ''));

    sub.textContent = t('share.sub', {
      airline: flight.airline,
      flightNo: flight.flight_no,
      date: FL.i18n.formatDay(flight.flown_on)
    });

    document.title = t('meta.share.flight', {
      flightNo: flight.flight_no,
      from: flight.from_iata,
      to: flight.to_iata
    });

    // No note and no actions: this is somebody else's flight.
    host.innerHTML =
      '<ul class="passes">' +
      FL.pass.markup(flight, { tag: 'li', note: false, actions: false, photo: false }) +
      '</ul>';
  }

  // Everything on this page is drawn from one row held in memory, so a change
  // of language is a repaint rather than a second request. The sweep in
  // i18n.js has already put the placeholder heading back on #share-title by
  // the time this runs, which is exactly why the row is painted again here.
  document.addEventListener('fl350:langchange', function () {
    if (shown) showFlight(shown);
    else if (failure) showFailure(failure);
    else if (missing) showMissing();
  });

  var shareId = shareIdFromLocation();

  if (!shareId) {
    showMissing();
    return;
  }

  host.innerHTML = '<div class="passes" aria-hidden="true"><div class="skeleton skeleton-pass"></div></div>';

  FL.sharedFlight(shareId).then(
    function (flight) {
      if (!flight) {
        showMissing();
        return;
      }
      showFlight(flight);
    },
    showFailure
  );
})();
