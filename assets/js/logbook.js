/* FL350 · the locker itself.
 *
 * Everything on this page is one member's own rows. The filtering below is
 * only there to make a long list usable — it is NOT what keeps other people
 * out. The database does that: the policy on public.flights returns nothing
 * at all for anybody who is not the owner, and the table grant refuses a
 * signed-out visitor before the policy is even consulted.
 */
(function () {
  'use strict';

  var FL = window.FL350;
  var ui = FL.ui;
  var geo = FL.geo;

  var flights = [];
  var editingId = null;
  var pendingDeleteId = null;

  /* -------------------------------------------------------------- the DOM */

  var el = {
    greeting: document.getElementById('greeting'),
    sub: document.getElementById('greeting-sub'),
    stats: document.getElementById('stats'),
    list: document.getElementById('list'),
    toolbar: document.getElementById('toolbar'),
    search: document.getElementById('search'),
    year: document.getElementById('filter-year'),
    sort: document.getElementById('sort'),
    count: document.getElementById('result-count'),

    sheet: document.getElementById('flight-sheet'),
    sheetTitle: document.getElementById('sheet-title'),
    form: document.getElementById('flight-form'),
    save: document.getElementById('flight-save'),
    cancel: document.querySelectorAll('[data-close-sheet]'),

    confirm: document.getElementById('confirm-sheet'),
    confirmText: document.getElementById('confirm-text'),
    confirmYes: document.getElementById('confirm-yes'),
    confirmNo: document.getElementById('confirm-no'),

    f: {
      flight_no: document.getElementById('f-flight-no'),
      airline: document.getElementById('f-airline'),
      from_iata: document.getElementById('f-from'),
      to_iata: document.getElementById('f-to'),
      flown_on: document.getElementById('f-date'),
      aircraft: document.getElementById('f-aircraft'),
      seat: document.getElementById('f-seat'),
      note: document.getElementById('f-note')
    }
  };

  /* --------------------------------------------------------------- icons */

  var ICON_PLANE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-1.7l-7.5-4.4V4.2a1.3 1.3 0 0 0-2.6 0v5.2L3.4 13.8v1.7l7.5-2.2v4.4l-2.1 1.5v1.2l3.4-1 3.4 1v-1.2l-2.1-1.5v-4.4l7.5 2.2Z"/></svg>';
  var ICON_LOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/></svg>';
  var ICON_EMPTY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 15.5 21 9M7.5 12.8 5 8l2.2-.6 3 3.1M14 19l1.4-4.4"/><rect x="2.5" y="19.5" width="19" height="1.6" rx=".8" fill="currentColor" stroke="none"/></svg>';

  /* --------------------------------------------------------- distance etc */

  function legKm(flight) {
    return ui.greatCircleKm(geo.airport(flight.from_iata), geo.airport(flight.to_iata));
  }

  function routeKey(flight) {
    return flight.from_iata + '–' + flight.to_iata;
  }

  function commonest(values) {
    var tally = {};
    var best = null;
    var bestCount = 0;
    values.forEach(function (value) {
      if (!value) return;
      tally[value] = (tally[value] || 0) + 1;
      if (tally[value] > bestCount) { best = value; bestCount = tally[value]; }
    });
    return best ? { value: best, count: bestCount } : null;
  }

  /* ---------------------------------------------------------------- stats */

  function renderStats() {
    if (!flights.length) {
      el.stats.hidden = true;
      return;
    }
    el.stats.hidden = false;

    var totalKm = 0;
    var measured = 0;
    var longest = null;
    var airlines = {};
    var airports = {};
    var thisYear = 0;
    var currentYear = new Date().getFullYear();

    flights.forEach(function (flight) {
      var km = legKm(flight);
      if (km !== null) {
        totalKm += km;
        measured += 1;
        if (!longest || km > longest.km) longest = { km: km, flight: flight };
      }
      airlines[flight.airline] = true;
      airports[flight.from_iata] = true;
      airports[flight.to_iata] = true;
      if (ui.yearOf(flight.flown_on) === currentYear) thisYear += 1;
    });

    var topRoute = commonest(flights.map(routeKey));
    var topAirline = commonest(flights.map(function (f) { return f.airline; }));
    var airportCount = Object.keys(airports).length;
    var airlineCount = Object.keys(airlines).length;

    var laps = totalKm / 40075; // times around the Earth at the equator

    el.stats.innerHTML =
      tile('Flights', ui.number(flights.length), thisYear + ' in ' + currentYear) +
      tile(
        'Distance',
        ui.number(totalKm) + ' <small>km</small>',
        measured === flights.length
          ? (laps >= 0.1 ? '≈ ' + laps.toFixed(1) + '× around the Earth' : 'approximate, great circle')
          : measured + ' of ' + flights.length + ' legs measured'
      ) +
      tile(
        'Airlines',
        ui.number(airlineCount),
        topAirline ? 'most often ' + topAirline.value : ''
      ) +
      tile(
        'Airports',
        ui.number(airportCount),
        topRoute && topRoute.count > 1
          ? topRoute.value + ' × ' + topRoute.count
          : longest
            ? 'longest ' + routeKey(longest.flight) + ', ' + ui.number(longest.km) + ' km'
            : ''
      );
  }

  function tile(label, value, sub) {
    return (
      '<div class="stat"><dt>' + ui.esc(label) + '</dt><dd>' + value + '</dd>' +
      (sub ? '<p class="stat-sub" title="' + ui.esc(sub) + '">' + ui.esc(sub) + '</p>' : '') +
      '</div>'
    );
  }

  /* ------------------------------------------------------------- the list */

  function visible() {
    var query = (el.search.value || '').trim().toLowerCase();
    var year = el.year.value;

    var rows = flights.filter(function (flight) {
      if (year !== 'all' && String(ui.yearOf(flight.flown_on)) !== year) return false;
      if (!query) return true;

      var from = geo.airport(flight.from_iata);
      var to = geo.airport(flight.to_iata);
      var haystack = [
        flight.flight_no, flight.airline, flight.from_iata, flight.to_iata,
        flight.aircraft, flight.seat, flight.note, flight.flown_on,
        from && from.city, from && from.country, to && to.city, to && to.country
      ].join(' ').toLowerCase();

      return haystack.indexOf(query) > -1;
    });

    var mode = el.sort.value;
    rows.sort(function (a, b) {
      if (mode === 'oldest') return a.flown_on < b.flown_on ? -1 : a.flown_on > b.flown_on ? 1 : 0;
      if (mode === 'longest') return (legKm(b) || 0) - (legKm(a) || 0);
      return a.flown_on > b.flown_on ? -1 : a.flown_on < b.flown_on ? 1 : 0;
    });

    return rows;
  }

  function renderList() {
    var rows = visible();
    var filtering = (el.search.value || '').trim() !== '' || el.year.value !== 'all';

    el.toolbar.hidden = flights.length === 0;

    if (!flights.length) {
      el.count.textContent = '';
      el.list.innerHTML = state({
        icon: ICON_EMPTY,
        title: 'Nothing here yet. Add your first flight.',
        body: 'One boarding pass per flight you have taken. Only you will ever see them.',
        action: '<button type="button" class="btn" data-add-flight><span>Add a flight</span></button>'
      });
      wireAddButtons();
      return;
    }

    if (!rows.length) {
      el.count.textContent = 'No matches';
      el.list.innerHTML = state({
        icon: ICON_EMPTY,
        title: 'No flights match that.',
        body: 'Nothing in the locker matches what you typed. The flights are all still there.',
        action: '<button type="button" class="btn btn-outline" id="clear-filters"><span>Clear the filters</span></button>'
      });
      var clear = document.getElementById('clear-filters');
      if (clear) {
        clear.addEventListener('click', function () {
          el.search.value = '';
          el.year.value = 'all';
          renderList();
          el.search.focus();
        });
      }
      return;
    }

    el.count.textContent =
      filtering
        ? rows.length + ' of ' + flights.length + (flights.length === 1 ? ' flight' : ' flights')
        : flights.length + (flights.length === 1 ? ' flight' : ' flights');

    el.list.innerHTML = '<ul class="passes">' + rows.map(pass).join('') + '</ul>';
    wireRowButtons();
  }

  function state(spec) {
    return (
      '<div class="state' + (spec.bad ? ' state-bad' : '') + '" role="status">' +
      '<div class="state-icon">' + spec.icon + '</div>' +
      '<h2>' + ui.esc(spec.title) + '</h2>' +
      '<p>' + ui.esc(spec.body) + '</p>' +
      (spec.pre ? '<pre class="state-pre">' + ui.esc(spec.pre) + '</pre>' : '') +
      (spec.action || '') +
      '</div>'
    );
  }

  function pass(flight) {
    var from = geo.airport(flight.from_iata);
    var to = geo.airport(flight.to_iata);
    var km = legKm(flight);

    var facts = [];
    if (flight.aircraft) facts.push(fact('Aircraft', flight.aircraft));
    if (km !== null) facts.push(fact('Distance', ui.number(km) + ' km'));
    if (from && to) facts.push(fact('Route', from.city + ' to ' + to.city));

    return (
      '<li class="pass">' +
        '<div class="pass-main">' +
          '<div class="pass-head">' +
            '<span class="pass-airline">' + ui.esc(flight.airline) + '</span>' +
            '<span class="pass-flightno">' + ui.esc(flight.flight_no) + '</span>' +
            '<span class="pass-date">' + ui.esc(ui.formatDay(flight.flown_on)) + '</span>' +
          '</div>' +
          '<div class="route">' +
            '<div class="route-end">' +
              '<div class="route-iata">' + ui.esc(flight.from_iata) + '</div>' +
              '<div class="route-city">' + ui.esc(from ? from.city : 'Unlisted airport') + '</div>' +
            '</div>' +
            '<div class="route-line" aria-hidden="true">' + ICON_PLANE + '</div>' +
            '<div class="route-end to">' +
              '<div class="route-iata">' + ui.esc(flight.to_iata) + '</div>' +
              '<div class="route-city">' + ui.esc(to ? to.city : 'Unlisted airport') + '</div>' +
            '</div>' +
          '</div>' +
          (facts.length ? '<dl class="pass-facts">' + facts.join('') + '</dl>' : '') +
          (flight.note
            ? '<div class="pass-note">' + ICON_LOCK +
              '<p>' + ui.esc(flight.note) + '</p></div>'
            : '') +
        '</div>' +
        '<div class="pass-stub">' +
          '<dl class="stub-seat"><dt>Seat</dt><dd>' + ui.esc(flight.seat || '—') + '</dd></dl>' +
          barcode(flight.id) +
          '<div class="pass-actions">' +
            '<button type="button" class="btn btn-ghost" data-edit="' + ui.esc(flight.id) + '">Edit</button>' +
            '<button type="button" class="btn btn-ghost" data-delete="' + ui.esc(flight.id) + '">Delete</button>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }

  function fact(label, value) {
    return '<div class="fact"><dt>' + ui.esc(label) + '</dt><dd>' + ui.esc(value) + '</dd></div>';
  }

  // Decorative only: bar widths come from the row id so each pass looks
  // different but always looks the same for the same flight. The widths are
  // classes rather than inline styles because the Content-Security-Policy on
  // this site does not allow a style attribute in markup.
  function barcode(seed) {
    var text = String(seed || '');
    var bars = '';
    for (var i = 0; i < 34; i++) {
      var code = text.charCodeAt(i % Math.max(1, text.length)) || 65;
      bars += (code + i) % 3 === 0 ? '<i class="b2"></i>' : '<i></i>';
    }
    return '<div class="barcode" aria-hidden="true">' + bars + '</div>';
  }

  function wireRowButtons() {
    el.list.querySelectorAll('[data-edit]').forEach(function (button) {
      button.addEventListener('click', function () { openSheet(button.getAttribute('data-edit')); });
    });
    el.list.querySelectorAll('[data-delete]').forEach(function (button) {
      button.addEventListener('click', function () { askDelete(button.getAttribute('data-delete')); });
    });
  }

  function wireAddButtons() {
    document.querySelectorAll('[data-add-flight]').forEach(function (button) {
      if (button.getAttribute('data-wired') === '1') return;
      button.setAttribute('data-wired', '1');
      button.addEventListener('click', function () { openSheet(null); });
    });
  }

  function rebuildYearFilter() {
    var years = {};
    flights.forEach(function (flight) {
      var year = ui.yearOf(flight.flown_on);
      if (year) years[year] = true;
    });
    var sorted = Object.keys(years).sort().reverse();
    var chosen = el.year.value;

    el.year.innerHTML =
      '<option value="all">Every year</option>' +
      sorted.map(function (year) { return '<option value="' + year + '">' + year + '</option>'; }).join('');

    el.year.value = years[chosen] ? chosen : 'all';
  }

  function renderAll() {
    rebuildYearFilter();
    renderStats();
    renderList();
  }

  /* ------------------------------------------------------------ the sheet */

  function fieldError(input, message) {
    var holder = document.getElementById(input.id + '-error');
    if (holder) holder.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  }

  function clearErrors() {
    Object.keys(el.f).forEach(function (key) { fieldError(el.f[key], ''); });
  }

  function openSheet(id) {
    editingId = id || null;
    clearErrors();
    el.form.reset();

    if (editingId) {
      var flight = flights.filter(function (f) { return f.id === editingId; })[0];
      if (!flight) return;
      el.sheetTitle.textContent = 'Edit ' + flight.flight_no;
      el.f.flight_no.value = flight.flight_no || '';
      el.f.airline.value = flight.airline || '';
      el.f.from_iata.value = flight.from_iata || '';
      el.f.to_iata.value = flight.to_iata || '';
      el.f.flown_on.value = flight.flown_on || '';
      el.f.aircraft.value = flight.aircraft || '';
      el.f.seat.value = flight.seat || '';
      el.f.note.value = flight.note || '';
      el.save.querySelector('span').textContent = 'Save changes';
    } else {
      el.sheetTitle.textContent = 'Add a flight';
      el.save.querySelector('span').textContent = 'Add to my locker';
    }

    el.f.flown_on.max = ui.todayISO();
    el.sheet.showModal();
    el.f.flight_no.focus();
  }

  function closeSheet() {
    if (el.sheet.open) el.sheet.close();
    editingId = null;
  }

  function validate() {
    var f = el.f;
    var ok = true;

    var flightNo = f.flight_no.value.trim();
    if (!flightNo) ok = fieldError(f.flight_no, 'Which flight was it?') && ok;
    else if (flightNo.length < 2 || flightNo.length > 10) {
      ok = fieldError(f.flight_no, 'Between 2 and 10 characters, like KU 681.') && ok;
    } else ok = fieldError(f.flight_no, '') && ok;

    var airline = f.airline.value.trim();
    if (!airline) ok = fieldError(f.airline, 'Which airline?') && ok;
    else if (airline.length < 2) ok = fieldError(f.airline, 'A little more than that.') && ok;
    else ok = fieldError(f.airline, '') && ok;

    var from = f.from_iata.value.trim().toUpperCase();
    var to = f.to_iata.value.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(from)) {
      ok = fieldError(f.from_iata, 'Three letters, like KWI.') && ok;
    } else ok = fieldError(f.from_iata, '') && ok;

    if (!/^[A-Z]{3}$/.test(to)) {
      ok = fieldError(f.to_iata, 'Three letters, like ICN.') && ok;
    } else if (to === from) {
      ok = fieldError(f.to_iata, 'A flight has to land somewhere else.') && ok;
    } else ok = fieldError(f.to_iata, '') && ok;

    var date = f.flown_on.value;
    if (!date) ok = fieldError(f.flown_on, 'When did you fly?') && ok;
    else if (date > ui.todayISO()) {
      ok = fieldError(f.flown_on, 'This is a log of flights you have taken, so not the future.') && ok;
    } else ok = fieldError(f.flown_on, '') && ok;

    var seat = f.seat.value.trim();
    if (seat && !/^[0-9]{1,3}[A-Za-z]$/.test(seat)) {
      ok = fieldError(f.seat, 'Like 32A — a row number and one letter.') && ok;
    } else ok = fieldError(f.seat, '') && ok;

    if (f.note.value.length > 2000) {
      ok = fieldError(f.note, 'A bit long — 2000 characters at most.') && ok;
    } else ok = fieldError(f.note, '') && ok;

    return ok;
  }

  function payload() {
    var f = el.f;
    return {
      flight_no: f.flight_no.value.trim(),
      airline: f.airline.value.trim(),
      from_iata: f.from_iata.value.trim().toUpperCase(),
      to_iata: f.to_iata.value.trim().toUpperCase(),
      flown_on: f.flown_on.value,
      aircraft: f.aircraft.value.trim() || null,
      seat: f.seat.value.trim().toUpperCase() || null,
      note: f.note.value.trim() || null
    };
  }

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validate()) {
      var firstBad = el.form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var body = payload();
    var wasEditing = editingId;
    ui.busy(el.save, true);

    var work = wasEditing ? FL.flights.update(wasEditing, body) : FL.flights.add(body);

    work
      .then(function (row) {
        ui.busy(el.save, false);
        closeSheet();

        if (wasEditing) {
          flights = flights.map(function (f) { return f.id === row.id ? row : f; });
          ui.toast(row.flight_no + ' updated.');
        } else {
          flights.unshift(row);
          ui.toast(
            'Saved. ' + row.flight_no + ', ' + row.from_iata + ' to ' + row.to_iata + '.'
          );
        }
        renderAll();
      })
      .catch(function (err) {
        ui.busy(el.save, false);
        ui.toast(err.message || 'That did not save.', 'bad');
      });
  });

  el.cancel.forEach(function (button) {
    button.addEventListener('click', function () { closeSheet(); });
  });

  /* ----------------------------------------------------------- delete flow */

  function askDelete(id) {
    var flight = flights.filter(function (f) { return f.id === id; })[0];
    if (!flight) return;
    pendingDeleteId = id;
    el.confirmText.textContent =
      'Remove ' + flight.flight_no + ', ' + flight.from_iata + ' to ' + flight.to_iata +
      ' on ' + ui.formatDay(flight.flown_on) + '? This cannot be undone.';
    el.confirm.showModal();
    el.confirmNo.focus();
  }

  el.confirmNo.addEventListener('click', function () {
    pendingDeleteId = null;
    el.confirm.close();
  });

  el.confirmYes.addEventListener('click', function () {
    var id = pendingDeleteId;
    if (!id) return;
    ui.busy(el.confirmYes, true);

    FL.flights
      .remove(id)
      .then(function () {
        ui.busy(el.confirmYes, false);
        el.confirm.close();
        pendingDeleteId = null;
        flights = flights.filter(function (f) { return f.id !== id; });
        renderAll();
        ui.toast('Flight removed.');
      })
      .catch(function (err) {
        ui.busy(el.confirmYes, false);
        el.confirm.close();
        ui.toast(err.message || 'That did not delete.', 'bad');
      });
  });

  /* -------------------------------------------------------- small niceties */

  // Typing a flight number offers the airline, but never overwrites a choice.
  el.f.flight_no.addEventListener('blur', function () {
    if (el.f.airline.value.trim()) return;
    var guess = geo.carrierFor(el.f.flight_no.value);
    if (guess) {
      el.f.airline.value = guess;
      fieldError(el.f.airline, '');
    }
  });

  [el.f.from_iata, el.f.to_iata].forEach(function (input) {
    input.addEventListener('blur', function () {
      input.value = input.value.trim().toUpperCase();
    });
  });

  [el.search, el.year, el.sort].forEach(function (control) {
    control.addEventListener('input', renderList);
    control.addEventListener('change', renderList);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === '/' && document.activeElement !== el.search && !el.sheet.open && !el.confirm.open) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      el.search.focus();
    }
  });

  /* ----------------------------------------------------------------- boot */

  function fillDatalists() {
    var airports = document.getElementById('iata-list');
    if (airports) {
      airports.innerHTML = geo.codes().map(function (code) {
        return '<option value="' + code + '">' + ui.esc(geo.label(code)) + '</option>';
      }).join('');
    }
    var airlines = document.getElementById('airline-list');
    if (airlines) {
      airlines.innerHTML = geo.airlineNames.map(function (name) {
        return '<option value="' + ui.esc(name) + '"></option>';
      }).join('');
    }
  }

  function showLoadFailure(err) {
    el.stats.hidden = true;
    el.toolbar.hidden = true;
    el.count.textContent = '';

    var isConfig = err && typeof err.code === 'string' && err.code.indexOf('config') === 0;
    el.list.innerHTML = state({
      bad: true,
      icon: ICON_LOCK,
      title: isConfig ? 'The site cannot reach its settings.' : 'Could not open the locker.',
      body: isConfig
        ? 'This is the classic one: it works on a laptop and breaks on the live site because the database keys are not in the Vercel project.'
        : (err && err.message) || 'Something went wrong on the way to the database.',
      pre: isConfig
        ? 'Vercel · Project · Settings · Environment Variables\n  SUPABASE_URL\n  SUPABASE_PUBLISHABLE_KEY\nthen Redeploy — variables only reach the next build.'
        : null,
      action: '<button type="button" class="btn btn-outline" id="retry-load"><span>Try again</span></button>'
    });

    var retry = document.getElementById('retry-load');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
  }

  el.list.innerHTML =
    '<div class="passes" aria-hidden="true">' +
    '<div class="skeleton skeleton-pass"></div>' +
    '<div class="skeleton skeleton-pass"></div>' +
    '</div>';

  FL.session
    .requireMember()
    .then(function () {
      FL.session.mountTopbar();
      el.greeting.textContent = 'Welcome back, ' + FL.session.name() + '.';
      el.sub.textContent = 'This is your locker. Nobody else can open it.';
      fillDatalists();
      wireAddButtons();
      return FL.flights.list();
    })
    .then(function (rows) {
      flights = rows;
      renderAll();
    })
    .catch(function (err) {
      FL.session.mountTopbar();
      el.greeting.textContent = 'Welcome back.';
      el.sub.textContent = '';
      showLoadFailure(err);
    });
})();
