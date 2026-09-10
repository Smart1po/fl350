/* FL350 · the route globe.
 *
 * An orthographic projection — the Earth as it looks from a long way off,
 * not a flat rectangle — with a great-circle arc for every flight in the
 * locker. Drawn as one inline SVG, no library, no map tiles, no coastlines.
 *
 * Two things are worth knowing before reading any of this.
 *
 * First, every coordinate is turned into a unit vector on the sphere and
 * kept that way. Averaging latitudes and longitudes as plain numbers falls
 * apart at the antimeridian — Tokyo at 140 and Los Angeles at -118 average
 * to a point in the Middle East — so the view centre is the normalised sum
 * of the vectors instead, which is the only answer that is right everywhere.
 *
 * Second, half the globe is facing away. Anything drawn there has to be cut
 * at the limb rather than skipped, or an arc leaving the visible hemisphere
 * would jump straight across the sphere to wherever it comes back.
 *
 * There are no coastlines on purpose. This file has no geographic data
 * beyond the airport list, and a hand-guessed continent would look worse
 * than a clean graticule.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var RAD = Math.PI / 180;

  /* the drawing is authored in a 400 x 400 box and scaled by CSS, so these
     are viewBox units rather than pixels. */
  var BOX = 400;
  var CX = 200;
  var CY = 200;
  var R = 164;             /* the rest of the box is margin for the labels */
  var ARC_SAMPLES = 64;    /* the most any one arc gets; see arcSvg */
  var ARC_DEGREES = 2.5;   /* and the target spacing that decides how many */
  var GRAT_STEP = 4;       /* degrees between samples along a graticule line */
  var LABEL_SIZE = 13;     /* has to match .rg-label, for the collision test */
  var LABEL_W = LABEL_SIZE * 2.1;  /* three mono characters, near enough */
  var LABEL_H = LABEL_SIZE * 1.3;
  var LABEL_GAP = 5;       /* clear air between a dot and its own code */
  var MAX_LABELS = 6;
  var DRAW_MS = 560;       /* one arc drawing itself */
  var STAGGER_MS = 340;    /* first arc to last, so the whole pass is ~900ms */
  var DRAW_LIMIT = 120;    /* above this many routes the draw-in is dropped */

  /* where the globe looks when there is nothing to centre it on */
  var EMPTY_LAT = 24;
  var EMPTY_LON = 30;

  var seq = 0;             /* gradient ids must be unique if two globes exist */
  var drawTimer = null;

  /* ------------------------------------------------------------- vectors */

  function unit(lat, lon) {
    var a = lat * RAD;
    var b = lon * RAD;
    var c = Math.cos(a);
    return [c * Math.cos(b), c * Math.sin(b), Math.sin(a)];
  }

  var EMPTY_VIEW = unit(EMPTY_LAT, EMPTY_LON);

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function normalise(v) {
    var len = Math.sqrt(dot(v, v));
    if (len < 1e-12) return null;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function clamp(value, low, high) {
    return value < low ? low : value > high ? high : value;
  }

  // walking along the great circle from a to b. the two degenerate cases are
  // real: two flights out of the same airport give a == b, and a genuinely
  // antipodal pair has no unique route, so one is chosen and stuck to.
  function slerp(a, b, t) {
    var d = clamp(dot(a, b), -1, 1);
    var omega = Math.acos(d);
    var sin = Math.sin(omega);

    if (sin < 1e-9) {
      if (d > 0) return [a[0], a[1], a[2]];
      var axis = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      var perp = normalise(cross(a, axis)) || [0, 0, 1];
      var ang = Math.PI * t;
      var cs = Math.cos(ang);
      var sn = Math.sin(ang);
      return [a[0] * cs + perp[0] * sn, a[1] * cs + perp[1] * sn, a[2] * cs + perp[2] * sn];
    }

    var k0 = Math.sin((1 - t) * omega) / sin;
    var k1 = Math.sin(t * omega) / sin;
    return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
  }

  /* ---------------------------------------------------------- projection */

  // the view is the centre vector plus the two directions that point east
  // and north at that centre. projecting is then two dot products, and the
  // third one — against the centre itself — is the near/far test.
  function viewFor(centre) {
    var lat0 = Math.asin(clamp(centre[2], -1, 1));
    var lon0 = Math.atan2(centre[1], centre[0]);
    return {
      c: centre,
      east: [-Math.sin(lon0), Math.cos(lon0), 0],
      north: [
        -Math.sin(lat0) * Math.cos(lon0),
        -Math.sin(lat0) * Math.sin(lon0),
        Math.cos(lat0)
      ],
      lat: lat0 / RAD,
      lon: lon0 / RAD
    };
  }

  function project(view, u) {
    return {
      x: CX + dot(u, view.east) * R,
      y: CY - dot(u, view.north) * R,
      near: dot(u, view.c) >= 0
    };
  }

  // where a great circle crosses the edge of the visible hemisphere. twenty
  // halvings is far finer than a 400 unit box can show, and it is the reason
  // a clipped line meets the limb instead of stopping a few degrees short.
  function limbPoint(view, near, far) {
    var lo = 0;
    var hi = 1;
    var mid;
    for (var i = 0; i < 20; i++) {
      mid = (lo + hi) / 2;
      if (dot(slerp(near, far, mid), view.c) >= 0) lo = mid; else hi = mid;
    }
    return slerp(near, far, lo);
  }

  // a run of unit vectors becomes one or more visible pieces. the pieces are
  // separate because a line that goes round the back and returns must not be
  // joined up across the front.
  function trace(view, points) {
    var pieces = [];
    var current = null;
    var i;
    var p;

    for (i = 0; i < points.length; i++) {
      p = project(view, points[i]);
      if (p.near) {
        if (!current) {
          current = [];
          if (i > 0) current.push(project(view, limbPoint(view, points[i], points[i - 1])));
          pieces.push(current);
        }
        current.push(p);
      } else if (current) {
        current.push(project(view, limbPoint(view, points[i - 1], points[i])));
        current = null;
      }
    }

    return pieces;
  }

  // one decimal place. at this radius that is a tenth of a unit, which is
  // under a fifth of a pixel even on the widest the globe is allowed to get,
  // and it keeps the path data a third smaller than the obvious two.
  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  // the length is summed here rather than read back with getTotalLength()
  // later, because measuring a hundred paths from the DOM forces a hundred
  // layouts and the polyline length is exact anyway.
  function pathFrom(pieces) {
    var d = '';
    var length = 0;
    var i;
    var j;
    var piece;
    var dx;
    var dy;

    for (i = 0; i < pieces.length; i++) {
      piece = pieces[i];
      if (piece.length < 2) continue;
      d += 'M' + round1(piece[0].x) + ' ' + round1(piece[0].y);
      for (j = 1; j < piece.length; j++) {
        d += 'L' + round1(piece[j].x) + ' ' + round1(piece[j].y);
        dx = piece[j].x - piece[j - 1].x;
        dy = piece[j].y - piece[j - 1].y;
        length += Math.sqrt(dx * dx + dy * dy);
      }
    }

    return { d: d, length: length };
  }

  /* ----------------------------------------------------------- graticule */

  function graticule(view) {
    var out = [];
    var lon;
    var lat;
    var step;
    var points;

    for (lon = -180; lon < 180; lon += 30) {
      points = [];
      for (step = -90; step <= 90; step += GRAT_STEP) points.push(unit(step, lon));
      out.push({ d: pathFrom(trace(view, points)).d, equator: false });
    }

    for (lat = -60; lat <= 60; lat += 30) {
      points = [];
      for (step = -180; step <= 180; step += GRAT_STEP) points.push(unit(lat, step));
      out.push({ d: pathFrom(trace(view, points)).d, equator: lat === 0 });
    }

    return out.filter(function (line) { return line.d !== ''; });
  }

  /* -------------------------------------------------------- naming a view */

  // coarse on purpose. this exists only so the aria-label can say where the
  // reader is looking in words a person would use, and the nearest of thirty
  // rough anchors is close enough for that sentence.
  var REGIONS = [
    ['the Arabian Gulf', 26, 52],
    ['the Levant', 33, 36],
    ['the Red Sea', 20, 39],
    ['North Africa', 28, 15],
    ['West Africa', 8, -5],
    ['East Africa', 2, 38],
    ['southern Africa', -25, 25],
    ['western Europe', 48, 4],
    ['northern Europe', 61, 18],
    ['eastern Europe', 50, 30],
    ['the Mediterranean', 37, 15],
    ['Türkiye and the Caucasus', 40, 40],
    ['Central Asia', 43, 65],
    ['Siberia', 62, 100],
    ['South Asia', 22, 78],
    ['South East Asia', 5, 108],
    ['East Asia', 34, 114],
    ['Japan and Korea', 37, 133],
    ['Australia', -25, 134],
    ['the South Pacific', -25, 170],
    ['the North Pacific', 32, -170],
    ['western North America', 42, -115],
    ['central North America', 45, -95],
    ['eastern North America', 40, -78],
    ['the Caribbean', 17, -75],
    ['South America', -14, -58],
    ['the North Atlantic', 44, -36],
    ['the South Atlantic', -25, -15],
    ['the Indian Ocean', -18, 76],
    ['the Arctic', 84, 0],
    ['Antarctica', -84, 0]
  ];

  function regionName(view) {
    var here = view.c;
    var best = REGIONS[0][0];
    var bestDot = -2;
    var d;
    for (var i = 0; i < REGIONS.length; i++) {
      d = dot(here, unit(REGIONS[i][1], REGIONS[i][2]));
      if (d > bestDot) { bestDot = d; best = REGIONS[i][0]; }
    }
    return best;
  }

  /* ------------------------------------------------------------- reading */

  // one flight row -> the two ends, or nothing at all if either code is not
  // in the airport list. those get counted, not quietly dropped.
  function readFlights(list) {
    var geo = FL.geo;
    var kept = [];
    var skipped = 0;
    var i;
    var row;
    var a;
    var b;

    for (i = 0; i < (list ? list.length : 0); i++) {
      row = list[i];
      if (!row) continue;
      a = geo.airport(row.from_iata);
      b = geo.airport(row.to_iata);
      if (!a || !b) { skipped += 1; continue; }
      kept.push({
        from: String(row.from_iata).toUpperCase(),
        to: String(row.to_iata).toUpperCase(),
        a: a,
        b: b,
        on: String(row.flown_on || '')
      });
    }

    return { flights: kept, skipped: skipped };
  }

  function collect(flights) {
    var airports = {};
    var order = [];
    var routes = {};
    var routeOrder = [];
    var i;
    var f;
    var key;

    function touch(code, info) {
      if (!airports[code]) {
        airports[code] = { code: code, info: info, u: unit(info.lat, info.lon), count: 0 };
        order.push(code);
      }
      airports[code].count += 1;
    }

    for (i = 0; i < flights.length; i++) {
      f = flights[i];
      touch(f.from, f.a);
      if (f.to !== f.from) touch(f.to, f.b);

      // KWI to LHR and LHR to KWI draw the identical line, so they are one
      // route here; stacking two paths on the same pixels only muddies it.
      key = f.from < f.to ? f.from + '–' + f.to : f.to + '–' + f.from;
      if (!routes[key]) {
        routes[key] = { key: key, from: f.from, to: f.to, a: f.a, b: f.b, count: 0, first: f.on };
        routeOrder.push(key);
      }
      routes[key].count += 1;
      if (f.on && (!routes[key].first || f.on < routes[key].first)) routes[key].first = f.on;
    }

    return {
      airports: order.map(function (code) { return airports[code]; }),
      routes: routeOrder.map(function (code) { return routes[code]; })
    };
  }

  // the spherical mean: sum the unit vectors and normalise. a member who has
  // only flown around the Gulf lands on the Gulf; Seoul and London land
  // somewhere over Siberia, which holds both ends in view.
  function centreOf(airports) {
    var sum = [0, 0, 0];
    var i;
    for (i = 0; i < airports.length; i++) {
      sum[0] += airports[i].u[0];
      sum[1] += airports[i].u[1];
      sum[2] += airports[i].u[2];
    }
    // an evenly spread set can cancel itself out; then any one airport is as
    // defensible a centre as any other.
    return normalise(sum) || airports[0].u;
  }

  /* ------------------------------------------------------------ the parts */

  function weightClass(count) {
    return count >= 4 ? 'rg-w3' : count >= 2 ? 'rg-w2' : 'rg-w1';
  }

  // How much of the sphere the member's world actually covers, in viewBox
  // units, measured across the airports that are facing us. Six Gulf hops
  // land inside a dozen units; a round-the-world locker spans nearly the
  // whole 328. Everything drawn on top has to be sized against this or the
  // first case is a gold smudge and the second is a spider's web.
  function spreadOf(view, airports) {
    var seen = [];
    var i;
    var p;

    for (i = 0; i < airports.length; i++) {
      p = project(view, airports[i].u);
      if (p.near) seen.push(p);
    }
    if (seen.length < 2) return 0;

    var mx = 0;
    var my = 0;
    for (i = 0; i < seen.length; i++) { mx += seen[i].x; my += seen[i].y; }
    mx /= seen.length;
    my /= seen.length;

    var far = 0;
    for (i = 0; i < seen.length; i++) {
      far = Math.max(far, Math.sqrt(
        (seen[i].x - mx) * (seen[i].x - mx) + (seen[i].y - my) * (seen[i].y - my)
      ));
    }
    return far * 2;
  }

  // the two multipliers .rg reads, and the dot radius, all off the spread.
  // the floors matter as much as the ceilings. 0.6 of the full weight is
  // about where a line stops surviving a 320px phone, and the three route
  // weights have to stay far enough apart at that floor that a route flown
  // four times still looks heavier than one flown once.
  function scaleFor(spread) {
    var full = R * 2;
    var t = spread <= 0 ? 1 : Math.min(1, spread / full);
    return {
      k: round2(Math.max(0.6, t)),
      g: round2(Math.max(0.22, t)),
      dot: Math.max(1.4, Math.min(2.6, t * 3.2))
    };
  }

  function dotRadius(count, base) {
    return round1(Math.min(base * 2.5, base + Math.sqrt(Math.max(0, count - 1)) * base * 0.35));
  }

  function arcSvg(view, routes, animated) {
    var glows = '';
    var lines = '';
    var i;
    var route;
    var samples;
    var steps;
    var from;
    var to;
    var t;
    var built;
    var weight;
    var delay;
    var attrs;
    var esc = FL.ui.esc;

    var ordered = routes.slice().sort(function (a, b) {
      return a.first < b.first ? -1 : a.first > b.first ? 1 : 0;
    });

    for (i = 0; i < ordered.length; i++) {
      route = ordered[i];
      // a flight that starts and ends at the same airport has no line to
      // draw; the dot still gets its count.
      if (route.from === route.to) continue;

      // sampling by angle rather than a flat count: a Kuwait to Bahrain hop
      // is four degrees long and needs nothing like the same number of
      // points as a Kuwait to Sydney one, which gets the full sixty-four.
      from = unit(route.a.lat, route.a.lon);
      to = unit(route.b.lat, route.b.lon);
      steps = Math.acos(clamp(dot(from, to), -1, 1)) / RAD / ARC_DEGREES;
      steps = Math.max(10, Math.min(ARC_SAMPLES, Math.ceil(steps)));

      samples = [];
      for (t = 0; t <= steps; t++) samples.push(slerp(from, to, t / steps));

      built = pathFrom(trace(view, samples));
      if (!built.d) continue;

      weight = weightClass(route.count);
      delay = ordered.length > 1 ? Math.round((i / (ordered.length - 1)) * STAGGER_MS) : 0;
      attrs =
        ' d="' + built.d + '"' +
        (animated
          ? ' data-len="' + round1(built.length) + '" data-delay="' + delay + '"'
          : '');

      glows += '<path class="rg-glow ' + weight + (animated ? ' rg-draw' : '') + '"' + attrs + '></path>';
      lines +=
        '<path class="rg-arc ' + weight + (animated ? ' rg-draw' : '') + '"' + attrs + '>' +
        '<title>' + esc(route.key + ' · ' + route.count + (route.count === 1 ? ' flight' : ' flights')) +
        '</title></path>';
    }

    return '<g class="rg-glows" aria-hidden="true">' + glows + '</g>' +
           '<g class="rg-arcs">' + lines + '</g>';
  }

  function overlaps(box, placed, skip) {
    for (var i = 0; i < placed.length; i++) {
      var other = placed[i];
      if (other === skip) continue;
      if (box[0] < other[2] && box[2] > other[0] && box[1] < other[3] && box[3] > other[1]) return true;
    }
    return false;
  }

  // A label is always offset sideways from its dot, so it never sits on top
  // of it. Gulf airports land within a few units of each other at this scale,
  // so if the first position is taken the code fans one line up or down
  // before giving up: better four fanned labels than two and a gap.
  function placeLabel(p, r, placed, own) {
    var sides = p.x >= CX ? [1, -1] : [-1, 1];
    var lifts = [0, -LABEL_SIZE * 0.95, LABEL_SIZE * 0.95];
    var s;
    var l;

    for (l = 0; l < lifts.length; l++) {
      for (s = 0; s < sides.length; s++) {
        var anchor = sides[s] > 0 ? 'start' : 'end';
        var x = p.x + sides[s] * (r + LABEL_GAP);
        var left = anchor === 'start' ? x : x - LABEL_W;
        if (left < 6 || left + LABEL_W > BOX - 6) continue;

        var y = p.y + lifts[l] + LABEL_SIZE * 0.35;
        if (y - LABEL_H < 6 || y > BOX - 6) continue;

        var box = [left, y - LABEL_H, left + LABEL_W, y + LABEL_SIZE * 0.3];
        if (overlaps(box, placed, own)) continue;

        return { x: x, y: y, anchor: anchor, box: box };
      }
    }

    return null;
  }

  function dotsAndLabels(view, airports, scale) {
    var dots = '';
    var labels = '';
    var placed = [];
    var busiest = airports.slice().sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return a.code < b.code ? -1 : 1;
    }).slice(0, MAX_LABELS);
    var i;
    var p;
    var r;

    for (i = 0; i < airports.length; i++) {
      p = project(view, airports[i].u);
      if (!p.near) continue;
      r = dotRadius(airports[i].count, scale.dot);
      dots +=
        '<circle class="rg-dot" cx="' + round1(p.x) + '" cy="' + round1(p.y) + '" r="' + r + '"></circle>';
    }

    // The six dots that get a code are obstacles as well as anchors: a label
    // resting on a neighbour's dot reads as that neighbour's label. The other
    // dots are left out of it on purpose — on a well travelled globe there
    // are a hundred of them and treating every one as a wall means no code
    // gets placed at all, while a code crossing a minor dot still reads
    // through its halo.
    for (i = 0; i < busiest.length; i++) {
      p = project(view, busiest[i].u);
      if (!p.near) continue;
      r = dotRadius(busiest[i].count, scale.dot);
      busiest[i].box = [p.x - r, p.y - r, p.x + r, p.y + r];
      placed.push(busiest[i].box);
    }

    // busiest first, so when two codes want the same patch of sky the one
    // that matters more to this member keeps it.
    for (i = 0; i < busiest.length; i++) {
      p = project(view, busiest[i].u);
      if (!p.near) continue;   // nothing on the far side gets a label

      r = dotRadius(busiest[i].count, scale.dot);
      var slot = placeLabel(p, r, placed, busiest[i].box);
      if (!slot) continue;
      placed.push(slot.box);

      labels +=
        '<text class="rg-label" x="' + round1(slot.x) + '" y="' + round1(slot.y) +
        '" text-anchor="' + slot.anchor + '">' + FL.ui.esc(busiest[i].code) + '</text>';
    }

    return '<g class="rg-dots" aria-hidden="true">' + dots + '</g>' +
           '<g class="rg-labels" aria-hidden="true">' + labels + '</g>';
  }

  /* ------------------------------------------------------------- wording */

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  // one sentence, written once. the caption prints it as it is and the
  // aria-label prints it with 'A globe showing' in front, so the two can
  // never drift apart.
  function sentence(flightCount, airportCount, view) {
    if (!flightCount) return 'Nothing plotted yet. Add a flight and it appears here.';
    return plural(flightCount, 'flight') + ' between ' +
      plural(airportCount, 'airport') + ', centred on ' + regionName(view) + '.';
  }

  function summary(flightCount, airportCount, view) {
    if (!flightCount) return 'An empty globe, with nothing plotted on it yet.';
    return 'A globe showing ' + sentence(flightCount, airportCount, view);
  }

  function skippedLine(skipped) {
    if (!skipped) return '';
    return ' ' + plural(skipped, 'flight') + (skipped === 1 ? ' is' : ' are') +
      ' not drawn — ' + (skipped === 1 ? 'its' : 'their') +
      ' airport codes are not in the list, so there are no coordinates for ' +
      (skipped === 1 ? 'it' : 'them') + '.';
  }

  /* ------------------------------------------------------------ the draw */

  // the arcs write themselves on once, oldest flight first. the dash length
  // is the path's own length, so the pen travels at the same speed on a
  // short hop as on a long one.
  function animate(root) {
    var paths = root.querySelectorAll('.rg-draw');
    var i;
    var last = 0;

    if (!paths.length) return;

    for (i = 0; i < paths.length; i++) {
      var length = Number(paths[i].getAttribute('data-len')) || 0;
      paths[i].style.setProperty('stroke-dasharray', String(length));
      paths[i].style.setProperty('stroke-dashoffset', String(length));
    }

    // read something back so the browser commits the state above as the
    // starting point instead of collapsing both writes into one frame.
    root.getBoundingClientRect();

    for (i = 0; i < paths.length; i++) {
      var delay = Number(paths[i].getAttribute('data-delay')) || 0;
      if (delay > last) last = delay;
      paths[i].style.setProperty(
        'transition',
        'stroke-dashoffset ' + DRAW_MS + 'ms cubic-bezier(.25,.46,.45,.94) ' + delay + 'ms'
      );
      paths[i].style.setProperty('stroke-dashoffset', '0');
    }

    // once it has arrived the dash pattern is dropped again, so nothing is
    // left rounding the ends of a path that is meant to be continuous.
    if (drawTimer) window.clearTimeout(drawTimer);
    drawTimer = window.setTimeout(function () {
      drawTimer = null;
      for (var k = 0; k < paths.length; k++) {
        paths[k].style.removeProperty('stroke-dasharray');
        paths[k].style.removeProperty('stroke-dashoffset');
        paths[k].style.removeProperty('transition');
      }
    }, last + DRAW_MS + 80);
  }

  function prefersStillness() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ------------------------------------------------------------- render */

  function render(container, list) {
    if (!container || !FL.ui || !FL.geo) return;

    var esc = FL.ui.esc;
    var read = readFlights(list);
    var parts = collect(read.flights);
    var airports = parts.airports;
    var routes = parts.routes;

    // with nothing to plot the globe still gets drawn, on a view that shows
    // most of the inhabited world, so the empty state is the same object as
    // the full one rather than a different-looking placeholder.
    var view = viewFor(airports.length ? centreOf(airports) : EMPTY_VIEW);
    var scale = scaleFor(spreadOf(view, airports));

    // the draw-in happens once per container, and not at all for somebody
    // who has asked for less motion. a locker past DRAW_LIMIT routes would
    // put a few hundred paths through a dash transition at once, which is
    // where the animation stops feeling calm and starts dropping frames, so
    // that globe simply arrives finished.
    var firstTime = container.getAttribute('data-rg-drawn') !== '1';
    var animated =
      firstTime && !prefersStillness() && routes.length > 0 && routes.length <= DRAW_LIMIT;

    var id = 'rg-sphere-' + (seq += 1);
    var lines = graticule(view);
    var i;

    var grat = '';
    for (i = 0; i < lines.length; i++) {
      grat += '<path' + (lines[i].equator ? ' class="rg-equator"' : '') + ' d="' + lines[i].d + '"></path>';
    }

    // the skipped count goes into the aria-label as well as the caption, so
    // the picture on its own is not quietly more complete than its
    // description.
    var label = summary(read.flights.length, airports.length, view) + skippedLine(read.skipped);

    var told = routes.slice().sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return a.key < b.key ? -1 : 1;
    });
    var readOut = '';
    for (i = 0; i < told.length; i++) {
      readOut +=
        '<li>' + esc(
          told[i].from + ' to ' + told[i].to + ', ' +
          told[i].a.city + ' to ' + told[i].b.city + ', ' +
          plural(told[i].count, 'flight')
        ) + '</li>';
    }

    container.innerHTML =
      '<figure class="rg">' +
        '<div class="rg-frame">' +
          '<svg class="rg-svg" viewBox="0 0 ' + BOX + ' ' + BOX + '" role="img" ' +
               'aria-label="' + esc(label) + '">' +
            '<defs>' +
              '<radialGradient id="' + id + '" cx="34%" cy="30%" r="78%">' +
                '<stop offset="0" class="rg-stop-hi"></stop>' +
                '<stop offset="1" class="rg-stop-lo"></stop>' +
              '</radialGradient>' +
            '</defs>' +
            '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="url(#' + id + ')"></circle>' +
            '<g class="rg-grat" aria-hidden="true">' + grat + '</g>' +
            '<circle class="rg-limb-ring" cx="' + CX + '" cy="' + CY + '" r="' + R + '"></circle>' +
            arcSvg(view, routes, animated) +
            dotsAndLabels(view, airports, scale) +
          '</svg>' +
        '</div>' +
        // the strings this file builds are English, and an English sentence
        // dropped into an Arabic page has its number and full stop shuffled
        // by the bidi algorithm unless it says so. if the copy is ever
        // translated, these two attributes go with it.
        '<figcaption class="rg-caption caption" lang="en" dir="ltr">' +
          esc(sentence(read.flights.length, airports.length, view)) +
          esc(skippedLine(read.skipped)) +
        '</figcaption>' +
        (readOut
          ? '<div class="visually-hidden" lang="en" dir="ltr">' +
            '<p>Routes on this globe:</p><ul>' + readOut + '</ul></div>'
          : '') +
      '</figure>';

    container.setAttribute('data-rg-drawn', '1');

    // the two line-weight multipliers are set here rather than written into
    // the markup, because a style attribute in markup is refused by this
    // site's Content-Security-Policy. reaching the same property through the
    // CSSOM is not, which is the whole difference.
    var figure = container.firstChild;
    if (figure && figure.style) {
      figure.style.setProperty('--rg-k', String(scale.k));
      figure.style.setProperty('--rg-g', String(scale.g));
    }

    if (animated) animate(container);
  }

  FL.routeglobe = { render: render };
})();
