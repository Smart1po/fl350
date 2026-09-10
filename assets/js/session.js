/* FL350 · who is signed in, and the gate on the locker.
 *
 * boot.js has already sent a visitor with no session at all to /login. This
 * file does the part that needs the network: it asks the server whose token
 * this is. A token that has been edited, revoked, or has a dead refresh token
 * fails here and the member is sent back to sign in.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  function current() {
    return FL.auth.session();
  }

  function email() {
    var session = current();
    return (session && session.user && session.user.email) || '';
  }

  // The greeting name: what they typed when they created the account, or the
  // part of their email before the @ if they skipped it.
  function name() {
    var session = current();
    var user = session && session.user;
    if (!user) return 'there';

    var meta = user.user_metadata || {};
    var chosen = meta.display_name || meta.full_name || meta.name;
    if (chosen && String(chosen).trim()) return String(chosen).trim();

    var address = user.email || '';
    var local = address.split('@')[0] || 'there';
    local = local.replace(/[._-]+/g, ' ').trim();
    if (!local) return 'there';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  function leave() {
    location.replace('/login?next=' + encodeURIComponent(location.pathname));
  }

  // Resolves with the verified user, or never resolves because it is
  // redirecting. Callers can treat a resolve as "this really is a member".
  function requireMember() {
    if (!current()) {
      leave();
      return new Promise(function () {});
    }
    return FL.auth.verify().catch(function (err) {
      // A configuration problem is not the member's fault: let the page show
      // the real error instead of bouncing them to a sign-in that also fails.
      if (err && typeof err.code === 'string' && err.code.indexOf('config') === 0) throw err;
      if (err && (err.status === 401 || err.status === 403)) {
        FL.auth.signOut();
        leave();
        return new Promise(function () {});
      }
      throw err;
    });
  }

  function signOutAndLeave() {
    return FL.auth.signOut().then(function () {
      location.replace('/login?signedout=1');
    });
  }

  // Fills in the strip at the top of the page: who you are, sign out, theme.
  function mountTopbar() {
    var who = document.getElementById('topbar-who');
    if (who) {
      var address = email();
      who.textContent = address ? 'Signed in as ' + address : '';
    }

    var out = document.getElementById('sign-out');
    if (out) {
      out.addEventListener('click', function () {
        FL.ui.busy(out, true);
        signOutAndLeave();
      });
    }

    FL.ui.mountThemeToggle(document.getElementById('theme-toggle'));
  }

  FL.session = {
    current: current,
    email: email,
    name: name,
    requireMember: requireMember,
    signOutAndLeave: signOutAndLeave,
    mountTopbar: mountTopbar
  };
})();
