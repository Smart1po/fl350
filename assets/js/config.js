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
                body.hint || 'The settings endpoint answered ' + response.status + '.'
              );
              err.code = body.error || 'config_http_' + response.status;
              err.missing = body.missing || null;
              throw err;
            }
            return body;
          });
      })
      .then(function (body) {
        if (!body.url || !body.key) {
          var err = new Error('The settings endpoint did not return a database address.');
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
    return { url: String(cfg.url).replace(/\/+$/, ''), key: String(cfg.key) };
  }

  FL.config = function () {
    return pending || (pending = load());
  };
})();
