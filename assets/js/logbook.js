/* FL350 · the locker itself.
 *
 * Everything on this page is one member's own rows. The searching and sorting
 * below is only there to make a long list usable — it is NOT what keeps other
 * people out. The database does that: the policy on public.flights returns
 * nothing at all for anybody who is not the owner, and the table grant refuses
 * a signed-out visitor before the policy is even consulted.
 */
(function () {
  'use strict';

  var FL = window.FL350;
  var ui = FL.ui;
  var geo = FL.geo;
  var t = FL.i18n.t;
  var formatDay = FL.i18n.formatDay;

  var MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  var flights = [];
  var editingId = null;
  var pendingDeleteId = null;
  var pendingShareId = null;
  var chosenPhoto = null;      // a File the member picked but has not saved yet
  var removePhoto = false;     // they asked for the existing one to come off
  var previewUrl = null;       // object URL for that File, revoked when done
  var opened = false;          // the member is in and their rows have arrived
  var loadError = null;        // set instead, when the locker would not open

  /* -------------------------------------------------------------- the DOM */

  var el = {
    greeting: document.getElementById('greeting'),
    sub: document.getElementById('greeting-sub'),
    globe: document.getElementById('globe'),
    stats: document.getElementById('stats'),
    list: document.getElementById('list'),
    toolbar: document.getElementById('toolbar'),
    search: document.getElementById('search'),
    year: document.getElementById('filter-year'),
    sort: document.getElementById('sort'),
    count: document.getElementById('result-count'),
    exportBtn: document.getElementById('export-csv'),

    sheet: document.getElementById('flight-sheet'),
    sheetTitle: document.getElementById('sheet-title'),
    form: document.getElementById('flight-form'),
    save: document.getElementById('flight-save'),
    cancel: document.querySelectorAll('[data-close-sheet]'),

    photoInput: document.getElementById('f-photo'),
    photoPreview: document.getElementById('f-photo-preview'),
    photoDrop: document.getElementById('f-photo-drop'),

    confirm: document.getElementById('confirm-sheet'),
    confirmText: document.getElementById('confirm-text'),
    confirmYes: document.getElementById('confirm-yes'),
    confirmNo: document.getElementById('confirm-no'),

    share: document.getElementById('share-sheet'),
    shareLink: document.getElementById('share-link'),
    shareCopy: document.getElementById('share-copy'),
    shareStop: document.getElementById('share-stop'),
    shareClose: document.getElementById('share-close'),
    shareWhat: document.getElementById('share-what'),

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

  function byId(id) {
    var found = null;
    flights.forEach(function (flight) { if (flight.id === id) found = flight; });
    return found;
  }

  /* --------------------------------------------------------- distance etc */

  function legKm(flight) { return FL.pass.legKm(flight); }
  function routeKey(flight) { return flight.from_iata + '–' + flight.to_iata; }

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
    var laps = totalKm / 40075; // times around the Earth at the equator

    el.stats.innerHTML =
      tile(t('stat.flights'), ui.number(flights.length),
        t('stat.flights.sub', { n: thisYear, year: currentYear })) +
      tile(
        t('stat.distance'),
        ui.number(totalKm) + ' <small>' + ui.esc(t('unit.km')) + '</small>',
        measured === flights.length
          ? (laps >= 0.1
              ? t('stat.distance.laps', { laps: laps.toFixed(1) })
              : t('stat.distance.approx'))
          : t('stat.distance.measured', { n: measured, total: flights.length })
      ) +
      tile(t('stat.airlines'), ui.number(Object.keys(airlines).length),
        topAirline ? t('stat.airlines.sub', { name: topAirline.value }) : '') +
      tile(t('stat.airports'), ui.number(Object.keys(airports).length),
        topRoute && topRoute.count > 1
          ? t('stat.airports.route', { route: topRoute.value, n: topRoute.count })
          : longest
            ? t('stat.airports.longest', { route: routeKey(longest.flight), km: longest.km })
            : '');
  }

  function tile(label, value, sub) {
    return (
      '<div class="stat"><dt>' + ui.esc(label) + '</dt><dd>' + value + '</dd>' +
      (sub ? '<p class="stat-sub" title="' + ui.esc(sub) + '">' + ui.esc(sub) + '</p>' : '') +
      '</div>'
    );
  }

  /* ---------------------------------------------------------- route globe */

  function renderGlobe() {
    if (!el.globe) return;
    if (!FL.routeglobe || !flights.length) {
      el.globe.hidden = true;
      el.globe.innerHTML = '';
      return;
    }
    el.globe.hidden = false;
    FL.routeglobe.render(el.globe, flights);
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
        icon: FL.pass.icon.empty,
        title: t('state.empty.title'),
        body: t('state.empty.body'),
        action: '<button type="button" class="btn" data-add-flight><span>' +
          ui.esc(t('book.add')) + '</span></button>'
      });
      wireAddButtons();
      return;
    }

    if (!rows.length) {
      el.count.textContent = t('book.count.nomatches');
      el.list.innerHTML = state({
        icon: FL.pass.icon.empty,
        title: t('state.nomatch.title'),
        body: t('state.nomatch.body'),
        action: '<button type="button" class="btn btn-outline" id="clear-filters"><span>' +
          ui.esc(t('state.nomatch.clear')) + '</span></button>'
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

    el.count.textContent = filtering
      ? t('book.count.filtered', { n: rows.length, total: flights.length, count: flights.length })
      : t('book.count', { n: flights.length });

    el.list.innerHTML =
      '<ul class="passes">' +
      rows.map(function (flight) {
        return FL.pass.markup(flight, { tag: 'li', note: true, actions: true, photo: true });
      }).join('') +
      '</ul>';

    FL.pass.hydratePhotos(el.list);
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

  function wireRowButtons() {
    each(el.list.querySelectorAll('[data-edit]'), function (button) {
      button.addEventListener('click', function () { openSheet(button.getAttribute('data-edit')); });
    });
    each(el.list.querySelectorAll('[data-delete]'), function (button) {
      button.addEventListener('click', function () { askDelete(button.getAttribute('data-delete')); });
    });
    each(el.list.querySelectorAll('[data-share]'), function (button) {
      button.addEventListener('click', function () { openShare(button.getAttribute('data-share'), button); });
    });
    each(el.list.querySelectorAll('[data-window]'), function (button) {
      button.addEventListener('click', function () { openWindowSeat(button.getAttribute('data-window')); });
    });
  }

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function wireAddButtons() {
    each(document.querySelectorAll('[data-add-flight]'), function (button) {
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
      '<option value="all">' + ui.esc(t('book.year.all')) + '</option>' +
      sorted.map(function (year) { return '<option value="' + year + '">' + year + '</option>'; }).join('');

    el.year.value = years[chosen] ? chosen : 'all';
  }

  function renderAll() {
    rebuildYearFilter();
    renderGlobe();
    renderStats();
    renderList();
  }

  /* --------------------------------------------------------- window seat */

  function openWindowSeat(id) {
    var flight = byId(id);
    if (!flight) return;
    if (!FL.windowseat || !FL.windowseat.isSupported()) {
      ui.toast(t('toast.ws.unsupported'), 'bad');
      return;
    }
    FL.windowseat.open(flight);
  }

  /* ------------------------------------------------------------- sharing */

  function shareUrlFor(id) {
    return location.origin + '/f/' + id;
  }

  function paintShareSheet(flight) {
    el.shareLink.value = shareUrlFor(flight.id);
    // whole sentences rather than one comma-chained line: the aircraft and the
    // seat are optional, and a translator needs each part to stand on its own
    var said = [
      t('share.what', {
        airline: flight.airline,
        flightNo: flight.flight_no,
        from: flight.from_iata,
        to: flight.to_iata,
        date: formatDay(flight.flown_on)
      })
    ];
    if (flight.aircraft) said.push(t('share.what.aircraft', { aircraft: flight.aircraft }));
    if (flight.seat) said.push(t('share.what.seat', { seat: flight.seat }));
    said.push(t(flight.note ? 'share.what.note' : 'share.what.nonote'));

    el.shareWhat.textContent = said.join(' ');
  }

  function openShare(id, button) {
    var flight = byId(id);
    if (!flight) return;
    pendingShareId = id;

    if (flight.is_public) {
      paintShareSheet(flight);
      el.share.showModal();
      el.shareCopy.focus();
      return;
    }

    ui.busy(button, true);
    FL.flights.setShared(id, true).then(
      function (row) {
        ui.busy(button, false);
        flights = flights.map(function (f) { return f.id === row.id ? row : f; });
        renderAll();
        paintShareSheet(row);
        el.share.showModal();
        el.shareCopy.focus();
      },
      function (err) {
        ui.busy(button, false);
        ui.toast(err.message || t('toast.sharefail'), 'bad');
      }
    );
  }

  el.shareCopy.addEventListener('click', function () {
    var text = el.shareLink.value;
    function fallback() {
      el.shareLink.focus();
      el.shareLink.select();
      ui.toast(t('toast.link.selected'), 'info');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { ui.toast(t('toast.link.copied')); },
        fallback
      );
    } else {
      fallback();
    }
  });

  el.shareStop.addEventListener('click', function () {
    var id = pendingShareId;
    if (!id) return;
    ui.busy(el.shareStop, true);
    FL.flights.setShared(id, false).then(
      function (row) {
        ui.busy(el.shareStop, false);
        el.share.close();
        pendingShareId = null;
        flights = flights.map(function (f) { return f.id === row.id ? row : f; });
        renderAll();
        ui.toast(t('toast.share.off'));
      },
      function (err) {
        ui.busy(el.shareStop, false);
        ui.toast(err.message || t('toast.share.changefail'), 'bad');
      }
    );
  });

  el.shareClose.addEventListener('click', function () {
    pendingShareId = null;
    el.share.close();
  });

  /* ---------------------------------------------------------- csv export */

  function csvCell(value) {
    var text = value === null || value === undefined ? '' : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    if (!flights.length) return;

    var headers = ['flight_no', 'airline', 'from_iata', 'from_city', 'to_iata', 'to_city',
                   'flown_on', 'aircraft', 'seat', 'distance_km', 'shared', 'note'];

    var lines = [headers.join(',')];
    visible().forEach(function (flight) {
      var from = geo.airport(flight.from_iata);
      var to = geo.airport(flight.to_iata);
      var km = legKm(flight);
      lines.push([
        flight.flight_no, flight.airline,
        flight.from_iata, from ? from.city : '',
        flight.to_iata, to ? to.city : '',
        flight.flown_on, flight.aircraft || '', flight.seat || '',
        km === null ? '' : km,
        flight.is_public ? 'yes' : 'no',
        flight.note || ''
      ].map(csvCell).join(','));
    });

    // The byte order mark is the difference between this opening correctly in
    // Excel and opening as mojibake, which matters for Arabic in the notes.
    var blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'fl350-logbook-' + ui.todayISO() + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

    ui.toast(t('toast.exported', { n: lines.length - 1 }), 'info');
  }

  if (el.exportBtn) el.exportBtn.addEventListener('click', exportCsv);

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
    fieldError(el.photoInput, '');
  }

  function clearPhotoChoice() {
    chosenPhoto = null;
    removePhoto = false;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    if (el.photoInput) el.photoInput.value = '';
  }

  function paintPhotoArea(flight) {
    if (!el.photoPreview) return;

    if (chosenPhoto && previewUrl) {
      el.photoPreview.innerHTML =
        '<img class="photo-thumb" alt="' + ui.esc(t('photo.alt.chosen')) + '" src="' +
          ui.esc(previewUrl) + '">' +
        '<div class="photo-side">' +
          '<p class="caption">' + ui.esc(t('photo.chosen', {
            name: chosenPhoto.name,
            kb: Math.round(chosenPhoto.size / 1024)
          })) + '</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-clear><span>' +
            ui.esc(t('photo.another')) + '</span></button>' +
        '</div>';
    } else if (flight && flight.photo_path && !removePhoto) {
      el.photoPreview.innerHTML =
        '<figure class="photo-thumb-wrap" data-photo="' + ui.esc(flight.photo_path) + '">' +
          '<div class="skeleton photo-thumb"></div>' +
        '</figure>' +
        '<div class="photo-side">' +
          '<p class="caption">' + ui.esc(t('photo.attached')) + '</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-remove><span>' +
            ui.esc(t('photo.remove')) + '</span></button>' +
        '</div>';
      FL.pass.hydratePhotos(el.photoPreview);
    } else if (removePhoto) {
      el.photoPreview.innerHTML =
        '<div class="photo-side">' +
          '<p class="caption">' + ui.esc(t('photo.willremove')) + '</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-keep><span>' +
            ui.esc(t('photo.keep')) + '</span></button>' +
        '</div>';
    } else {
      el.photoPreview.innerHTML = '';
    }

    each(el.photoPreview.querySelectorAll('[data-photo-clear]'), function (b) {
      b.addEventListener('click', function () { clearPhotoChoice(); paintPhotoArea(byId(editingId)); el.photoInput.click(); });
    });
    each(el.photoPreview.querySelectorAll('[data-photo-remove]'), function (b) {
      b.addEventListener('click', function () { removePhoto = true; chosenPhoto = null; paintPhotoArea(byId(editingId)); });
    });
    each(el.photoPreview.querySelectorAll('[data-photo-keep]'), function (b) {
      b.addEventListener('click', function () { removePhoto = false; paintPhotoArea(byId(editingId)); });
    });
  }

  if (el.photoInput) {
    el.photoInput.addEventListener('change', function () {
      var file = el.photoInput.files && el.photoInput.files[0];
      if (!file) { clearPhotoChoice(); paintPhotoArea(byId(editingId)); return; }

      if (PHOTO_TYPES.indexOf(file.type) === -1) {
        fieldError(el.photoInput, t('form.err.photo.type'));
        clearPhotoChoice();
        paintPhotoArea(byId(editingId));
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        fieldError(el.photoInput, t('form.err.photo.size', { mb: Math.round(file.size / 1024 / 1024) }));
        clearPhotoChoice();
        paintPhotoArea(byId(editingId));
        return;
      }

      fieldError(el.photoInput, '');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      chosenPhoto = file;
      removePhoto = false;
      previewUrl = URL.createObjectURL(file);
      paintPhotoArea(byId(editingId));
    });
  }

  function openSheet(id) {
    editingId = id || null;
    clearErrors();
    clearPhotoChoice();
    el.form.reset();

    var flight = editingId ? byId(editingId) : null;

    if (flight) {
      el.sheetTitle.textContent = t('sheet.edit.title', { flightNo: flight.flight_no });
      el.f.flight_no.value = flight.flight_no || '';
      el.f.airline.value = flight.airline || '';
      el.f.from_iata.value = flight.from_iata || '';
      el.f.to_iata.value = flight.to_iata || '';
      el.f.flown_on.value = flight.flown_on || '';
      el.f.aircraft.value = flight.aircraft || '';
      el.f.seat.value = flight.seat || '';
      el.f.note.value = flight.note || '';
      el.save.querySelector('span').textContent = t('sheet.save.edit');
    } else {
      el.sheetTitle.textContent = t('sheet.add.title');
      el.save.querySelector('span').textContent = t('sheet.save.add');
    }

    paintPhotoArea(flight);
    el.f.flown_on.max = ui.todayISO();
    el.sheet.showModal();
    el.f.flight_no.focus();
  }

  function closeSheet() {
    if (el.sheet.open) el.sheet.close();
    editingId = null;
    clearPhotoChoice();
  }

  function validate() {
    var f = el.f;
    var ok = true;

    var flightNo = f.flight_no.value.trim();
    if (!flightNo) ok = fieldError(f.flight_no, t('form.err.flightno.empty')) && ok;
    else if (flightNo.length < 2 || flightNo.length > 10) {
      ok = fieldError(f.flight_no, t('form.err.flightno.len')) && ok;
    } else ok = fieldError(f.flight_no, '') && ok;

    var airline = f.airline.value.trim();
    if (!airline) ok = fieldError(f.airline, t('form.err.airline.empty')) && ok;
    else if (airline.length < 2) ok = fieldError(f.airline, t('form.err.airline.short')) && ok;
    else ok = fieldError(f.airline, '') && ok;

    var from = f.from_iata.value.trim().toUpperCase();
    var to = f.to_iata.value.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(from)) ok = fieldError(f.from_iata, t('form.err.from')) && ok;
    else ok = fieldError(f.from_iata, '') && ok;

    if (!/^[A-Z]{3}$/.test(to)) ok = fieldError(f.to_iata, t('form.err.to')) && ok;
    else if (to === from) ok = fieldError(f.to_iata, t('form.err.same')) && ok;
    else ok = fieldError(f.to_iata, '') && ok;

    var date = f.flown_on.value;
    if (!date) ok = fieldError(f.flown_on, t('form.err.date.empty')) && ok;
    else if (date > ui.todayISO()) {
      ok = fieldError(f.flown_on, t('form.err.date.future')) && ok;
    } else ok = fieldError(f.flown_on, '') && ok;

    var seat = f.seat.value.trim();
    if (seat && !/^[0-9]{1,3}[A-Za-z]$/.test(seat)) {
      ok = fieldError(f.seat, t('form.err.seat')) && ok;
    } else ok = fieldError(f.seat, '') && ok;

    if (f.note.value.length > 2000) {
      ok = fieldError(f.note, t('form.err.note.long')) && ok;
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

  // The picture cannot be uploaded until the row exists, because the object is
  // named after the flight's id. So: write the row, then the file, then point
  // the row at it. Every step is the member's own folder or their own row.
  function attachPhoto(row) {
    if (!chosenPhoto) {
      if (!removePhoto || !row.photo_path) return Promise.resolve(row);
      var oldPath = row.photo_path;
      return FL.flights.update(row.id, { photo_path: null }).then(function (updated) {
        return FL.photos.remove(oldPath).then(
          function () { return updated; },
          function () { return updated; } // the row is what matters
        );
      });
    }

    var path = FL.photos.pathFor(row.id, chosenPhoto);
    if (!path) {
      ui.toast(t('toast.photo.unnamed'), 'bad');
      return Promise.resolve(row);
    }

    return FL.photos.upload(path, chosenPhoto)
      .then(function () { return FL.flights.update(row.id, { photo_path: path }); })
      .catch(function (err) {
        ui.toast(t('toast.photo.failed', { reason: err.message || '' }), 'bad');
        return row;
      });
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
      .then(attachPhoto)
      .then(function (row) {
        ui.busy(el.save, false);
        closeSheet();

        if (wasEditing) {
          flights = flights.map(function (f) { return f.id === row.id ? row : f; });
          ui.toast(t('toast.updated', { flightNo: row.flight_no }));
        } else {
          flights.unshift(row);
          ui.toast(t('toast.saved', {
            flightNo: row.flight_no, from: row.from_iata, to: row.to_iata
          }));
        }
        renderAll();
      })
      .catch(function (err) {
        ui.busy(el.save, false);
        ui.toast(err.message || t('toast.savefail'), 'bad');
      });
  });

  each(el.cancel, function (button) {
    button.addEventListener('click', function () { closeSheet(); });
  });

  /* ---------------------------------------------------------- delete flow */

  function askDelete(id) {
    var flight = byId(id);
    if (!flight) return;
    pendingDeleteId = id;
    var asked = [
      t('confirm.text', {
        flightNo: flight.flight_no,
        from: flight.from_iata,
        to: flight.to_iata,
        date: formatDay(flight.flown_on)
      })
    ];
    if (flight.photo_path) asked.push(t('confirm.photo'));
    asked.push(t('confirm.undone'));
    el.confirmText.textContent = asked.join(' ');
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
    var flight = byId(id);
    ui.busy(el.confirmYes, true);

    FL.flights
      .remove(id)
      .then(function () {
        // The row is gone; the file should not be left behind in the bucket.
        if (flight && flight.photo_path) {
          return FL.photos.remove(flight.photo_path).catch(function () {});
        }
      })
      .then(function () {
        ui.busy(el.confirmYes, false);
        el.confirm.close();
        pendingDeleteId = null;
        flights = flights.filter(function (f) { return f.id !== id; });
        renderAll();
        ui.toast(t('toast.removed'));
      })
      .catch(function (err) {
        ui.busy(el.confirmYes, false);
        el.confirm.close();
        ui.toast(err.message || t('toast.deletefail'), 'bad');
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
    var busy = el.sheet.open || el.confirm.open || el.share.open;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (busy || typing) return;

    if (event.key === '/') {
      event.preventDefault();
      el.search.focus();
    } else if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      openSheet(null);
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
    if (el.globe) el.globe.hidden = true;
    el.count.textContent = '';

    var isConfig = err && typeof err.code === 'string' && err.code.indexOf('config') === 0;
    el.list.innerHTML = state({
      bad: true,
      icon: FL.pass.icon.lock,
      title: t(isConfig ? 'state.config.title' : 'state.load.title'),
      body: isConfig
        ? t('state.config.body')
        : (err && err.message) || t('state.load.body'),
      pre: isConfig ? t('state.config.pre') : null,
      action: '<button type="button" class="btn btn-outline" id="retry-load"><span>' +
        ui.esc(t('state.retry')) + '</span></button>'
    });

    var retry = document.getElementById('retry-load');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
  }

  // session.js still answers 'there' when the account has no name of its own,
  // and "Welcome back, there." would put an English word in the middle of an
  // Arabic sentence. Until that file returns null instead, the fallback is
  // recognised here and the nameless greeting used.
  function paintGreeting() {
    var who = FL.session.name();
    el.greeting.textContent = who && who !== 'there'
      ? t('book.greeting', { name: who })
      : t('book.greeting.plain');
  }

  // Switching language re-renders from the rows already in memory: nothing is
  // refetched, so nothing can be lost. The DOM sweep in i18n.js has already run
  // by the time this fires, and it has just put the loading greeting back on
  // #greeting from the attribute — which is why the greeting is repainted here.
  // The globe's caption is generated rather than marked up, so renderAll() is
  // also what reaches it; FL.routeglobe.render is idempotent and will not draw
  // the arcs in a second time.
  document.addEventListener('fl350:langchange', function () {
    if (loadError) {
      el.greeting.textContent = t('book.greeting.plain');
      showLoadFailure(loadError);
      return;
    }
    if (!opened) return; // still loading: the skeleton has no words in it
    paintGreeting();
    el.sub.textContent = t('book.sub');
    renderAll();
  });

  el.list.innerHTML =
    '<div class="passes" aria-hidden="true">' +
    '<div class="skeleton skeleton-pass"></div>' +
    '<div class="skeleton skeleton-pass"></div>' +
    '</div>';

  FL.session
    .requireMember()
    .then(function () {
      FL.session.mountTopbar();
      opened = true;
      paintGreeting();
      el.sub.textContent = t('book.sub');
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
      opened = false;
      loadError = err;
      el.greeting.textContent = t('book.greeting.plain');
      el.sub.textContent = '';
      showLoadFailure(err);
    });
})();
