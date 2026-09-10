/* FL350 · the whole back end, by hand.
 *
 * There is no bundler and no CDN in this project, so supabase-js cannot be
 * imported. Every call below is a plain fetch against the two Supabase HTTP
 * endpoints, which is exactly what the library does for these operations:
 *
 *   /auth/v1/*   create an account, sign in, refresh, sign out
 *   /rest/v1/*   read and write rows, subject to the policies on the table
 *
 * The publishable key goes in the `apikey` header on every request. It is not
 * a secret. The thing that keeps one member's flights away from another is the
 * `Authorization: Bearer <access token>` header plus row level security in the
 * database — never anything this file does.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});
  var STORE_KEY = 'fl350.session';
  var REFRESH_MARGIN_MS = 90 * 1000;

  /* ---------------------------------------------------------------- store */

  function read() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.access_token || !parsed.refresh_token) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function write(session) {
    try {
      if (session) localStorage.setItem(STORE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORE_KEY);
    } catch (e) {
      /* private browsing with storage refused — the app still works for one page */
    }
    return session;
  }

  function shape(raw) {
    if (!raw || !raw.access_token) return null;
    var lifetime = Number(raw.expires_in);
    if (!isFinite(lifetime) || lifetime <= 0) lifetime = 3600;
    return {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expires_at: Date.now() + lifetime * 1000,
      user: raw.user || null
    };
  }

  /* --------------------------------------------------------------- errors */

  // Supabase speaks in several error shapes depending on the endpoint.
  // This turns all of them into one sentence a person can act on.
  function describe(status, body) {
    var raw =
      (body && (body.error_description || body.msg || body.message || body.error_code || body.error)) ||
      '';
    raw = String(raw);
    var lower = raw.toLowerCase();

    if (status === 0) return 'No connection. Check the network and try again.';

    if (lower.indexOf('invalid login credentials') > -1) {
      return 'That email and password do not match an account.';
    }
    if (lower.indexOf('email not confirmed') > -1) {
      return 'This account still needs to be confirmed. Open the link in the confirmation email, then sign in.';
    }
    if (lower.indexOf('user already registered') > -1 || lower.indexOf('already been registered') > -1) {
      return 'There is already an account with that email. Sign in instead.';
    }
    if (lower.indexOf('password should be at least') > -1 || lower.indexOf('password_too_short') > -1) {
      return 'That password is too short. Use at least 8 characters.';
    }
    if (lower.indexOf('weak') > -1 && lower.indexOf('password') > -1) {
      return 'That password has turned up in a known breach. Pick a different one.';
    }
    if (lower.indexOf('unable to validate email') > -1 || lower.indexOf('invalid email') > -1) {
      return 'That does not look like an email address.';
    }
    if (status === 429 || lower.indexOf('rate limit') > -1 || lower.indexOf('too many') > -1) {
      return 'Too many attempts in a row. Wait a minute and try again.';
    }
    if (status === 401 || status === 403) {
      return raw || 'You are not signed in, or the sign-in has expired.';
    }
    if (status === 409) return 'That flight is already in your locker.';

    // Constraint violations come back from Postgres with a code.
    if (body && body.code) {
      if (body.code === '23514') return 'One of those values is not allowed. Check the codes and the date.';
      if (body.code === '42501') return 'The database refused that. You can only touch your own flights.';
      if (body.code === '23503') return 'That flight is not linked to a signed-in member.';
    }

    return raw || 'Something went wrong (' + status + ').';
  }

  function fail(status, body) {
    var err = new Error(describe(status, body));
    err.status = status;
    err.body = body || null;
    return err;
  }

  /* ---------------------------------------------------------------- fetch */

  function call(path, options) {
    options = options || {};
    return FL.config().then(function (cfg) {
      var headers = { apikey: cfg.key, accept: 'application/json' };
      if (options.token) headers.Authorization = 'Bearer ' + options.token;
      if (options.body !== undefined) headers['Content-Type'] = 'application/json';
      if (options.prefer) headers.Prefer = options.prefer;

      return fetch(cfg.url + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      }).then(function (response) {
        if (response.status === 204) return null;
        return response
          .text()
          .then(function (text) {
            var parsed = null;
            if (text) {
              try { parsed = JSON.parse(text); } catch (e) { parsed = { message: text }; }
            }
            if (!response.ok) throw fail(response.status, parsed);
            return parsed;
          });
      }, function () {
        throw fail(0, null);
      });
    });
  }

  /* ----------------------------------------------------------------- auth */

  var auth = {
    session: read,

    signUp: function (email, password, displayName) {
      return call('/auth/v1/signup', {
        method: 'POST',
        body: {
          email: email,
          password: password,
          data: { display_name: displayName }
        }
      }).then(function (body) {
        var session = shape(body);
        if (session) {
          // Confirmations are off, so the account is usable straight away.
          if (!session.user && body.user) session.user = body.user;
          write(session);
          return { session: session, needsConfirmation: false };
        }
        // Confirmations are on: the account exists but there is no session yet.
        return { session: null, needsConfirmation: true, user: body && body.user ? body.user : null };
      });
    },

    signIn: function (email, password) {
      return call('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email: email, password: password }
      }).then(function (body) {
        var session = shape(body);
        if (!session) throw fail(500, { message: 'The sign-in did not return a session.' });
        return write(session);
      });
    },

    refresh: function () {
      var current = read();
      if (!current) return Promise.reject(fail(401, { message: 'Not signed in.' }));
      return call('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: current.refresh_token }
      }).then(
        function (body) {
          var session = shape(body);
          if (!session) throw fail(401, { message: 'Could not refresh the sign-in.' });
          if (!session.user) session.user = current.user;
          return write(session);
        },
        function (err) {
          write(null); // a dead refresh token is a signed-out member
          throw err;
        }
      );
    },

    // Returns a live access token, refreshing first if it is about to expire.
    token: function () {
      var current = read();
      if (!current) return Promise.reject(fail(401, { message: 'Not signed in.' }));
      if (current.expires_at - Date.now() > REFRESH_MARGIN_MS) {
        return Promise.resolve(current.access_token);
      }
      return auth.refresh().then(function (session) { return session.access_token; });
    },

    // Asks the server who this token belongs to. Used once on load so a
    // tampered or revoked token cannot keep the gate open.
    verify: function () {
      return auth.token().then(function (token) {
        return call('/auth/v1/user', { token: token }).then(function (user) {
          var current = read();
          if (current) {
            current.user = user;
            write(current);
          }
          return user;
        });
      });
    },

    signOut: function () {
      var current = read();
      write(null);
      if (!current) return Promise.resolve();
      // Best effort: the local session is already gone either way.
      return call('/auth/v1/logout', { method: 'POST', token: current.access_token }).catch(
        function () {}
      );
    }
  };

  /* ----------------------------------------------------------------- rest */

  function rest(path, options) {
    options = options || {};
    return auth.token().then(function (token) {
      return call('/rest/v1' + path, {
        method: options.method,
        body: options.body,
        prefer: options.prefer,
        token: token
      }).catch(function (err) {
        // One retry after a forced refresh: tokens can expire mid-session.
        if (err.status !== 401) throw err;
        return auth.refresh().then(function (session) {
          return call('/rest/v1' + path, {
            method: options.method,
            body: options.body,
            prefer: options.prefer,
            token: session.access_token
          });
        });
      });
    });
  }

  var COLUMNS =
    'id,flight_no,airline,from_iata,to_iata,flown_on,aircraft,seat,note,' +
    'is_public,shared_at,photo_path,created_at,updated_at';

  var PHOTO_BUCKET = 'flight-photos';

  var flights = {
    list: function () {
      return rest(
        '/flights?select=' + COLUMNS + '&order=flown_on.desc,created_at.desc'
      ).then(function (rows) { return rows || []; });
    },

    add: function (flight) {
      return rest('/flights?select=' + COLUMNS, {
        method: 'POST',
        body: flight,
        prefer: 'return=representation'
      }).then(function (rows) { return rows && rows[0]; });
    },

    update: function (id, patch) {
      return rest('/flights?id=eq.' + encodeURIComponent(id) + '&select=' + COLUMNS, {
        method: 'PATCH',
        body: patch,
        prefer: 'return=representation'
      }).then(function (rows) {
        if (!rows || !rows.length) {
          throw fail(403, { message: 'That flight is not yours to change.' });
        }
        return rows[0];
      });
    },

    remove: function (id) {
      return rest('/flights?id=eq.' + encodeURIComponent(id) + '&select=id', {
        method: 'DELETE',
        prefer: 'return=representation'
      }).then(function (rows) {
        if (!rows || !rows.length) {
          throw fail(403, { message: 'That flight is not yours to delete.' });
        }
        return true;
      });
    },

    // Opening or closing the share door on one flight. shared_at is set by the
    // database, not here, so the browser cannot backdate it.
    setShared: function (id, isPublic) {
      return flights.update(id, { is_public: !!isPublic });
    }
  };

  /* -------------------------------------------------------------- storage */
  //
  // The photograph bucket is private. Nothing in it has a public address, so a
  // picture is fetched through a signed link that expires. Objects are always
  // named <owner uuid>/<flight id>.<ext>, which is what the storage policies
  // check against the token.

  function storageFetch(path, options) {
    options = options || {};
    return auth.token().then(function (token) {
      return FL.config().then(function (cfg) {
        var headers = { apikey: cfg.key, Authorization: 'Bearer ' + token };
        if (options.contentType) headers['Content-Type'] = options.contentType;
        if (options.json) headers['Content-Type'] = 'application/json';
        if (options.upsert) headers['x-upsert'] = 'true';

        return fetch(cfg.url + '/storage/v1' + path, {
          method: options.method || 'GET',
          headers: headers,
          body: options.body
        }).then(function (response) {
          return response.text().then(function (text) {
            var parsed = null;
            if (text) {
              try { parsed = JSON.parse(text); } catch (e) { parsed = { message: text }; }
            }
            if (!response.ok) throw fail(response.status, parsed);
            return parsed;
          });
        }, function () {
          throw fail(0, null);
        });
      });
    });
  }

  var photos = {
    // The extension has to match what the database constraint allows.
    extensionFor: function (file) {
      var byType = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/avif': 'avif'
      };
      return byType[file && file.type] || null;
    },

    pathFor: function (flightId, file) {
      var session = read();
      var owner = session && session.user && session.user.id;
      var ext = photos.extensionFor(file);
      if (!owner || !ext) return null;
      return owner + '/' + flightId + '.' + ext;
    },

    upload: function (path, file) {
      return storageFetch('/object/' + PHOTO_BUCKET + '/' + path, {
        method: 'POST',
        body: file,
        contentType: file.type,
        upsert: true
      }).then(function () { return path; });
    },

    // A link that works for a few minutes and then stops working.
    signedUrl: function (path, seconds) {
      return storageFetch('/object/sign/' + PHOTO_BUCKET + '/' + path, {
        method: 'POST',
        json: true,
        body: JSON.stringify({ expiresIn: seconds || 3600 })
      }).then(function (body) {
        if (!body || !body.signedURL) throw fail(500, { message: 'No signed link came back.' });
        return FL.config().then(function (cfg) {
          return cfg.url + '/storage/v1' + body.signedURL;
        });
      });
    },

    remove: function (path) {
      return storageFetch('/object/' + PHOTO_BUCKET + '/' + path, { method: 'DELETE' })
        .then(function () { return true; });
    }
  };

  /* ----------------------------------------------------- the share door */
  //
  // The one thing a signed-out visitor may ask for. Not the table: a function
  // that answers for a single row its owner marked public, and returns only
  // the columns that belong on a boarding pass. Never the note.

  function sharedFlight(shareId) {
    return call('/rest/v1/rpc/shared_flight', {
      method: 'POST',
      body: { share_id: shareId }
    }).then(function (rows) {
      return rows && rows.length ? rows[0] : null;
    });
  }

  FL.auth = auth;
  FL.flights = flights;
  FL.photos = photos;
  FL.sharedFlight = sharedFlight;
  FL.describeError = describe;
})();
