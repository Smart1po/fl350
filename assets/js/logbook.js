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

  var MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  var flights = [];
  var editingId = null;
  var pendingDeleteId = null;
  var pendingShareId = null;
  var chosenPhoto = null;      // a File the member picked but has not saved yet
  var removePhoto = false;     // they asked for the existing one to come off
  var previewUrl = null;       // object URL for that File, revoked when done

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
      tile('Flights', ui.number(flights.length), thisYear + ' in ' + currentYear) +
      tile(
        'Distance',
        ui.number(totalKm) + ' <small>km</small>',
        measured === flights.length
          ? (laps >= 0.1 ? '≈ ' + laps.toFixed(1) + '× around the Earth' : 'approximate, great circle')
          : measured + ' of ' + flights.length + ' legs measured'
      ) +
      tile('Airlines', ui.number(Object.keys(airlines).length),
        topAirline ? 'most often ' + topAirline.value : '') +
      tile('Airports', ui.number(Object.keys(airports).length),
        topRoute && topRoute.count > 1
          ? topRoute.value + ' × ' + topRoute.count
          : longest
            ? 'longest ' + routeKey(longest.flight) + ', ' + ui.number(longest.km) + ' km'
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
        icon: FL.pass.icon.empty,
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

    el.count.textContent = filtering
      ? rows.length + ' of ' + flights.length + (flights.length === 1 ? ' flight' : ' flights')
      : flights.length + (flights.length === 1 ? ' flight' : ' flights');

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
      '<option value="all">Every year</option>' +
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
      ui.toast('The window seat needs a browser with CSS 3D transforms.', 'bad');
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
    el.shareWhat.textContent =
      'Anyone with this link sees ' + flight.airline + ' ' + flight.flight_no + ', ' +
      flight.from_iata + ' to ' + flight.to_iata + ' on ' + ui.formatDay(flight.flown_on) +
      (flight.aircraft ? ', on a ' + flight.aircraft : '') +
      (flight.seat ? ', seat ' + flight.seat : '') + '. ' +
      (flight.note
        ? 'Your note stays private — the share link cannot return it.'
        : 'Your note stays private if you add one later.');
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
        ui.toast(err.message || 'That could not be shared.', 'bad');
      }
    );
  }

  el.shareCopy.addEventListener('click', function () {
    var text = el.shareLink.value;
    function fallback() {
      el.shareLink.focus();
      el.shareLink.select();
      ui.toast('Link selected — copy it with Ctrl+C.', 'info');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { ui.toast('Link copied.'); },
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
        ui.toast('Sharing switched off. The link is dead.');
      },
      function (err) {
        ui.busy(el.shareStop, false);
        ui.toast(err.message || 'That could not be changed.', 'bad');
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

    ui.toast('Downloaded ' + (lines.length - 1) + ' flights. The file includes your private notes.', 'info');
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
        '<img class="photo-thumb" alt="The photograph you just chose." src="' + ui.esc(previewUrl) + '">' +
        '<div class="photo-side">' +
          '<p class="caption">' + ui.esc(chosenPhoto.name) + ' · ' +
            Math.round(chosenPhoto.size / 1024) + ' KB</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-clear><span>Choose another</span></button>' +
        '</div>';
    } else if (flight && flight.photo_path && !removePhoto) {
      el.photoPreview.innerHTML =
        '<figure class="photo-thumb-wrap" data-photo="' + ui.esc(flight.photo_path) + '">' +
          '<div class="skeleton photo-thumb"></div>' +
        '</figure>' +
        '<div class="photo-side">' +
          '<p class="caption">Already attached to this flight.</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-remove><span>Take it off</span></button>' +
        '</div>';
      FL.pass.hydratePhotos(el.photoPreview);
    } else if (removePhoto) {
      el.photoPreview.innerHTML =
        '<div class="photo-side">' +
          '<p class="caption">The photograph will come off when you save.</p>' +
          '<button type="button" class="btn btn-ghost" data-photo-keep><span>Keep it after all</span></button>' +
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
        fieldError(el.photoInput, 'JPEG, PNG, WebP or AVIF only.');
        clearPhotoChoice();
        paintPhotoArea(byId(editingId));
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        fieldError(el.photoInput, 'That is ' + Math.round(file.size / 1024 / 1024) + ' MB. The limit is 5 MB.');
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

    if (!/^[A-Z]{3}$/.test(from)) ok = fieldError(f.from_iata, 'Three letters, like KWI.') && ok;
    else ok = fieldError(f.from_iata, '') && ok;

    if (!/^[A-Z]{3}$/.test(to)) ok = fieldError(f.to_iata, 'Three letters, like ICN.') && ok;
    else if (to === from) ok = fieldError(f.to_iata, 'A flight has to land somewhere else.') && ok;
    else ok = fieldError(f.to_iata, '') && ok;

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
      ui.toast('That photograph could not be named. The flight was saved without it.', 'bad');
      return Promise.resolve(row);
    }

    return FL.photos.upload(path, chosenPhoto)
      .then(function () { return FL.flights.update(row.id, { photo_path: path }); })
      .catch(function (err) {
        ui.toast('The flight was saved, but the photograph was not: ' + (err.message || ''), 'bad');
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
          ui.toast(row.flight_no + ' updated.');
        } else {
          flights.unshift(row);
          ui.toast('Saved. ' + row.flight_no + ', ' + row.from_iata + ' to ' + row.to_iata + '.');
        }
        renderAll();
      })
      .catch(function (err) {
        ui.busy(el.save, false);
        ui.toast(err.message || 'That did not save.', 'bad');
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
    el.confirmText.textContent =
      'Remove ' + flight.flight_no + ', ' + flight.from_iata + ' to ' + flight.to_iata +
      ' on ' + ui.formatDay(flight.flown_on) + '?' +
      (flight.photo_path ? ' The photograph goes with it.' : '') +
      ' This cannot be undone.';
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
