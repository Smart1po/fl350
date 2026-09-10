/* FL350 · window seat — the view out of the cabin window for one flight.
 *
 * Be straight about what this is. There is no WebGL on this site and no 3D
 * library, so this is NOT WebXR and nothing here calls it that. It is a CSS 3D
 * scene: five flat plates hung at five different translateZ inside one
 * perspective, rotated together by two numbers. When the member puts a phone
 * in a Cardboard-style holder the whole scene is drawn twice side by side with
 * a lateral offset between the two, and the device gyroscope feeds the same
 * two numbers the mouse does. That is the entire trick.
 *
 * Nothing is fetched. The cloud deck is a canvas drawn once and handed over as
 * a data: URI, the stars are a generated SVG data: URI, and everything else is
 * a gradient in windowseat.css. Both textures come out of a generator seeded
 * on the flight, so a flight looks the same every time it is opened.
 *
 * The sky is chosen, not fixed: the sun's elevation is worked out from the
 * date and the mean latitude of the route, and the palette follows from it.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var RAD = Math.PI / 180;

  /* Limits on where the head can go. Yaw stops before the fuselage would be
     in the way, and pitch stops well short of rolling the world over — and
     also short of where looking down would reach the near edge of the cloud
     deck. The deck is sized to this number in windowseat.css; the two have to
     move together. */
  var YAW_LIMIT = 52;
  var PITCH_LIMIT = 26;

  /* how much of the look the wing takes, in px and degrees per degree looked */
  var WING_X = 0.62;
  var WING_Y = 0.80;

  var state = null;   // the live scene, or null when nothing is open

  /* ------------------------------------------------------------ can we run */

  function isSupported() {
    if (!window.requestAnimationFrame) return false;
    if (!window.CSS || !window.CSS.supports) return false;
    return (
      CSS.supports('transform-style', 'preserve-3d') &&
      CSS.supports('perspective', '900px') &&
      CSS.supports('aspect-ratio', '46 / 66')
    );
  }

  /* ------------------------------------------------- a repeatable generator */

  // Seeded on the flight so the clouds and the stars and the hour of day are
  // the same every time this flight is opened, and different from the next.
  function rngFrom(seedText) {
    var h = 2166136261;
    var text = String(seedText || 'FL350');
    for (var i = 0; i < text.length; i++) {
      h = (h ^ text.charCodeAt(i)) >>> 0;
      h = (h * 16777619) >>> 0;
    }
    return function () {
      h = (h + 0x6d2b79f5) >>> 0;
      var t = h;
      t = ((t ^ (t >>> 15)) * (t | 1)) >>> 0;
      t = (t ^ (t + (((t ^ (t >>> 7)) * (t | 61)) >>> 0))) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- the colour */

  // The palettes live in the stylesheet as HSL channel triplets. The canvas
  // needs a colour string, so read the triplet back and wrap it rather than
  // writing any colour twice. hsla() with commas, not the newer slash form,
  // because an older phone browser will still parse it.
  function triplet(node, name) {
    return String(window.getComputedStyle(node).getPropertyValue(name) || '').trim();
  }

  function hsla(chan, alpha) {
    var parts = String(chan).split(/\s+/);
    if (parts.length < 3) return 'hsla(0,0%,100%,' + alpha + ')';
    return 'hsla(' + parseFloat(parts[0]) + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
  }

  /* ----------------------------------------------------------------- the sun */

  function dayOfYear(p) {
    var jan1 = Date.UTC(p.y, 0, 1);
    var here = Date.UTC(p.y, p.m - 1, p.d);
    return Math.round((here - jan1) / 86400000) + 1;
  }

  // The first-order declination. Good to about half a degree, which is far
  // tighter than a sky needs to be.
  function declination(doy) {
    return 23.44 * Math.sin((360 / 365.24) * (doy - 81) * RAD);
  }

  function meanLatitude(flight) {
    var geo = FL.geo;
    var a = geo ? geo.airport(flight.from_iata) : null;
    var b = geo ? geo.airport(flight.to_iata) : null;
    if (a && b) return (a.lat + b.lat) / 2;
    if (a) return a.lat;
    if (b) return b.lat;
    return 30;   // an unlisted route: mid-latitude, so the sky still works
  }

  function skyFor(flight, rnd) {
    var day = (FL.ui && FL.ui.parseDay(flight.flown_on)) || { y: 2000, m: 6, d: 21 };
    var lat = meanLatitude(flight);
    var dec = declination(dayOfYear(day));

    /* A logbook row has a date but no departure time, and inventing a fresh
       one on every visit would make the same flight a different sky each time.
       So the hour comes out of the flight's own generator: stable, and never
       presented as the real departure. The elevation below is then genuinely
       the sun's elevation for that hour at that latitude. */
    var hour = 5 + rnd() * 18;
    var hourAngle = 15 * (hour - 12);

    var sinE =
      Math.sin(lat * RAD) * Math.sin(dec * RAD) +
      Math.cos(lat * RAD) * Math.cos(dec * RAD) * Math.cos(hourAngle * RAD);
    var elev = Math.asin(Math.max(-1, Math.min(1, sinE))) / RAD;

    var morning = hourAngle < 0;
    var key, told;

    if (elev < -8) {
      key = 'night';
      told = 'night, with stars over a dark cloud deck';
    } else if (elev < 0) {
      key = 'dawn';
      told = morning
        ? 'the indigo hour before dawn'
        : 'the indigo hour after sunset';
    } else if (elev < (morning ? 12 : 15)) {
      key = morning ? 'sunrise' : 'golden';
      told = morning
        ? 'sunrise gold laid along the horizon'
        : 'the long orange light of late afternoon';
    } else {
      key = 'day';
      told = 'flat daylight blue over a bright cloud deck';
    }

    /* Which way the window faces is not recorded anywhere, so the sun is
       placed by the time of day rather than by its true bearing: to the left
       of the frame in the morning, to the right in the afternoon.

       Both of these are percentages of the glow PLATE, which is three
       viewports across — so a third of the number is what reaches the frame.
       A low sun gets a taller bloom, which is the one thing about this that is
       actually physics. */
    var glowX = 50 + Math.max(-11, Math.min(11, (hourAngle / 180) * 12));
    var glowH = 3 + Math.max(0, 24 - Math.abs(elev)) / 4;

    return {
      key: key,
      told: told,
      elevation: elev,
      glowX: glowX.toFixed(1) + '%',
      glowH: glowH.toFixed(1) + '%'
    };
  }

  /* -------------------------------------------------------------- the clouds */

  // One 512px tile, every blob also drawn across whichever edges it straddles
  // so the tile joins itself and the deck has no visible grid.
  function deckTexture(rnd, litChan, deckChan) {
    var SIZE = 512;
    var canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;

    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return '';

    var i, j, ox, oy, grad;
    var offsets, x, y, r, lit, colour, alpha;

    for (i = 0; i < 96; i++) {
      x = rnd() * SIZE;
      y = rnd() * SIZE;
      r = 24 + rnd() * 72;
      lit = rnd() < 0.58;
      colour = lit ? litChan : deckChan;
      alpha = (lit ? 0.42 : 0.30) + rnd() * 0.30;

      offsets = [[0, 0]];
      if (x - r < 0) offsets.push([SIZE, 0]);
      if (x + r > SIZE) offsets.push([-SIZE, 0]);
      if (y - r < 0) offsets.push([0, SIZE]);
      if (y + r > SIZE) offsets.push([0, -SIZE]);
      if (x - r < 0 && y - r < 0) offsets.push([SIZE, SIZE]);
      if (x + r > SIZE && y + r > SIZE) offsets.push([-SIZE, -SIZE]);
      if (x - r < 0 && y + r > SIZE) offsets.push([SIZE, -SIZE]);
      if (x + r > SIZE && y - r < 0) offsets.push([-SIZE, SIZE]);

      for (j = 0; j < offsets.length; j++) {
        ox = x + offsets[j][0];
        oy = y + offsets[j][1];
        // the light comes from above, so the bright core sits high in the blob
        grad = ctx.createRadialGradient(ox, oy - r * 0.28, r * 0.08, ox, oy, r);
        grad.addColorStop(0, hsla(colour, alpha));
        grad.addColorStop(0.5, hsla(colour, alpha * 0.42));
        grad.addColorStop(1, hsla(colour, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    try {
      return canvas.toDataURL('image/png');
    } catch (e) {
      return '';   // a canvas this browser will not hand back: the deck stays plain
    }
  }

  /* --------------------------------------------------------------- the stars */

  // Vector rather than a canvas, so a point of light stays a point of light
  // however far the plate is scaled up.
  function starTexture(rnd, tint) {
    var SIZE = 1200;
    var shapes = '';
    var i, x, y, r, a;

    for (i = 0; i < 300; i++) {
      x = (rnd() * SIZE).toFixed(1);
      y = (rnd() * SIZE).toFixed(1);
      // squared so most stars are faint specks and only a few carry weight
      r = (0.5 + rnd() * rnd() * 2.1).toFixed(2);
      a = (0.22 + rnd() * 0.72).toFixed(2);
      shapes += '<circle cx="' + x + '" cy="' + y + '" r="' + r +
        '" fill="' + tint + '" opacity="' + a + '"/>';
    }

    return 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE +
      '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '">' + shapes + '</svg>'
    );
  }

  /* --------------------------------------------------------------- the markup */

  /* The wing, from a seat just behind the root: the leading edge sweeping up
     and away to the right, two flap track fairings under the trailing edge,
     and the winglet turned up at the tip.

     preserveAspectRatio="none" rather than a fitted one, because .ws-wing is
     given exactly this drawing's 1000 x 420 in the stylesheet. Fitting it
     instead would either crop the leading edge off the top or letterbox the
     tip in from the side, depending on the shape of the screen. */
  var WING_SKIN = 'M-20 300 L700 96 L790 128 L330 350 L-20 430 Z';
  var WING_TIP = 'M770 130 L812 40 L842 48 L806 140 Z';

  var WING_SVG =
    '<svg viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<path class="ws-wing-skin" d="' + WING_SKIN + '"/>' +
      '<path class="ws-wing-lit"  d="M-20 300 L700 96 L716 112 L-20 318 Z"/>' +
      '<path class="ws-wing-dark" d="M330 350 L790 128 L796 143 L342 368 Z"/>' +
      '<path class="ws-wing-dark" d="M232 322 L278 309 L262 372 L218 379 Z"/>' +
      '<path class="ws-wing-dark" d="M424 273 L468 260 L452 320 L410 327 Z"/>' +
      '<path class="ws-wing-skin" d="' + WING_TIP + '"/>' +
      '<path class="ws-wing-lit"  d="M770 130 L812 40 L822 43 L780 134 Z"/>' +
      '<path class="ws-wing-line" d="M-20 340 L560 176"/>' +
      '<path class="ws-wing-line" d="M-20 390 L390 274"/>' +
      // the sky's own light laid back over the metal, clipped to the metal
      '<path class="ws-wing-wash" d="' + WING_SKIN + '"/>' +
      '<path class="ws-wing-wash" d="' + WING_TIP + '"/>' +
    '</svg>';

  function eyeMarkup() {
    return (
      '<div class="ws-eye">' +
        '<div class="ws-view">' +
          '<div class="ws-world">' +
            '<div class="ws-plate ws-sky"></div>' +
            '<div class="ws-plate ws-stars"></div>' +
            '<div class="ws-plate ws-glow"></div>' +
            '<div class="ws-plate ws-cirrus"></div>' +
          '</div>' +
          '<div class="ws-ground">' +
            '<div class="ws-deck"><div class="ws-deck-fade"></div></div>' +
          '</div>' +
          '<div class="ws-wing">' + WING_SVG + '</div>' +
          '<div class="ws-frame">' +
            '<div class="ws-win">' +
              '<div class="ws-aperture">' +
                '<span class="ws-pane"></span>' +
                '<span class="ws-breather"></span>' +
              '</div>' +
              '<div class="ws-bezel"></div>' +
              '<div class="ws-rail ws-rail-l"></div>' +
              '<div class="ws-rail ws-rail-r"></div>' +
              '<div class="ws-shade-clip">' +
                '<div class="ws-shade"><span class="ws-shade-tab"></span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var ICON_PHONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<rect x="7.5" y="2.8" width="9" height="18.4" rx="2"/><path d="M11 5.6h2"/>' +
    '<path d="M4.4 8.4a9 9 0 0 0 0 7.2M19.6 8.4a9 9 0 0 1 0 7.2"/></svg>';

  var ICON_VR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'aria-hidden="true"><rect x="2.2" y="7.2" width="19.6" height="9.6" rx="3"/>' +
    '<circle cx="7.6" cy="12" r="2"/><circle cx="16.4" cy="12" r="2"/></svg>';

  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" ' +
    'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function label(flight) {
    var geo = FL.geo;
    var a = geo ? geo.airport(flight.from_iata) : null;
    var b = geo ? geo.airport(flight.to_iata) : null;
    return (a ? a.city : flight.from_iata) + ' to ' + (b ? b.city : flight.to_iata);
  }

  function build(flight, sky) {
    var esc = FL.ui.esc;
    var day = FL.ui.formatDay(flight.flown_on);
    var route = label(flight);

    var alt =
      'A view out of a cabin window at flight level 350 on ' +
      flight.flight_no + ', ' + route + ', ' + day + '. Outside is ' + sky.told +
      ', with the wing entering the lower part of the frame. ' +
      'Drag, or use the arrow keys, to look around.';

    var root = document.createElement('div');
    root.className = 'ws';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Window seat — ' + flight.flight_no + ', ' + route);
    root.setAttribute('aria-describedby', 'ws-alt');
    root.setAttribute('data-sky', sky.key);
    root.setAttribute('tabindex', '-1');

    root.innerHTML =
      '<p class="visually-hidden" id="ws-alt">' + esc(alt) + '</p>' +

      /* A picture that happens to be a focus stop. role=img gives it a name a
         screen reader will read; the tab stop is what makes the arrow keys
         reachable without a mouse. The long description is on the dialog. */
      '<div class="ws-eyes" tabindex="0" role="img" ' +
        'aria-label="The view out of the window. Use the arrow keys to look around."></div>' +

      '<div class="ws-hud" aria-hidden="true">' +
        '<div class="ws-hud-left">' +
          '<p class="ws-hud-no">' + esc(flight.airline || 'Flight') + ' · ' + esc(flight.flight_no) + '</p>' +
          '<p class="ws-hud-route">' + esc(flight.from_iata) +
            '<span class="sep">→</span>' + esc(flight.to_iata) + '</p>' +
          '<p class="ws-hud-sub">' + esc(route) + ' · ' + esc(day) +
            (flight.seat ? ' · seat ' + esc(flight.seat) : '') + '</p>' +
        '</div>' +
        '<div class="ws-hud-right">' +
          '<p class="ws-hud-fl">FL350</p>' +
          '<p class="ws-hud-sub">cruise · 35,000 ft' +
            (flight.aircraft ? ' · ' + esc(flight.aircraft) : '') + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="ws-controls">' +
        '<button type="button" class="ws-btn" data-ws="gyro" aria-pressed="false" hidden ' +
          'title="Look around by moving the phone">' + ICON_PHONE +
          '<span>Look with your phone</span></button>' +
        '<button type="button" class="ws-btn" data-ws="vr" aria-pressed="false" ' +
          'title="Split the view for a Cardboard-style headset">' + ICON_VR +
          '<span>Cardboard VR</span></button>' +
        '<button type="button" class="ws-btn" data-ws="close" ' +
          'title="Close the window seat">' + ICON_CLOSE +
          '<span>Close</span></button>' +
      '</div>' +

      '<p class="ws-hint">Turn the phone on its side, then slide it into the headset.</p>';

    return root;
  }

  /* ------------------------------------------------------------------- open */

  function open(flight) {
    if (!flight || !document.body || !isSupported()) return false;
    if (!FL.ui || !FL.ui.esc) return false;   // ui.js has to be on the page first
    if (state) close();

    var rnd = rngFrom(
      String(flight.flight_no || '') + '|' + String(flight.flown_on || '') + '|' +
      String(flight.from_iata || '') + String(flight.to_iata || '')
    );
    var sky = skyFor(flight, rnd);

    var root = build(flight, sky);
    var eyes = root.querySelector('.ws-eyes');
    document.body.appendChild(root);
    document.documentElement.classList.add('ws-open');

    /* The palette has to be on the page before the textures are made: their
       colours are read back out of it rather than written twice. */
    var deckImg = deckTexture(rnd, triplet(root, '--ws-deck-lit'), triplet(root, '--ws-deck'));
    var starImg = starTexture(
      rngFrom('stars|' + flight.flight_no),
      hsla(triplet(root, '--ws-star'), 1)
    );

    if (deckImg) root.style.setProperty('--ws-deck-img', 'url("' + deckImg + '")');
    root.style.setProperty('--ws-stars-img', 'url("' + starImg + '")');
    root.style.setProperty('--ws-glow-x', sky.glowX);
    root.style.setProperty('--ws-glow-h', sky.glowH);

    var css = window.getComputedStyle(root);
    var neck = parseFloat(css.getPropertyValue('--ws-neck')) || 96;
    var ipd = parseFloat(css.getPropertyValue('--ws-ipd')) || 32;

    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    state = {
      flight: flight,
      root: root,
      eyes: eyes,
      panes: [],
      neck: neck,
      ipd: ipd,
      reduced: reduced,
      vr: false,
      gyro: false,
      gyroRef: null,
      yaw: 0, pitch: 0,
      targetYaw: 0, targetPitch: 0,
      lastYaw: null, lastPitch: null,
      dragId: null, dragX: 0, dragY: 0,
      lookTimer: 0,
      raf: 0,
      opener: document.activeElement,
      hadFullscreen: false
    };

    setEyeCount(1);
    wire();
    paint(0);
    state.raf = window.requestAnimationFrame(tick);

    // the button that got us here was a real tap, so this is allowed to ask
    goFullscreen(root);

    root.focus();
    var closeBtn = root.querySelector('[data-ws="close"]');
    if (closeBtn) closeBtn.focus();

    // iOS gates the gyroscope behind a permission prompt and every other
    // phone just has it; either way the offer only appears where it can work
    if (window.DeviceOrientationEvent) {
      var gyroBtn = root.querySelector('[data-ws="gyro"]');
      if (gyroBtn) gyroBtn.hidden = false;
    }

    return true;
  }

  /* --------------------------------------------------------------- the eyes */

  function setEyeCount(count) {
    var wanted = count;
    var have = state.eyes.children.length;
    var i;

    for (i = have; i < wanted; i++) {
      state.eyes.insertAdjacentHTML('beforeend', eyeMarkup());
    }
    for (i = have; i > wanted; i--) {
      state.eyes.removeChild(state.eyes.lastChild);
    }

    state.panes = [];
    var views = state.eyes.querySelectorAll('.ws-eye');
    for (i = 0; i < views.length; i++) {
      state.panes.push({
        world: views[i].querySelector('.ws-world'),
        ground: views[i].querySelector('.ws-ground'),
        wing: views[i].querySelector('.ws-wing')
      });
    }
    state.lastYaw = null;   // force the next frame to write
  }

  /* ------------------------------------------------------------ the one loop */

  function clamp(value, limit) {
    return value < -limit ? -limit : value > limit ? limit : value;
  }

  function paint(now) {
    var s = state;
    if (!s) return;

    /* A gentle float, because a real aeroplane at cruise is never quite still.
       Off entirely when the member has asked for less motion — then only
       deliberate input moves the scene. */
    var driftYaw = 0;
    var driftPitch = 0;
    if (!s.reduced) {
      driftYaw = Math.sin(now / 9400) * 1.1;
      driftPitch = Math.sin(now / 13100 + 1.3) * 0.75;
    }

    var yaw = s.yaw + driftYaw;
    var pitch = s.pitch + driftPitch;

    if (s.lastYaw !== null &&
        Math.abs(yaw - s.lastYaw) < 0.004 &&
        Math.abs(pitch - s.lastPitch) < 0.004) {
      return;   // nothing moved enough to be worth touching the DOM
    }
    s.lastYaw = yaw;
    s.lastPitch = pitch;

    /* Rotation on its own gives no parallax at all — only moving the head
       does. The eye is not at the neck pivot, so looking to the side carries
       it sideways as well, and that small translation is what separates the
       plates. */
    var slide = -Math.sin(yaw * RAD) * s.neck;
    var rise = Math.sin(pitch * RAD) * s.neck;

    var rot = ' rotateX(' + pitch.toFixed(3) + 'deg) rotateY(' + yaw.toFixed(3) + 'deg)';
    var wingX = (-yaw * WING_X).toFixed(2);
    var wingY = (pitch * WING_Y).toFixed(2);

    for (var i = 0; i < s.panes.length; i++) {
      // left eye first: each eye is offset by half the separation
      var off = s.vr ? (i === 0 ? -s.ipd / 2 : s.ipd / 2) : 0;
      var move =
        'translate3d(' + (slide + off).toFixed(2) + 'px,' + rise.toFixed(2) + 'px,0)' + rot;
      // the same transform on both, or the horizon steps at the join
      s.panes[i].world.style.transform = move;
      s.panes[i].ground.style.transform = move;
      s.panes[i].wing.style.transform =
        'translate3d(' + wingX + 'px,' + wingY + 'px,0)';
    }
  }

  function tick(now) {
    var s = state;
    if (!s) return;

    // one exponential step toward wherever the input has asked for; snap
    // straight there when the member has asked for less motion
    var ease = s.reduced ? 1 : 0.14;
    s.yaw += (s.targetYaw - s.yaw) * ease;
    s.pitch += (s.targetPitch - s.pitch) * ease;

    paint(now);
    s.raf = window.requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------- looking away */

  function looking(on) {
    var s = state;
    if (!s) return;
    window.clearTimeout(s.lookTimer);
    if (on) {
      s.root.setAttribute('data-looking', '1');
    } else {
      s.lookTimer = window.setTimeout(function () {
        if (state) state.root.removeAttribute('data-looking');
      }, 500);
    }
  }

  /* -------------------------------------------------------------- the inputs */

  function onPointerDown(event) {
    var s = state;
    if (!s || s.dragId !== null) return;
    s.dragId = event.pointerId;
    s.dragX = event.clientX;
    s.dragY = event.clientY;
    looking(true);
    if (s.eyes.setPointerCapture) {
      try { s.eyes.setPointerCapture(event.pointerId); } catch (e) {}
    }
  }

  function onPointerMove(event) {
    var s = state;
    if (!s || s.dragId !== event.pointerId) return;
    // dragging carries the world with the finger, which is the way round that
    // feels like moving the scene rather than steering a camera
    s.targetYaw = clamp(s.targetYaw - (event.clientX - s.dragX) * 0.18, YAW_LIMIT);
    s.targetPitch = clamp(s.targetPitch - (event.clientY - s.dragY) * 0.18, PITCH_LIMIT);
    s.dragX = event.clientX;
    s.dragY = event.clientY;
  }

  function onPointerUp(event) {
    var s = state;
    if (!s || s.dragId !== event.pointerId) return;
    s.dragId = null;
    looking(false);
  }

  function onKeyDown(event) {
    var s = state;
    if (!s) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Tab') {
      trapTab(event);
      return;
    }

    var step = 4;
    var moved = true;

    if (event.key === 'ArrowLeft') s.targetYaw = clamp(s.targetYaw - step, YAW_LIMIT);
    else if (event.key === 'ArrowRight') s.targetYaw = clamp(s.targetYaw + step, YAW_LIMIT);
    else if (event.key === 'ArrowUp') s.targetPitch = clamp(s.targetPitch + step, PITCH_LIMIT);
    else if (event.key === 'ArrowDown') s.targetPitch = clamp(s.targetPitch - step, PITCH_LIMIT);
    else if (event.key === 'Home') { s.targetYaw = 0; s.targetPitch = 0; }
    else moved = false;

    if (moved) {
      event.preventDefault();
      looking(true);
      looking(false);
    }
  }

  // A modal has to keep the tab ring inside itself, and this scene has only
  // four stops, so the whole trap is two comparisons.
  function trapTab(event) {
    var stops = state.root.querySelectorAll('.ws-eyes, .ws-btn:not([hidden])');
    if (!stops.length) return;
    var first = stops[0];
    var last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------- the gyroscope */

  function onOrient(event) {
    var s = state;
    if (!s || !s.gyro || event.alpha === null || event.alpha === undefined) return;

    var angle = 0;
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      angle = window.screen.orientation.angle;
    } else if (typeof window.orientation === 'number') {
      angle = window.orientation;
    }

    var beta = event.beta || 0;    // nose up and down while upright
    var gamma = event.gamma || 0;  // roll, which becomes the nose once sideways
    var alpha = event.alpha || 0;  // heading

    /* Held on its side for a headset it is gamma that points up and down, and
       held upright it is beta. Anything cleverer than this needs a quaternion
       and a magnetometer fusion this module does not have. */
    var raw;
    if (angle === 90) raw = gamma;
    else if (angle === -90 || angle === 270) raw = -gamma;
    else if (angle === 180) raw = -beta;
    else raw = beta - 90;

    if (!s.gyroRef) s.gyroRef = { alpha: alpha, pitch: raw };

    // alpha counts up as the phone turns left, so the sign flips to make
    // turning right look right
    var yaw = -(alpha - s.gyroRef.alpha);
    while (yaw > 180) yaw -= 360;
    while (yaw < -180) yaw += 360;

    s.targetYaw = clamp(yaw, YAW_LIMIT);
    s.targetPitch = clamp(raw - s.gyroRef.pitch, PITCH_LIMIT);
  }

  function toggleGyro(button) {
    var s = state;
    if (!s) return;

    if (s.gyro) {
      s.gyro = false;
      s.gyroRef = null;
      window.removeEventListener('deviceorientation', onOrient);
      button.setAttribute('aria-pressed', 'false');
      looking(false);
      return;
    }

    function start() {
      s.gyro = true;
      s.gyroRef = null;
      window.addEventListener('deviceorientation', onOrient);
      button.setAttribute('aria-pressed', 'true');
      looking(true);
      looking(false);
    }

    function refuse() {
      // no scolding and no dead end: the drag was always there and still is
      button.hidden = true;
      if (FL.ui && FL.ui.toast) {
        FL.ui.toast('Drag to look around instead.', 'info');
      }
    }

    var DOE = window.DeviceOrientationEvent;
    if (!DOE) { refuse(); return; }

    // asked for here, on a deliberate tap, and never on the way in
    if (typeof DOE.requestPermission === 'function') {
      var asked;
      try {
        asked = DOE.requestPermission();
      } catch (e) {
        refuse();
        return;
      }
      if (asked && asked.then) {
        asked.then(function (verdict) {
          if (verdict === 'granted') start();
          else refuse();
        })['catch'](refuse);
      } else {
        start();
      }
      return;
    }

    start();
  }

  /* ------------------------------------------------------------ Cardboard VR */

  function toggleVr(button) {
    var s = state;
    if (!s) return;

    s.vr = !s.vr;
    button.setAttribute('aria-pressed', s.vr ? 'true' : 'false');
    if (s.vr) s.root.setAttribute('data-vr', '1');
    else s.root.removeAttribute('data-vr');

    setEyeCount(s.vr ? 2 : 1);

    if (s.vr) lockLandscape();
    else unlockOrientation();
  }

  function lockLandscape() {
    var o = window.screen && window.screen.orientation;
    if (!o || typeof o.lock !== 'function') return;
    try {
      var locking = o.lock('landscape');
      if (locking && locking['catch']) locking['catch'](function () {});
    } catch (e) {
      /* desktops and most browsers refuse; the hint covers it */
    }
  }

  function unlockOrientation() {
    var o = window.screen && window.screen.orientation;
    if (!o || typeof o.unlock !== 'function') return;
    try { o.unlock(); } catch (e) {}
  }

  /* -------------------------------------------------------------- fullscreen */

  function goFullscreen(node) {
    var ask = node.requestFullscreen || node.webkitRequestFullscreen;
    if (!ask) return;
    try {
      var going = ask.call(node);
      if (going && going.then) {
        going.then(function () {
          if (state) state.hadFullscreen = true;
        })['catch'](function () {});
      } else {
        state.hadFullscreen = true;
      }
    } catch (e) {
      /* iPhone Safari has no element fullscreen: the fixed overlay is enough */
    }
  }

  function leaveFullscreen() {
    var out = document.exitFullscreen || document.webkitExitFullscreen;
    if (!out) return;
    var current = document.fullscreenElement || document.webkitFullscreenElement;
    if (!current) return;
    try {
      var going = out.call(document);
      if (going && going['catch']) going['catch'](function () {});
    } catch (e) {}
  }

  /* -------------------------------------------------------------------- wire */

  function onControlClick(event) {
    var button = event.target.closest ? event.target.closest('.ws-btn') : null;
    if (!button) return;
    var what = button.getAttribute('data-ws');
    if (what === 'close') close();
    else if (what === 'vr') toggleVr(button);
    else if (what === 'gyro') toggleGyro(button);
  }

  // A safety net for Escape. The handler on the scene only sees a key when
  // the focus is still inside it, and focus can end up elsewhere — the
  // browser's own chrome, an extension — without the member knowing.
  function onDocKey(event) {
    if (state && event.key === 'Escape') close();
  }

  function wire() {
    var s = state;
    s.eyes.addEventListener('pointerdown', onPointerDown);
    s.eyes.addEventListener('pointermove', onPointerMove);
    s.eyes.addEventListener('pointerup', onPointerUp);
    s.eyes.addEventListener('pointercancel', onPointerUp);
    s.root.addEventListener('keydown', onKeyDown);
    s.root.addEventListener('click', onControlClick);
    document.addEventListener('keydown', onDocKey);
  }

  function unwire() {
    var s = state;
    s.eyes.removeEventListener('pointerdown', onPointerDown);
    s.eyes.removeEventListener('pointermove', onPointerMove);
    s.eyes.removeEventListener('pointerup', onPointerUp);
    s.eyes.removeEventListener('pointercancel', onPointerUp);
    s.root.removeEventListener('keydown', onKeyDown);
    s.root.removeEventListener('click', onControlClick);
    document.removeEventListener('keydown', onDocKey);
    window.removeEventListener('deviceorientation', onOrient);
  }

  /* ------------------------------------------------------------------- close */

  function close() {
    var s = state;
    if (!s) return;

    window.cancelAnimationFrame(s.raf);
    window.clearTimeout(s.lookTimer);
    unwire();
    unlockOrientation();
    leaveFullscreen();

    if (s.root.parentNode) s.root.parentNode.removeChild(s.root);
    document.documentElement.classList.remove('ws-open');

    var back = s.opener;
    state = null;

    // back to the button that opened it, so a keyboard does not lose its place
    if (back && back.focus && document.contains(back)) {
      try { back.focus(); } catch (e) {}
    }
  }

  FL.windowseat = {
    open: open,
    close: close,
    isSupported: isSupported
  };
})();
