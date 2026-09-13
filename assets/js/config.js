/* FL350 · where the front end learns the address of the database.
 *
 * Nothing about Supabase is committed to this repository. On the live site the
 * two values come from the Vercel project's environment variables, handed over
 * by /api/config. For working offline you can create
 * assets/js/config.local.js (it is in .gitignore) containing:
 *
 *   window.FL350_CONFIG = { url: 'https://....supabase.co', key: 'sb_publishable_...' };
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});
  var pending = null;

  // Same resolver the rest of the app uses: the catalogue when it is loaded and
  // has the key, the English literal otherwise. FL350.i18n.t hands back the key
  // itself when it does not know one, and nobody should ever read "err.config".
  function say(key, english, vars) {
    if (FL.i18n && typeof FL.i18n.t === 'function') {
      var out = FL.i18n.t(key, vars);
      if (out && out !== key) return out;
    }
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        english = english.replace('{' + name + '}', vars[name]);
      });
    }
    return english;
  }

  function load() {
    var override = window.FL350_CONFIG;
    if (override && override.url && override.key) {
      return Promise.resolve(normalise(override));
    }

    return fetch('/api/config', { headers: { accept: 'application/json' } })
      .then(function (response) {
        return response
          .json()
          .catch(function () { return {}; })
          .then(function (body) {
            if (!response.ok) {
              var err = new Error(
                body.hint ||
                say('err.config.http', 'The settings endpoint answered {status}.',
                    { status: response.status })
              );
              // Prefixed, because every page decides whether to show the
              // "missing environment variables" card by testing for a code
              // that starts with "config" — and the endpoint's own words for
              // this are 'not_configured' and 'wrong_key', which do not.
              err.code = 'config_' + (body.error || 'http_' + response.status);
              err.missing = body.missing || null;
              throw err;
            }
            return body;
          });
      })
      .then(function (body) {
        if (!body.url || !body.key) {
          var err = new Error(
            say('err.config.empty', 'The settings endpoint did not return a database address.'));
          err.code = 'config_empty';
          throw err;
        }
        window.FL350_CONFIG = normalise(body);
        return window.FL350_CONFIG;
      })
      .catch(function (err) {
        if (!err.code) err.code = 'config_unreachable';
        // On the live site /api/config is the only source. Off it — opened from
        // disk, or behind a plain static server — fall back to the local file
        // that .gitignore keeps out of the repository.
        return loadLocalOverride().then(function (cfg) {
          if (cfg) return cfg;
          pending = null; // so a retry can genuinely try again
          throw err;
        });
      });
  }

  function loadLocalOverride() {
    return new Promise(function (resolve) {
      var tag = document.createElement('script');
      tag.src = '/assets/js/config.local.js';
      tag.onload = function () {
        var cfg = window.FL350_CONFIG;
        if (!cfg || !cfg.url || !cfg.key) return resolve(null);
        window.FL350_CONFIG = normalise(cfg);
        resolve(window.FL350_CONFIG);
      };
      tag.onerror = function () { resolve(null); };
      document.head.appendChild(tag);
    });
  }

  function normalise(cfg) {
    // Trim as well as strip the trailing slash: a value pasted into a hosting
    // panel picks up a space at one end surprisingly often.
    return {
      url: String(cfg.url).replace(/^\s+|\s+$/g, '').replace(/\/+$/, ''),
      key: String(cfg.key).replace(/^\s+|\s+$/g, '')
    };
  }

  FL.config = function () {
    return pending || (pending = load());
  };
})();
