/* FL350 · the two things that must happen before the page paints.
 *
 * 1. Put the saved theme on <html> so a dark-mode reader never sees a white
 *    flash on the way in.
 * 2. On a gated page (<html data-gated="true">), if there is no session in
 *    storage at all, leave for the sign-in page immediately — before any of
 *    the locker markup has had a chance to render.
 *
 * This file is deliberately loaded WITHOUT defer, so it runs first. The real
 * check still happens against the server in session.js; this one only makes
 * sure a signed-out visitor never sees the shape of the page.
 */
(function () {
  'use strict';

  var html = document.documentElement;

  try {
    var theme = localStorage.getItem('fl350.theme');
    if (theme === 'dark' || theme === 'light') html.setAttribute('data-theme', theme);
  } catch (e) {
    /* storage refused; the media query still decides */
  }

  if (html.getAttribute('data-gated') !== 'true') return;

  var hasSession = false;
  try {
    var raw = localStorage.getItem('fl350.session');
    if (raw) {
      var parsed = JSON.parse(raw);
      hasSession = !!(parsed && parsed.access_token && parsed.refresh_token);
    }
  } catch (e) {
    hasSession = false;
  }

  if (!hasSession) {
    location.replace('/login?next=' + encodeURIComponent(location.pathname));
  }
})();
