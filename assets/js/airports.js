/* FL350 · a lookup list, not a database table.
 *
 * Two plain objects that never change and never leave the browser:
 *
 *   AIRPORTS   IATA code -> [ airport name, city, country, latitude, longitude ]
 *   CARRIERS   the two-character prefix of a flight number -> airline name
 *
 * They do three jobs. KWI can be shown as "Kuwait City" instead of three
 * letters. Typing "KU 681" can offer to fill in "Kuwait Airways". And two sets
 * of coordinates give an approximate great-circle distance for the stats.
 *
 * A code that is not on this list is still accepted — the flight just shows
 * without a city name or a distance. Coordinates are rounded to two decimal
 * places, which is roughly a kilometre, so distances are approximate on
 * purpose and labelled that way in the interface.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  var AIRPORTS = {
    /* --- Kuwait and the Gulf ------------------------------------------- */
    KWI: ['Kuwait International', 'Kuwait City', 'Kuwait', 29.23, 47.98],
    DXB: ['Dubai International', 'Dubai', 'United Arab Emirates', 25.25, 55.36],
    DWC: ['Al Maktoum International', 'Dubai', 'United Arab Emirates', 24.9, 55.16],
    AUH: ['Zayed International', 'Abu Dhabi', 'United Arab Emirates', 24.43, 54.65],
    SHJ: ['Sharjah International', 'Sharjah', 'United Arab Emirates', 25.33, 55.52],
    DOH: ['Hamad International', 'Doha', 'Qatar', 25.27, 51.61],
    BAH: ['Bahrain International', 'Manama', 'Bahrain', 26.27, 50.63],
    RUH: ['King Khalid International', 'Riyadh', 'Saudi Arabia', 24.96, 46.7],
    JED: ['King Abdulaziz International', 'Jeddah', 'Saudi Arabia', 21.68, 39.16],
    DMM: ['King Fahd International', 'Dammam', 'Saudi Arabia', 26.47, 49.8],
    MED: ['Prince Mohammad bin Abdulaziz', 'Medina', 'Saudi Arabia', 24.55, 39.7],
    MCT: ['Muscat International', 'Muscat', 'Oman', 23.59, 58.28],
    SLL: ['Salalah', 'Salalah', 'Oman', 17.04, 54.09],
    BGW: ['Baghdad International', 'Baghdad', 'Iraq', 33.26, 44.23],
    BSR: ['Basra International', 'Basra', 'Iraq', 30.55, 47.66],
    EBL: ['Erbil International', 'Erbil', 'Iraq', 36.24, 43.96],
    NJF: ['Al Najaf International', 'Najaf', 'Iraq', 31.99, 44.4],

    /* --- the wider region --------------------------------------------- */
    AMM: ['Queen Alia International', 'Amman', 'Jordan', 31.72, 35.99],
    BEY: ['Rafic Hariri International', 'Beirut', 'Lebanon', 33.82, 35.49],
    DAM: ['Damascus International', 'Damascus', 'Syria', 33.41, 36.51],
    CAI: ['Cairo International', 'Cairo', 'Egypt', 30.11, 31.41],
    HBE: ['Borg El Arab', 'Alexandria', 'Egypt', 30.92, 29.7],
    HRG: ['Hurghada International', 'Hurghada', 'Egypt', 27.18, 33.8],
    SSH: ['Sharm El Sheikh International', 'Sharm El Sheikh', 'Egypt', 27.98, 34.39],
    IKA: ['Imam Khomeini International', 'Tehran', 'Iran', 35.42, 51.15],
    MHD: ['Mashhad International', 'Mashhad', 'Iran', 36.23, 59.64],
    SYZ: ['Shiraz International', 'Shiraz', 'Iran', 29.54, 52.59],
    KHI: ['Jinnah International', 'Karachi', 'Pakistan', 24.91, 67.16],
    LHE: ['Allama Iqbal International', 'Lahore', 'Pakistan', 31.52, 74.4],
    ISB: ['Islamabad International', 'Islamabad', 'Pakistan', 33.55, 72.83],

    /* --- Türkiye and the Caucasus ------------------------------------- */
    IST: ['Istanbul Airport', 'Istanbul', 'Türkiye', 41.28, 28.75],
    SAW: ['Sabiha Gökçen', 'Istanbul', 'Türkiye', 40.9, 29.31],
    ESB: ['Esenboğa', 'Ankara', 'Türkiye', 40.13, 32.99],
    ADB: ['Adnan Menderes', 'İzmir', 'Türkiye', 38.29, 27.16],
    AYT: ['Antalya', 'Antalya', 'Türkiye', 36.9, 30.79],
    BJV: ['Milas–Bodrum', 'Bodrum', 'Türkiye', 37.25, 27.66],
    DLM: ['Dalaman', 'Dalaman', 'Türkiye', 36.71, 28.79],
    TZX: ['Trabzon', 'Trabzon', 'Türkiye', 40.99, 39.79],
    TBS: ['Tbilisi International', 'Tbilisi', 'Georgia', 41.67, 44.95],
    EVN: ['Zvartnots International', 'Yerevan', 'Armenia', 40.15, 44.4],
    GYD: ['Heydar Aliyev International', 'Baku', 'Azerbaijan', 40.47, 50.05],
    ALA: ['Almaty International', 'Almaty', 'Kazakhstan', 43.35, 77.04],
    TAS: ['Tashkent International', 'Tashkent', 'Uzbekistan', 41.26, 69.28],

    /* --- Europe -------------------------------------------------------- */
    LHR: ['Heathrow', 'London', 'United Kingdom', 51.47, -0.45],
    LGW: ['Gatwick', 'London', 'United Kingdom', 51.15, -0.19],
    LCY: ['London City', 'London', 'United Kingdom', 51.51, 0.05],
    MAN: ['Manchester', 'Manchester', 'United Kingdom', 53.35, -2.27],
    BHX: ['Birmingham', 'Birmingham', 'United Kingdom', 52.45, -1.75],
    EDI: ['Edinburgh', 'Edinburgh', 'United Kingdom', 55.95, -3.37],
    DUB: ['Dublin', 'Dublin', 'Ireland', 53.43, -6.25],
    CDG: ['Charles de Gaulle', 'Paris', 'France', 49.01, 2.55],
    ORY: ['Orly', 'Paris', 'France', 48.73, 2.36],
    NCE: ['Côte d’Azur', 'Nice', 'France', 43.66, 7.22],
    LYS: ['Saint-Exupéry', 'Lyon', 'France', 45.73, 5.08],
    FRA: ['Frankfurt am Main', 'Frankfurt', 'Germany', 50.04, 8.56],
    MUC: ['Munich', 'Munich', 'Germany', 48.35, 11.79],
    BER: ['Brandenburg', 'Berlin', 'Germany', 52.36, 13.5],
    DUS: ['Düsseldorf', 'Düsseldorf', 'Germany', 51.29, 6.77],
    HAM: ['Hamburg', 'Hamburg', 'Germany', 53.63, 9.99],
    AMS: ['Schiphol', 'Amsterdam', 'Netherlands', 52.31, 4.76],
    BRU: ['Brussels', 'Brussels', 'Belgium', 50.9, 4.48],
    ZRH: ['Zurich', 'Zurich', 'Switzerland', 47.46, 8.55],
    GVA: ['Geneva', 'Geneva', 'Switzerland', 46.24, 6.11],
    VIE: ['Vienna', 'Vienna', 'Austria', 48.11, 16.57],
    CPH: ['Copenhagen', 'Copenhagen', 'Denmark', 55.62, 12.66],
    ARN: ['Arlanda', 'Stockholm', 'Sweden', 59.65, 17.92],
    OSL: ['Gardermoen', 'Oslo', 'Norway', 60.19, 11.1],
    HEL: ['Helsinki-Vantaa', 'Helsinki', 'Finland', 60.32, 24.96],
    MAD: ['Barajas', 'Madrid', 'Spain', 40.47, -3.56],
    BCN: ['El Prat', 'Barcelona', 'Spain', 41.3, 2.08],
    AGP: ['Málaga', 'Málaga', 'Spain', 36.68, -4.5],
    PMI: ['Palma de Mallorca', 'Palma', 'Spain', 39.55, 2.74],
    LIS: ['Humberto Delgado', 'Lisbon', 'Portugal', 38.77, -9.13],
    OPO: ['Francisco Sá Carneiro', 'Porto', 'Portugal', 41.24, -8.68],
    FCO: ['Fiumicino', 'Rome', 'Italy', 41.8, 12.25],
    MXP: ['Malpensa', 'Milan', 'Italy', 45.63, 8.72],
    LIN: ['Linate', 'Milan', 'Italy', 45.45, 9.28],
    VCE: ['Marco Polo', 'Venice', 'Italy', 45.51, 12.35],
    NAP: ['Capodichino', 'Naples', 'Italy', 40.88, 14.29],
    ATH: ['Athens International', 'Athens', 'Greece', 37.94, 23.95],
    JMK: ['Mykonos', 'Mykonos', 'Greece', 37.44, 25.35],
    JTR: ['Santorini', 'Santorini', 'Greece', 36.4, 25.48],
    PRG: ['Václav Havel', 'Prague', 'Czechia', 50.1, 14.26],
    BUD: ['Ferenc Liszt', 'Budapest', 'Hungary', 47.44, 19.26],
    WAW: ['Chopin', 'Warsaw', 'Poland', 52.17, 20.97],
    KRK: ['John Paul II', 'Kraków', 'Poland', 50.08, 19.79],
    OTP: ['Henri Coandă', 'Bucharest', 'Romania', 44.57, 26.1],
    SOF: ['Sofia', 'Sofia', 'Bulgaria', 42.69, 23.41],
    BEG: ['Nikola Tesla', 'Belgrade', 'Serbia', 44.82, 20.31],
    ZAG: ['Franjo Tuđman', 'Zagreb', 'Croatia', 45.74, 16.07],
    SVO: ['Sheremetyevo', 'Moscow', 'Russia', 55.97, 37.41],
    LED: ['Pulkovo', 'St Petersburg', 'Russia', 59.8, 30.26],

    /* --- South and South-East Asia ------------------------------------ */
    DEL: ['Indira Gandhi International', 'Delhi', 'India', 28.56, 77.1],
    BOM: ['Chhatrapati Shivaji Maharaj', 'Mumbai', 'India', 19.09, 72.87],
    BLR: ['Kempegowda International', 'Bengaluru', 'India', 13.2, 77.71],
    MAA: ['Chennai International', 'Chennai', 'India', 12.99, 80.17],
    HYD: ['Rajiv Gandhi International', 'Hyderabad', 'India', 17.24, 78.43],
    CCU: ['Netaji Subhas Chandra Bose', 'Kolkata', 'India', 22.65, 88.45],
    COK: ['Cochin International', 'Kochi', 'India', 10.15, 76.4],
    TRV: ['Trivandrum International', 'Thiruvananthapuram', 'India', 8.48, 76.92],
    CMB: ['Bandaranaike International', 'Colombo', 'Sri Lanka', 7.18, 79.88],
    MLE: ['Velana International', 'Malé', 'Maldives', 4.19, 73.53],
    KTM: ['Tribhuvan International', 'Kathmandu', 'Nepal', 27.7, 85.36],
    DAC: ['Hazrat Shahjalal International', 'Dhaka', 'Bangladesh', 23.84, 90.4],
    BKK: ['Suvarnabhumi', 'Bangkok', 'Thailand', 13.69, 100.75],
    DMK: ['Don Mueang', 'Bangkok', 'Thailand', 13.91, 100.61],
    HKT: ['Phuket International', 'Phuket', 'Thailand', 8.11, 98.32],
    CNX: ['Chiang Mai International', 'Chiang Mai', 'Thailand', 18.77, 98.96],
    KUL: ['Kuala Lumpur International', 'Kuala Lumpur', 'Malaysia', 2.75, 101.71],
    SIN: ['Changi', 'Singapore', 'Singapore', 1.36, 103.99],
    CGK: ['Soekarno–Hatta', 'Jakarta', 'Indonesia', -6.13, 106.66],
    DPS: ['Ngurah Rai', 'Denpasar, Bali', 'Indonesia', -8.75, 115.17],
    MNL: ['Ninoy Aquino International', 'Manila', 'Philippines', 14.51, 121.02],
    HAN: ['Noi Bai International', 'Hanoi', 'Vietnam', 21.22, 105.81],
    SGN: ['Tan Son Nhat International', 'Ho Chi Minh City', 'Vietnam', 10.82, 106.66],

    /* --- East Asia ----------------------------------------------------- */
    HKG: ['Hong Kong International', 'Hong Kong', 'Hong Kong', 22.31, 113.91],
    TPE: ['Taoyuan International', 'Taipei', 'Taiwan', 25.08, 121.23],
    PEK: ['Beijing Capital', 'Beijing', 'China', 40.08, 116.58],
    PKX: ['Beijing Daxing', 'Beijing', 'China', 39.51, 116.41],
    PVG: ['Pudong', 'Shanghai', 'China', 31.14, 121.81],
    SHA: ['Hongqiao', 'Shanghai', 'China', 31.2, 121.34],
    CAN: ['Baiyun', 'Guangzhou', 'China', 23.39, 113.31],
    SZX: ["Bao'an", 'Shenzhen', 'China', 22.64, 113.81],
    CTU: ['Shuangliu', 'Chengdu', 'China', 30.58, 103.95],
    ICN: ['Incheon International', 'Seoul', 'South Korea', 37.46, 126.44],
    GMP: ['Gimpo International', 'Seoul', 'South Korea', 37.56, 126.79],
    PUS: ['Gimhae International', 'Busan', 'South Korea', 35.18, 128.94],
    CJU: ['Jeju International', 'Jeju', 'South Korea', 33.51, 126.49],
    NRT: ['Narita International', 'Tokyo', 'Japan', 35.77, 140.39],
    HND: ['Haneda', 'Tokyo', 'Japan', 35.55, 139.78],
    KIX: ['Kansai International', 'Osaka', 'Japan', 34.43, 135.24],
    ITM: ['Itami', 'Osaka', 'Japan', 34.79, 135.44],
    CTS: ['New Chitose', 'Sapporo', 'Japan', 42.78, 141.69],
    FUK: ['Fukuoka', 'Fukuoka', 'Japan', 33.59, 130.45],
    OKA: ['Naha', 'Okinawa', 'Japan', 26.2, 127.65],

    /* --- Africa -------------------------------------------------------- */
    CMN: ['Mohammed V', 'Casablanca', 'Morocco', 33.37, -7.59],
    RAK: ['Menara', 'Marrakesh', 'Morocco', 31.61, -8.04],
    TUN: ['Tunis–Carthage', 'Tunis', 'Tunisia', 36.85, 10.23],
    ALG: ['Houari Boumediene', 'Algiers', 'Algeria', 36.69, 3.22],
    NBO: ['Jomo Kenyatta International', 'Nairobi', 'Kenya', -1.32, 36.93],
    ADD: ['Bole International', 'Addis Ababa', 'Ethiopia', 8.98, 38.8],
    DAR: ['Julius Nyerere International', 'Dar es Salaam', 'Tanzania', -6.88, 39.2],
    ZNZ: ['Abeid Amani Karume', 'Zanzibar', 'Tanzania', -6.22, 39.22],
    JNB: ['O. R. Tambo', 'Johannesburg', 'South Africa', -26.13, 28.24],
    CPT: ['Cape Town International', 'Cape Town', 'South Africa', -33.97, 18.6],
    LOS: ['Murtala Muhammed', 'Lagos', 'Nigeria', 6.58, 3.32],
    ACC: ['Kotoka International', 'Accra', 'Ghana', 5.61, -0.17],
    SEZ: ['Seychelles International', 'Mahé', 'Seychelles', -4.67, 55.52],
    MRU: ['Sir Seewoosagur Ramgoolam', 'Port Louis', 'Mauritius', -20.43, 57.68],

    /* --- the Americas -------------------------------------------------- */
    JFK: ['John F. Kennedy International', 'New York', 'United States', 40.64, -73.78],
    EWR: ['Newark Liberty International', 'Newark', 'United States', 40.69, -74.17],
    LGA: ['LaGuardia', 'New York', 'United States', 40.78, -73.87],
    BOS: ['Logan International', 'Boston', 'United States', 42.36, -71.01],
    IAD: ['Dulles International', 'Washington', 'United States', 38.95, -77.46],
    DCA: ['Reagan National', 'Washington', 'United States', 38.85, -77.04],
    PHL: ['Philadelphia International', 'Philadelphia', 'United States', 39.87, -75.24],
    ATL: ['Hartsfield–Jackson', 'Atlanta', 'United States', 33.64, -84.43],
    MIA: ['Miami International', 'Miami', 'United States', 25.79, -80.29],
    MCO: ['Orlando International', 'Orlando', 'United States', 28.43, -81.31],
    ORD: ["O'Hare International", 'Chicago', 'United States', 41.98, -87.9],
    DFW: ['Dallas/Fort Worth International', 'Dallas', 'United States', 32.9, -97.04],
    IAH: ['George Bush Intercontinental', 'Houston', 'United States', 29.99, -95.34],
    DEN: ['Denver International', 'Denver', 'United States', 39.86, -104.67],
    LAX: ['Los Angeles International', 'Los Angeles', 'United States', 33.94, -118.41],
    SFO: ['San Francisco International', 'San Francisco', 'United States', 37.62, -122.38],
    SEA: ['Seattle–Tacoma International', 'Seattle', 'United States', 47.45, -122.31],
    LAS: ['Harry Reid International', 'Las Vegas', 'United States', 36.08, -115.15],
    PHX: ['Sky Harbor International', 'Phoenix', 'United States', 33.43, -112.01],
    SAN: ['San Diego International', 'San Diego', 'United States', 32.73, -117.19],
    YYZ: ['Toronto Pearson', 'Toronto', 'Canada', 43.68, -79.63],
    YVR: ['Vancouver International', 'Vancouver', 'Canada', 49.19, -123.18],
    YUL: ['Montréal–Trudeau', 'Montréal', 'Canada', 45.47, -73.74],
    MEX: ['Benito Juárez International', 'Mexico City', 'Mexico', 19.44, -99.07],
    CUN: ['Cancún International', 'Cancún', 'Mexico', 21.04, -86.87],
    PTY: ['Tocumen International', 'Panama City', 'Panama', 9.07, -79.38],
    BOG: ['El Dorado International', 'Bogotá', 'Colombia', 4.7, -74.15],
    LIM: ['Jorge Chávez International', 'Lima', 'Peru', -12.02, -77.11],
    SCL: ['Arturo Merino Benítez', 'Santiago', 'Chile', -33.39, -70.79],
    EZE: ['Ministro Pistarini', 'Buenos Aires', 'Argentina', -34.82, -58.54],
    GRU: ['Guarulhos International', 'São Paulo', 'Brazil', -23.43, -46.47],
    GIG: ['Galeão International', 'Rio de Janeiro', 'Brazil', -22.81, -43.25],

    /* --- Oceania ------------------------------------------------------- */
    SYD: ['Kingsford Smith', 'Sydney', 'Australia', -33.94, 151.18],
    MEL: ['Tullamarine', 'Melbourne', 'Australia', -37.67, 144.84],
    BNE: ['Brisbane', 'Brisbane', 'Australia', -27.38, 153.12],
    PER: ['Perth', 'Perth', 'Australia', -31.94, 115.97],
    AKL: ['Auckland', 'Auckland', 'New Zealand', -37.01, 174.79]
  };

  var CARRIERS = {
    KU: 'Kuwait Airways',
    J9: 'Jazeera Airways',
    EK: 'Emirates',
    FZ: 'flydubai',
    QR: 'Qatar Airways',
    EY: 'Etihad Airways',
    G9: 'Air Arabia',
    GF: 'Gulf Air',
    WY: 'Oman Air',
    OV: 'SalamAir',
    SV: 'Saudia',
    XY: 'flynas',
    F3: 'flyadeal',
    IA: 'Iraqi Airways',
    IY: 'Yemenia',
    RJ: 'Royal Jordanian',
    ME: 'Middle East Airlines',
    MS: 'EgyptAir',
    NP: 'Nile Air',
    W5: 'Mahan Air',
    IR: 'Iran Air',
    PK: 'Pakistan International',
    '9P': 'Fly Jinnah',
    TK: 'Turkish Airlines',
    PC: 'Pegasus Airlines',
    VF: 'AJet',
    A9: 'Georgian Airways',
    J2: 'Azerbaijan Airlines',
    KC: 'Air Astana',
    HY: 'Uzbekistan Airways',
    BA: 'British Airways',
    VS: 'Virgin Atlantic',
    EI: 'Aer Lingus',
    LH: 'Lufthansa',
    AF: 'Air France',
    KL: 'KLM',
    LX: 'Swiss',
    OS: 'Austrian Airlines',
    SN: 'Brussels Airlines',
    SK: 'SAS',
    AY: 'Finnair',
    DY: 'Norwegian',
    IB: 'Iberia',
    UX: 'Air Europa',
    VY: 'Vueling',
    TP: 'TAP Air Portugal',
    AZ: 'ITA Airways',
    A3: 'Aegean Airlines',
    OA: 'Olympic Air',
    LO: 'LOT Polish Airlines',
    W6: 'Wizz Air',
    FR: 'Ryanair',
    U2: 'easyJet',
    RO: 'TAROM',
    JU: 'Air Serbia',
    OU: 'Croatia Airlines',
    SU: 'Aeroflot',
    AI: 'Air India',
    '6E': 'IndiGo',
    IX: 'Air India Express',
    UL: 'SriLankan Airlines',
    Q2: 'Maldivian',
    RA: 'Nepal Airlines',
    BG: 'Biman Bangladesh',
    TG: 'Thai Airways',
    FD: 'Thai AirAsia',
    MH: 'Malaysia Airlines',
    AK: 'AirAsia',
    SQ: 'Singapore Airlines',
    TR: 'Scoot',
    GA: 'Garuda Indonesia',
    QZ: 'Indonesia AirAsia',
    PR: 'Philippine Airlines',
    '5J': 'Cebu Pacific',
    VN: 'Vietnam Airlines',
    VJ: 'VietJet Air',
    CX: 'Cathay Pacific',
    HX: 'Hong Kong Airlines',
    CI: 'China Airlines',
    BR: 'EVA Air',
    CA: 'Air China',
    MU: 'China Eastern',
    CZ: 'China Southern',
    HU: 'Hainan Airlines',
    '3U': 'Sichuan Airlines',
    KE: 'Korean Air',
    OZ: 'Asiana Airlines',
    '7C': 'Jeju Air',
    LJ: 'Jin Air',
    NH: 'ANA',
    JL: 'Japan Airlines',
    MM: 'Peach',
    ET: 'Ethiopian Airlines',
    KQ: 'Kenya Airways',
    AT: 'Royal Air Maroc',
    TU: 'Tunisair',
    AH: 'Air Algérie',
    SA: 'South African Airways',
    MK: 'Air Mauritius',
    HM: 'Air Seychelles',
    UA: 'United Airlines',
    DL: 'Delta Air Lines',
    AA: 'American Airlines',
    B6: 'JetBlue',
    WN: 'Southwest Airlines',
    AS: 'Alaska Airlines',
    AC: 'Air Canada',
    WS: 'WestJet',
    AM: 'Aeroméxico',
    CM: 'Copa Airlines',
    AV: 'Avianca',
    LA: 'LATAM',
    G3: 'GOL',
    AD: 'Azul',
    AR: 'Aerolíneas Argentinas',
    QF: 'Qantas',
    VA: 'Virgin Australia',
    JQ: 'Jetstar',
    NZ: 'Air New Zealand'
  };

  function airport(iata) {
    if (!iata) return null;
    var row = AIRPORTS[String(iata).toUpperCase()];
    if (!row) return null;
    return { name: row[0], city: row[1], country: row[2], lat: row[3], lon: row[4] };
  }

  // "ku681", "KU 681", "6E 1409" -> the airline, if the prefix is known.
  function carrierFor(flightNo) {
    var cleaned = String(flightNo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var match = /^([A-Z]{2}|[A-Z]\d|\d[A-Z])/.exec(cleaned);
    if (!match) return null;
    return CARRIERS[match[1]] || null;
  }

  function codes() {
    return Object.keys(AIRPORTS);
  }

  function label(iata) {
    var found = airport(iata);
    if (!found) return String(iata || '').toUpperCase();
    return found.city + ' · ' + found.name;
  }

  FL.geo = {
    airport: airport,
    carrierFor: carrierFor,
    codes: codes,
    label: label,
    airlineNames: (function () {
      var seen = {};
      var out = [];
      Object.keys(CARRIERS).forEach(function (key) {
        var value = CARRIERS[key];
        if (!seen[value]) { seen[value] = true; out.push(value); }
      });
      return out.sort();
    })()
  };
})();
