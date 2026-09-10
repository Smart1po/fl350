/* FL350 · the share page.
 *
 * No account, no session, no table. This page knows one id and asks the share
 * door for it. Everything else about the owner's locker stays shut.
 */
(function () {
  'use strict';

  var FL = window.FL350;
  var ui = FL.ui;

  var title = document.getElementById('share-title');
  var sub = document.getElementById('share-sub');
  var host = document.getElementById('share-pass');

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
    title.textContent = 'This link does not open anything.';
    sub.textContent = '';
    host.innerHTML = state({
      bad: true,
      icon: FL.pass.icon.lock,
      heading: 'Nothing to show.',
      body:
        'Either the flight was never shared, sharing has since been switched off, ' +
        'or the link is not quite right. Nothing about the owner’s locker is ' +
        'revealed either way — this page cannot see it.',
      action: '<a class="btn btn-outline" href="/">What FL350 is</a>'
    });
  }

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

      var from = FL.geo.airport(flight.from_iata);
      var to = FL.geo.airport(flight.to_iata);

      title.textContent =
        flight.from_iata + ' to ' + flight.to_iata +
        (from && to ? ' · ' + from.city + ' to ' + to.city : '');
      sub.textContent =
        flight.airline + ' ' + flight.flight_no + ', ' + ui.formatDay(flight.flown_on) +
        '. Shared from a private logbook — the owner’s note is not part of this link.';

      document.title = flight.flight_no + ', ' + flight.from_iata + ' to ' + flight.to_iata + ' — FL350';

      // No note and no actions: this is somebody else's flight.
      host.innerHTML =
        '<ul class="passes">' +
        FL.pass.markup(flight, { tag: 'li', note: false, actions: false, photo: false }) +
        '</ul>';
    },
    function (err) {
      title.textContent = 'The link could not be opened.';
      sub.textContent = '';
      host.innerHTML = state({
        bad: true,
        icon: FL.pass.icon.lock,
        heading: 'Something went wrong on the way to the database.',
        body: (err && err.message) || 'Try again in a moment.',
        action: '<a class="btn btn-outline" href="/">Back to the front page</a>'
      });
    }
  );
})();
