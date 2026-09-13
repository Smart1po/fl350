/* FL350 · every word the interface says, in English and in Arabic.
 *
 * One flat object, keyed by a short dotted id. Each entry is { en: …, ar: … }.
 * A value is normally a string. Where a count changes the wording it is an
 * object of CLDR plural categories instead — English needs two of them, Arabic
 * needs six, and i18n.js picks the right one.
 *
 * Three conventions hold everywhere in here:
 *
 *   · Latin script stays Latin. IATA codes, flight numbers, seat numbers,
 *     aircraft types and the names of Vercel's own settings screens are not
 *     translated, because that is what is printed on the boarding pass and on
 *     the screen the reader is looking at.
 *   · The Arabic is written the way a Kuwaiti product writes, not the way a
 *     dictionary translates. Where a literal rendering would sound like a
 *     manual, the sentence was rewritten.
 *   · A handful of values carry markup, because the English sentence has a
 *     word set in the mono face or in bold inside it. Those are marked below
 *     and must be applied with data-i18n-html, never data-i18n.
 */
(function () {
  'use strict';

  var FL = (window.FL350 = window.FL350 || {});

  FL.strings = {

    /* ------------------------------------------------------------ months */
    /* short in English because the column is narrow; Arabic uses the month
       names people actually say in the Gulf. */
    'month.1':  { en: 'Jan', ar: 'يناير' },
    'month.2':  { en: 'Feb', ar: 'فبراير' },
    'month.3':  { en: 'Mar', ar: 'مارس' },
    'month.4':  { en: 'Apr', ar: 'أبريل' },
    'month.5':  { en: 'May', ar: 'مايو' },
    'month.6':  { en: 'Jun', ar: 'يونيو' },
    'month.7':  { en: 'Jul', ar: 'يوليو' },
    'month.8':  { en: 'Aug', ar: 'أغسطس' },
    'month.9':  { en: 'Sep', ar: 'سبتمبر' },
    'month.10': { en: 'Oct', ar: 'أكتوبر' },
    'month.11': { en: 'Nov', ar: 'نوفمبر' },
    'month.12': { en: 'Dec', ar: 'ديسمبر' },

    /* -------------------------------------------------------------- shell */

    'app.skip':      { en: 'Skip to the content', ar: 'تخطَّ إلى المحتوى' },
    'app.brand.sub': { en: 'logbook', ar: 'سجل الرحلات' },

    'theme.label':   { en: 'Theme', ar: 'السمة' },
    'theme.switch':  { en: 'Switch theme', ar: 'تبديل السمة' },
    'theme.toLight': { en: 'Switch to the light theme', ar: 'التبديل إلى السمة الفاتحة' },
    'theme.toDark':  { en: 'Switch to the dark theme', ar: 'التبديل إلى السمة الداكنة' },

    /* the two language names are always written in their own language, so the
       reader can find the one they want without reading the other one first */
    'lang.name.en':     { en: 'English', ar: 'English' },
    'lang.name.ar':     { en: 'العربية', ar: 'العربية' },
    'lang.switch.aria': { en: 'العربية / Arabic', ar: 'العربية' },
    'lang.switch.toAr': { en: 'Switch the interface to Arabic', ar: 'التبديل إلى العربية' },
    'lang.switch.toEn': { en: 'Switch the interface to English', ar: 'التبديل إلى الإنجليزية' },

    'nav.signin': { en: 'Sign in', ar: 'تسجيل الدخول' },
    'nav.create': { en: 'Create a locker', ar: 'أنشئ خزانة' },

    /* ------------------------------------------------------ page metadata */

    'meta.home.title': {
      en: 'FL350 — a private logbook for every flight you have taken',
      ar: 'FL350 — سجل خاص لكل رحلة سافرتها'
    },
    'meta.home.description': {
      en: 'FL350 keeps a boarding pass for every flight you have taken. One account, one locker, and nobody else can open yours.',
      ar: 'يحتفظ FL350 ببطاقة صعود لكل رحلة سافرتها. حساب واحد، خزانة واحدة، ولا أحد غيرك يفتح خزانتك.'
    },
    'meta.login.title': {
      en: 'Sign in — FL350',
      ar: 'تسجيل الدخول — FL350'
    },
    'meta.login.description': {
      en: 'Sign in to your FL350 logbook, or create a locker of your own.',
      ar: 'سجّل الدخول إلى سجل رحلاتك في FL350، أو أنشئ خزانة خاصة بك.'
    },
    'meta.logbook.title': {
      en: 'Your logbook — FL350',
      ar: 'سجل رحلاتك — FL350'
    },
    'meta.404.title': {
      en: 'Nothing at this gate — FL350',
      ar: 'لا شيء عند هذه البوابة — FL350'
    },
    'meta.share.title': {
      en: 'A shared flight — FL350',
      ar: 'رحلة مشتركة — FL350'
    },
    'meta.share.description': {
      en: 'One boarding pass, shared from a private FL350 logbook.',
      ar: 'بطاقة صعود واحدة، مشتركة من سجل رحلات خاص في FL350.'
    },
    /* the page title once the row has arrived; the codes stay Latin */
    'meta.share.flight': {
      en: '{flightNo}, {from} to {to} — FL350',
      ar: '{flightNo}، من {from} إلى {to} — FL350'
    },

    /* --------------------------------------------------------- front page */

    'home.eyebrow': {
      en: 'Flight log · private by default',
      ar: 'سجل رحلات · خاص افتراضيًا'
    },
    'home.h1': {
      en: 'Every flight you have taken, kept in one place.',
      ar: 'كل رحلة سافرتها، محفوظة في مكان واحد.'
    },
    'home.lede': {
      en: 'FL350 keeps a boarding pass for each flight in your history — the route, the aircraft, the seat, and a line only you can read. One account, one locker. The person sitting next to you cannot open yours.',
      ar: 'يحتفظ FL350 ببطاقة صعود لكل رحلة في تاريخك — المسار، الطائرة، المقعد، وسطر لا يقرأه غيرك. حساب واحد، خزانة واحدة. ومن يجلس بجوارك لا يستطيع فتح خزانتك.'
    },
    'home.cta.create': { en: 'Create your locker', ar: 'أنشئ خزانتك' },
    'home.cta.have':   { en: 'I already have one', ar: 'لديّ خزانة بالفعل' },

    'home.strip.free':     { en: 'Free', ar: 'مجاني' },
    'home.strip.tracking': { en: 'No tracking', ar: 'بلا تتبّع' },
    'home.strip.yours':    { en: 'Your rows are yours', ar: 'بياناتك ملكك' },

    'home.example.title': { en: 'What a flight looks like', ar: 'كيف تبدو الرحلة' },

    'home.demo.airline':  { en: 'Kuwait Airways', ar: 'الخطوط الجوية الكويتية' },
    'home.demo.date':     { en: '14 Jul 2026', ar: '14 يوليو 2026' },
    'home.demo.from':     { en: 'Kuwait City', ar: 'مدينة الكويت' },
    'home.demo.to':       { en: 'Seoul', ar: 'سول' },
    'home.demo.distance': { en: '7,136 km', ar: '7,136 كم' },
    'home.demo.route':    { en: 'Kuwait City to Seoul', ar: 'من مدينة الكويت إلى سول' },
    'home.demo.note': {
      en: 'The private line on a flight. Only the account that wrote it can read it back.',
      ar: 'السطر الخاص في الرحلة. لا يقرؤه إلا الحساب الذي كتبه.'
    },
    'home.caption.distance': {
      en: 'Distances are great-circle estimates from the airport coordinates.',
      ar: 'المسافات تقديرية بطريقة الدائرة العظمى، محسوبة من إحداثيات المطارين.'
    },

    'home.how.title': { en: 'How it works', ar: 'كيف يعمل' },
    'home.how.1.h':   { en: 'Make an account', ar: 'أنشئ حسابًا' },
    'home.how.1.p': {
      en: 'An email and a password. That account is the key to exactly one locker — yours.',
      ar: 'بريد إلكتروني وكلمة مرور. هذا الحساب مفتاح خزانة واحدة لا غير: خزانتك.'
    },
    'home.how.2.h': { en: 'Add your flights', ar: 'أضف رحلاتك' },
    /* markup: data-i18n-html */
    'home.how.2.p': {
      en: 'Flight number, route, date, aircraft, seat. Type <span class="mono i18n-ltr">KU 681</span> and the airline fills itself in.',
      ar: 'رقم الرحلة، المسار، التاريخ، الطائرة، المقعد. اكتب <span class="mono i18n-ltr">KU 681</span> فيملأ اسم شركة الطيران نفسه.'
    },
    'home.how.3.h': { en: 'It stays yours', ar: 'تبقى ملكك' },
    'home.how.3.p': {
      en: 'Search it, edit it, delete it. Sign out and back in on any device and it is all still there.',
      ar: 'ابحث فيها، عدّلها، احذفها. سجّل الخروج ثم ادخل من أي جهاز وستجدها كما تركتها.'
    },

    'home.lock.title': { en: 'About the lock', ar: 'عن القفل' },
    'home.lock.p1': {
      en: 'Privacy here is not a filter in the page — a filter can be taken off. Every row in the database carries the id of the account that wrote it, and the database itself refuses to return a row to anyone else. A visitor who is not signed in is refused before the question is even asked.',
      ar: 'الخصوصية هنا ليست فلترًا في الصفحة — الفلتر يمكن رفعه. كل صف في قاعدة البيانات يحمل معرّف الحساب الذي كتبه، وقاعدة البيانات نفسها ترفض إعطاء الصف لأي أحد آخر. والزائر غير المسجَّل يُرفض قبل أن يُطرح السؤال أصلًا.'
    },
    'home.lock.p2': {
      en: 'Two honest limits. The publishable key that lets your browser talk to the database ships with the page, as it does on every site of this kind — what protects the rows is the policy, not the key. And whoever runs a website can always read its database, so keep anything you would not hand to the person running it out of any website, including this one.',
      ar: 'حدّان نقولهما بصراحة. المفتاح العام الذي يسمح لمتصفحك بمخاطبة قاعدة البيانات يصل مع الصفحة، كما هو الحال في كل موقع من هذا النوع — ما يحمي الصفوف هو السياسة لا سرية المفتاح. ومن يدير أي موقع يستطيع قراءة قاعدة بياناته، فلا تضع في أي موقع — بما فيه هذا — ما لا تسلّمه بيدك لمن يديره.'
    },

    /* markup: data-i18n-html */
    'footer.built': {
      en: '<strong>FL350</strong> — built for AIFC Day 5, the Cornerstone.',
      ar: '<strong>FL350</strong> — بُني ليوم AIFC الخامس، حجر الأساس.'
    },

    /* -------------------------------------------------------------- login */

    'auth.tabs.aria':   { en: 'Sign in or create an account', ar: 'تسجيل الدخول أو إنشاء حساب' },
    'auth.tab.signin':  { en: 'Sign in', ar: 'تسجيل الدخول' },
    'auth.tab.signup':  { en: 'Create a locker', ar: 'أنشئ خزانة' },

    'auth.title.signin': { en: 'Welcome back', ar: 'أهلًا بعودتك' },
    'auth.title.signup': { en: 'Create your locker', ar: 'أنشئ خزانتك' },
    'auth.lede.signin':  { en: 'Sign in to open your logbook.', ar: 'سجّل الدخول لفتح سجل رحلاتك.' },
    'auth.lede.signup': {
      en: 'One account, one locker. Nobody else can open it — not even the person sitting next to you.',
      ar: 'حساب واحد، خزانة واحدة. لا أحد غيرك يفتحها — ولا حتى من يجلس بجوارك.'
    },

    'auth.field.name':    { en: 'What should we call you?', ar: 'بماذا نناديك؟' },
    'auth.field.name.ph': { en: 'Your first name', ar: 'اسمك الأول' },
    'auth.field.email':   { en: 'Email', ar: 'البريد الإلكتروني' },
    'auth.field.email.ph': { en: 'you@example.com', ar: 'you@example.com' },
    'auth.field.password': { en: 'Password', ar: 'كلمة المرور' },

    'auth.submit.signin': { en: 'Sign in', ar: 'تسجيل الدخول' },
    'auth.submit.signup': { en: 'Create my locker', ar: 'أنشئ خزانتي' },

    'auth.hint.password': {
      en: 'At least 8 characters. Never reuse a password you use anywhere else — not here, not on any site you built an hour ago.',
      ar: 'ثمانية أحرف على الأقل. لا تُعِد استخدام كلمة مرور تستخدمها في مكان آخر — لا هنا، ولا في أي موقع بُني قبل ساعة.'
    },

    'auth.switch.have':   { en: 'Already have a locker?', ar: 'لديك خزانة بالفعل؟' },
    'auth.switch.first':  { en: 'First time here?', ar: 'أول مرة هنا؟' },
    'auth.switch.signin': { en: 'Sign in', ar: 'تسجيل الدخول' },
    'auth.switch.create': { en: 'Create a locker', ar: 'أنشئ خزانة' },

    /* markup: data-i18n-html */
    'auth.note.one': {
      en: '<strong>One locker per account.</strong> Your flights are stored with the id of the account that wrote them, and the database refuses to hand a row to anybody else — including whoever is sitting next to you.',
      ar: '<strong>خزانة واحدة لكل حساب.</strong> رحلاتك محفوظة بمعرّف الحساب الذي كتبها، وقاعدة البيانات ترفض تسليم أي صف لغيره — بمن في ذلك من يجلس بجوارك.'
    },
    'auth.honesty': {
      en: 'Never reuse a password you use anywhere else. Not here, not on any site that was built an hour ago. Whoever runs a website can read its database, so keep phone numbers, addresses and civil IDs out of this one.',
      ar: 'لا تُعِد استخدام كلمة مرور تستخدمها في أي مكان آخر. لا هنا، ولا في أي موقع بُني قبل ساعة. ومن يدير الموقع يستطيع قراءة قاعدة بياناته، فاترك أرقام الهواتف والعناوين والرقم المدني خارج هذا الموقع.'
    },

    'auth.err.email.empty':    { en: 'Your email address goes here.', ar: 'ضع بريدك الإلكتروني هنا.' },
    'auth.err.email.bad':      { en: 'That does not look like an email address.', ar: 'هذا لا يبدو بريدًا إلكترونيًا.' },
    'auth.err.password.empty': { en: 'A password goes here.', ar: 'ضع كلمة المرور هنا.' },
    'auth.err.password.short': { en: 'Use at least 8 characters.', ar: 'استخدم 8 أحرف على الأقل.' },
    'auth.err.name.empty':     { en: 'What should the locker call you?', ar: 'بماذا تحب أن تناديك الخزانة؟' },
    'auth.err.name.long':      { en: 'A bit shorter, please.', ar: 'اختصرها قليلًا من فضلك.' },
    'auth.err.generic':        { en: 'That did not work.', ar: 'لم ينجح ذلك.' },

    'auth.msg.created': {
      en: 'Account created. This project has email confirmation switched on, so open the link in the email we just sent, then sign in.',
      ar: 'أُنشئ الحساب. تأكيد البريد مفعَّل في هذا المشروع، فافتح الرابط في الرسالة التي وصلتك للتو ثم سجّل الدخول.'
    },
    'auth.msg.signedout': {
      en: 'Signed out. Your flights are still in the locker.',
      ar: 'تم تسجيل الخروج. رحلاتك ما زالت في الخزانة.'
    },
    'auth.msg.membersonly': {
      en: 'That page is members only. Sign in to open your logbook.',
      ar: 'هذه الصفحة للأعضاء. سجّل الدخول لفتح سجل رحلاتك.'
    },

    /* ------------------------------------------------------------ the locker */

    'book.signout':          { en: 'Sign out', ar: 'تسجيل الخروج' },
    'book.who':              { en: 'Signed in as {email}', ar: 'مسجَّل الدخول بـ {email}' },
    'book.greeting.loading': { en: 'Opening your locker…', ar: 'نفتح خزانتك…' },
    'book.greeting':         { en: 'Welcome back, {name}.', ar: 'أهلًا بعودتك، {name}.' },
    'book.greeting.plain':   { en: 'Welcome back.', ar: 'أهلًا بعودتك.' },
    'book.sub': {
      en: 'This is your locker. Nobody else can open it.',
      ar: 'هذه خزانتك. لا أحد غيرك يفتحها.'
    },
    'book.add': { en: 'Add a flight', ar: 'أضف رحلة' },

    'book.search.label': { en: 'Search your flights', ar: 'ابحث في رحلاتك' },
    'book.search.ph': {
      en: 'Airline, code, city, aircraft, your note…',
      ar: 'شركة الطيران، الرمز، المدينة، الطائرة، ملاحظتك…'
    },
    'book.year.label':   { en: 'Year', ar: 'السنة' },
    'book.year.all':     { en: 'Every year', ar: 'كل السنوات' },
    'book.sort.label':   { en: 'Order', ar: 'الترتيب' },
    'book.sort.newest':  { en: 'Newest first', ar: 'الأحدث أولًا' },
    'book.sort.oldest':  { en: 'Oldest first', ar: 'الأقدم أولًا' },
    'book.sort.longest': { en: 'Longest first', ar: 'الأطول أولًا' },
    'book.export':       { en: 'Export', ar: 'تصدير' },

    /* ------------------------------------------------------------- statistics */

    'stat.flights':     { en: 'Flights', ar: 'الرحلات' },
    'stat.flights.sub': { en: '{n} in {year}', ar: '{n} في {year}' },

    'stat.distance': { en: 'Distance', ar: 'المسافة' },
    'unit.km':       { en: 'km', ar: 'كم' },
    'stat.distance.laps':     { en: '≈ {laps}× around the Earth', ar: '≈ {laps} مرة حول الأرض' },
    'stat.distance.approx':   { en: 'approximate, great circle', ar: 'تقديرية، دائرة عظمى' },
    /* the counted noun is the legs, so this one agrees with {n} — which is why
       the English says "{n} legs of {total}" and not "{n} of {total} legs":
       the second form puts the noun after {total} and then agrees it with the
       wrong number, and "0 of 1 legs measured" is reachable with one flight
       whose airports are not in the list. */
    'stat.distance.measured': {
      en: { one: '{n} leg of {total} measured', other: '{n} legs of {total} measured' },
      ar: {
        zero: 'لم تُحسب أي مسافة من {total}',
        one: 'حُسبت مسافة واحدة من {total}',
        two: 'حُسبت مسافتان من {total}',
        few: 'حُسبت {n} مسافات من {total}',
        many: 'حُسبت {n} مسافة من {total}',
        other: 'حُسبت {n} مسافة من {total}'
      }
    },

    'stat.airlines':     { en: 'Airlines', ar: 'شركات الطيران' },
    'stat.airlines.sub': { en: 'most often {name}', ar: 'الأكثر: {name}' },

    'stat.airports':         { en: 'Airports', ar: 'المطارات' },
    'stat.airports.route':   { en: '{route} × {n}', ar: '{route} × {n}' },
    'stat.airports.longest': { en: 'longest {route}, {km} km', ar: 'الأطول {route}، {km} كم' },

    'book.count': {
      en: { one: '{n} flight', other: '{n} flights' },
      ar: {
        zero: 'لا رحلات',
        one: 'رحلة واحدة',
        two: 'رحلتان',
        few: '{n} رحلات',
        many: '{n} رحلة',
        other: '{n} رحلة'
      }
    },
    'book.count.filtered': {
      en: { one: '{n} of {total} flight', other: '{n} of {total} flights' },
      ar: {
        zero: 'لا نتائج من {total}',
        one: '{n} من رحلة واحدة',
        two: '{n} من رحلتين',
        few: '{n} من {total} رحلات',
        many: '{n} من {total} رحلة',
        other: '{n} من {total} رحلة'
      }
    },
    'book.count.nomatches': { en: 'No matches', ar: 'لا نتائج' },

    /* -------------------------------------------------------------- states */

    'state.empty.title': {
      en: 'Nothing here yet. Add your first flight.',
      ar: 'لا شيء هنا بعد. أضف أول رحلة.'
    },
    'state.empty.body': {
      en: 'One boarding pass per flight you have taken. Only you will ever see them.',
      ar: 'بطاقة صعود واحدة لكل رحلة سافرتها. لن يراها أحد غيرك.'
    },
    'state.nomatch.title': { en: 'No flights match that.', ar: 'لا رحلة تطابق ذلك.' },
    'state.nomatch.body': {
      en: 'Nothing in the locker matches what you typed. The flights are all still there.',
      ar: 'لا شيء في الخزانة يطابق ما كتبته. الرحلات كلها ما زالت هناك.'
    },
    'state.nomatch.clear': { en: 'Clear the filters', ar: 'امسح عوامل التصفية' },

    'state.config.title': {
      en: 'The site cannot reach its settings.',
      ar: 'الموقع لا يصل إلى إعداداته.'
    },
    'state.config.body': {
      en: 'This is the classic one: it works on a laptop and breaks on the live site because the database keys are not in the Vercel project.',
      ar: 'هذه الحالة الكلاسيكية: يعمل على الجهاز ويتعطل على الموقع المنشور لأن مفاتيح قاعدة البيانات ليست في مشروع Vercel.'
    },
    /* the block below names screens and variables in Vercel's own English
       interface, so it reads the same in both languages on purpose */
    'state.config.pre': {
      en: 'Vercel · Project · Settings · Environment Variables\n  SUPABASE_URL\n  SUPABASE_PUBLISHABLE_KEY\nthen Redeploy — variables only reach the next build.',
      ar: 'Vercel · Project · Settings · Environment Variables\n  SUPABASE_URL\n  SUPABASE_PUBLISHABLE_KEY\nthen Redeploy — variables only reach the next build.'
    },
    'state.load.title': { en: 'Could not open the locker.', ar: 'تعذّر فتح الخزانة.' },
    'state.load.body': {
      en: 'Something went wrong on the way to the database.',
      ar: 'حدث خطأ في الطريق إلى قاعدة البيانات.'
    },
    'state.retry': { en: 'Try again', ar: 'حاول مرة أخرى' },

    /* -------------------------------------------------- the boarding pass */

    'pass.fact.aircraft': { en: 'Aircraft', ar: 'الطائرة' },
    'pass.fact.distance': { en: 'Distance', ar: 'المسافة' },
    'pass.fact.route':    { en: 'Route', ar: 'المسار' },
    'pass.route.value':   { en: '{from} to {to}', ar: 'من {from} إلى {to}' },
    'pass.seat':          { en: 'Seat', ar: 'المقعد' },
    'pass.seat.none':     { en: '—', ar: '—' },
    'pass.unlisted':      { en: 'Unlisted airport', ar: 'مطار غير مدرج' },
    'pass.edit':          { en: 'Edit', ar: 'تعديل' },
    'pass.delete':        { en: 'Delete', ar: 'حذف' },

    /* the four buttons on the stub, and the flag on a shared pass. the titles
       and the hidden labels differ on purpose: the label names the control,
       the title says what it will do. */
    'pass.window':        { en: 'Window seat', ar: 'مقعد النافذة' },
    'pass.window.title':  { en: 'Look out of the window', ar: 'انظر من النافذة' },
    'pass.share':         { en: 'Share', ar: 'مشاركة' },
    'pass.share.title':   { en: 'Share this flight', ar: 'شارك هذه الرحلة' },
    'pass.share.on':      { en: 'Shared — open to anyone with the link', ar: 'مشتركة — مفتوحة لكل من يملك الرابط' },
    'pass.flag.shared':   { en: 'Shared', ar: 'مشتركة' },

    /* the photograph. the bucket is private, so a pass shows a placeholder
       until the signed link comes back — and a caption if it never does. */
    'photo.alt':          { en: 'A photograph attached to this flight.', ar: 'صورة مرفقة بهذه الرحلة.' },
    'photo.failed':       { en: 'That photograph could not be opened.', ar: 'تعذّر فتح تلك الصورة.' },

    /* --------------------------------------------------- the flight sheet */

    'sheet.add.title':  { en: 'Add a flight', ar: 'أضف رحلة' },
    'sheet.edit.title': { en: 'Edit {flightNo}', ar: 'تعديل {flightNo}' },
    'sheet.close':      { en: 'Close', ar: 'إغلاق' },
    'sheet.cancel':     { en: 'Cancel', ar: 'إلغاء' },
    'sheet.save.add':   { en: 'Add to my locker', ar: 'أضفها إلى خزانتي' },
    'sheet.save.edit':  { en: 'Save changes', ar: 'احفظ التغييرات' },

    'form.flightno':      { en: 'Flight number', ar: 'رقم الرحلة' },
    'form.flightno.hint': { en: 'The airline fills itself in from this.', ar: 'يملأ اسم شركة الطيران نفسه من هذا.' },
    'form.flightno.ph':   { en: 'KU 681', ar: 'KU 681' },
    'form.airline':       { en: 'Airline', ar: 'شركة الطيران' },
    'form.airline.ph':    { en: 'Kuwait Airways', ar: 'Kuwait Airways' },
    'form.from':          { en: 'From', ar: 'من' },
    'form.from.ph':       { en: 'KWI', ar: 'KWI' },
    'form.to':            { en: 'To', ar: 'إلى' },
    'form.to.ph':         { en: 'ICN', ar: 'ICN' },
    'form.date':          { en: 'Date flown', ar: 'تاريخ الرحلة' },
    'form.optional':      { en: '— optional', ar: '— اختياري' },
    /* markup: data-i18n-html — the label carries the optional marker inside it */
    'form.aircraft.label': {
      en: 'Aircraft <span class="field-optional">— optional</span>',
      ar: 'الطائرة <span class="field-optional">— اختياري</span>'
    },
    'form.aircraft.ph': { en: 'A330-800neo', ar: 'A330-800neo' },
    /* markup: data-i18n-html */
    'form.seat.label': {
      en: 'Seat <span class="field-optional">— optional</span>',
      ar: 'المقعد <span class="field-optional">— اختياري</span>'
    },
    'form.seat.ph': { en: '32A', ar: '32A' },
    /* markup: data-i18n-html */
    'form.note.label': {
      en: 'Your private note <span class="field-optional">— optional</span>',
      ar: 'ملاحظتك الخاصة <span class="field-optional">— اختياري</span>'
    },
    'form.note.ph':   { en: 'Anything you want to remember about this flight.', ar: 'أي شيء تحب أن تتذكره عن هذه الرحلة.' },
    'form.note.hint': { en: 'Only this account can read this back.', ar: 'لا يقرأ هذا إلا هذا الحساب.' },

    /* markup: data-i18n-html */
    'form.photo.label': {
      en: 'A photograph <span class="field-optional">— optional</span>',
      ar: 'صورة <span class="field-optional">— اختياري</span>'
    },
    /* the file types are what the picker itself shows, so they stay Latin */
    'form.photo.hint': {
      en: 'JPEG, PNG, WebP or AVIF, up to 5 MB. It goes into a private bucket that only your own account can open — never a public address.',
      ar: 'JPEG أو PNG أو WebP أو AVIF، حتى 5 ميغابايت. تذهب إلى مساحة خاصة لا يفتحها إلا حسابك — لا إلى عنوان عام.'
    },
    'photo.chosen':     { en: '{name} · {kb} KB', ar: '{name} · {kb} كيلوبايت' },
    'photo.alt.chosen': { en: 'The photograph you just chose.', ar: 'الصورة التي اخترتها للتو.' },
    'photo.another':    { en: 'Choose another', ar: 'اختر غيرها' },
    'photo.attached':   { en: 'Already attached to this flight.', ar: 'مرفقة بهذه الرحلة بالفعل.' },
    'photo.remove':     { en: 'Take it off', ar: 'انزعها' },
    'photo.willremove': { en: 'The photograph will come off when you save.', ar: 'ستُنزع الصورة عند الحفظ.' },
    'photo.keep':       { en: 'Keep it after all', ar: 'أبقِها' },

    'form.err.flightno.empty': { en: 'Which flight was it?', ar: 'أي رحلة كانت؟' },
    /* Two of the Arabic errors carry a Latin example baked into the sentence
       rather than interpolated, so fill()'s isolation never sees them and the
       bidi algorithm gets the token instead. Written as \u escapes because
       LRI and PDI are invisible: a copy-paste that dropped one would be a bug
       nobody could spot in the diff. Without them "KU 681" reads "681 KU". */
    'form.err.flightno.len':   { en: 'Between 2 and 10 characters, like KU 681.', ar: 'من 2 إلى 10 خانات، مثل ' + '\u2066' + 'KU 681' + '\u2069' + '.' },
    'form.err.airline.empty':  { en: 'Which airline?', ar: 'أي شركة طيران؟' },
    'form.err.airline.short':  { en: 'A little more than that.', ar: 'أكثر من ذلك بقليل.' },
    'form.err.from':           { en: 'Three letters, like KWI.', ar: 'ثلاثة أحرف، مثل KWI.' },
    'form.err.to':             { en: 'Three letters, like ICN.', ar: 'ثلاثة أحرف، مثل ICN.' },
    'form.err.same':           { en: 'A flight has to land somewhere else.', ar: 'الرحلة لا بد أن تهبط في مكان آخر.' },
    'form.err.date.empty':     { en: 'When did you fly?', ar: 'متى سافرت؟' },
    'form.err.date.future':    { en: 'This is a log of flights you have taken, so not the future.', ar: 'هذا سجل لرحلات سافرتها، فلا مكان للمستقبل.' },
    'form.err.seat':           { en: 'Like 32A — a row number and one letter.', ar: 'مثل ' + '\u2066' + '32A' + '\u2069' + ' — رقم صف وحرف واحد.' },
    'form.err.note.long':      { en: 'A bit long — 2000 characters at most.', ar: 'طويلة قليلًا — 2000 حرف كحد أقصى.' },
    'form.err.photo.type':     { en: 'JPEG, PNG, WebP or AVIF only.', ar: 'JPEG أو PNG أو WebP أو AVIF فقط.' },
    'form.err.photo.size':     { en: 'That is {mb} MB. The limit is 5 MB.', ar: 'حجمها {mb} ميغابايت. الحد 5 ميغابايت.' },

    'confirm.title': { en: 'Remove this flight?', ar: 'حذف هذه الرحلة؟' },
    /* three sentences rather than one, because the middle one only appears
       when the flight carries a photograph — each has to stand on its own */
    'confirm.text': {
      en: 'Remove {flightNo}, {from} to {to} on {date}?',
      ar: 'حذف {flightNo}، من {from} إلى {to} بتاريخ {date}؟'
    },
    'confirm.photo':  { en: 'The photograph goes with it.', ar: 'وتذهب الصورة معها.' },
    'confirm.undone': { en: 'This cannot be undone.', ar: 'لا يمكن التراجع عن ذلك.' },
    'confirm.no':  { en: 'Keep it', ar: 'أبقِها' },
    'confirm.yes': { en: 'Remove it', ar: 'احذفها' },

    /* --------------------------------------- sharing one flight, in the locker */

    'share.sheet.title': { en: 'Shared', ar: 'تمت المشاركة' },
    'share.link.label':  { en: 'The link', ar: 'الرابط' },
    'share.stop':        { en: 'Stop sharing', ar: 'أوقف المشاركة' },
    'share.done':        { en: 'Done', ar: 'تم' },
    'share.copy':        { en: 'Copy link', ar: 'انسخ الرابط' },
    /* markup: data-i18n-html */
    'share.note': {
      en: '<strong>This does not open your table.</strong> A stranger with the link gets one row, through one function that only ever returns what is printed on a boarding pass. Your note is not among those columns and cannot be. Switch sharing off and the link stops answering immediately.',
      ar: '<strong>هذا لا يفتح جدولك.</strong> من يملك الرابط يحصل على صف واحد، عبر دالة واحدة لا تُعيد إلا ما يُطبع على بطاقة الصعود. ملاحظتك ليست بين تلك الأعمدة ولا يمكن أن تكون. أوقف المشاركة فيتوقف الرابط عن الرد فورًا.'
    },
    /* the sheet's summary is up to four sentences joined with a space: the two
       middle ones only when the row carries them, and the last two are the
       halves of one either/or, so they never appear together */
    'share.what': {
      en: 'Anyone with this link sees {airline} {flightNo}, {from} to {to} on {date}.',
      ar: 'كل من يملك هذا الرابط يرى {airline} {flightNo}، من {from} إلى {to} بتاريخ {date}.'
    },
    'share.what.aircraft': { en: 'The aircraft is a {aircraft}.', ar: 'الطائرة {aircraft}.' },
    'share.what.seat':     { en: 'The seat is {seat}.', ar: 'المقعد {seat}.' },
    'share.what.note': {
      en: 'Your note stays private — the share link cannot return it.',
      ar: 'ملاحظتك تبقى خاصة — رابط المشاركة لا يستطيع إعادتها.'
    },
    'share.what.nonote': {
      en: 'Your note stays private if you add one later.',
      ar: 'ملاحظتك تبقى خاصة إن أضفت واحدة لاحقًا.'
    },

    /* -------------------------------------------------------------- toasts */

    'toast.updated':    { en: '{flightNo} updated.', ar: 'تم تحديث {flightNo}.' },
    'toast.saved':      { en: 'Saved. {flightNo}, {from} to {to}.', ar: 'حُفظت. {flightNo}، من {from} إلى {to}.' },
    'toast.removed':    { en: 'Flight removed.', ar: 'حُذفت الرحلة.' },
    'toast.savefail':   { en: 'That did not save.', ar: 'لم يُحفظ ذلك.' },
    'toast.deletefail': { en: 'That did not delete.', ar: 'لم يُحذف ذلك.' },
    'toast.sharefail':  { en: 'That could not be shared.', ar: 'تعذّرت مشاركة ذلك.' },
    'toast.share.off':  { en: 'Sharing switched off. The link is dead.', ar: 'أُوقفت المشاركة. الرابط لم يعد يعمل.' },
    'toast.share.changefail': { en: 'That could not be changed.', ar: 'تعذّر تغيير ذلك.' },
    'toast.link.copied':   { en: 'Link copied.', ar: 'نُسخ الرابط.' },
    /* Ctrl+C is a key on the reader's keyboard, so it stays as it is printed */
    'toast.link.selected': { en: 'Link selected — copy it with Ctrl+C.', ar: 'حُدّد الرابط — انسخه بـ Ctrl+C.' },
    'toast.exported': {
      en: { one: 'Downloaded {n} flight. The file includes your private notes.', other: 'Downloaded {n} flights. The file includes your private notes.' },
      ar: {
        zero: 'لم تُنزَّل أي رحلة.',
        one: 'نُزّلت رحلة واحدة. الملف يتضمن ملاحظاتك الخاصة.',
        two: 'نُزّلت رحلتان. الملف يتضمن ملاحظاتك الخاصة.',
        few: 'نُزّلت {n} رحلات. الملف يتضمن ملاحظاتك الخاصة.',
        many: 'نُزّلت {n} رحلة. الملف يتضمن ملاحظاتك الخاصة.',
        other: 'نُزّلت {n} رحلة. الملف يتضمن ملاحظاتك الخاصة.'
      }
    },
    'toast.photo.unnamed': {
      en: 'That photograph could not be named. The flight was saved without it.',
      ar: 'تعذّرت تسمية تلك الصورة. حُفظت الرحلة بدونها.'
    },
    'toast.photo.failed': {
      en: 'The flight was saved, but the photograph was not: {reason}',
      ar: 'حُفظت الرحلة، أما الصورة فلا: {reason}'
    },
    'toast.ws.unsupported': {
      en: 'The window seat needs a browser with CSS 3D transforms.',
      ar: 'مقعد النافذة يحتاج متصفحًا يدعم تحويلات CSS ثلاثية الأبعاد.'
    },

    /* ------------------------------------------- what the database says back */

    'err.offline':      { en: 'No connection. Check the network and try again.', ar: 'لا يوجد اتصال. تحقق من الشبكة ثم حاول مرة أخرى.' },
    'err.badcreds':     { en: 'That email and password do not match an account.', ar: 'البريد وكلمة المرور لا يطابقان أي حساب.' },
    'err.unconfirmed':  { en: 'This account still needs to be confirmed. Open the link in the confirmation email, then sign in.', ar: 'هذا الحساب ما زال بحاجة إلى تأكيد. افتح الرابط في رسالة التأكيد ثم سجّل الدخول.' },
    'err.registered':   { en: 'There is already an account with that email. Sign in instead.', ar: 'هناك حساب بهذا البريد بالفعل. سجّل الدخول بدلًا من إنشاء حساب.' },
    'err.pwshort':      { en: 'That password is too short. Use at least 8 characters.', ar: 'كلمة المرور قصيرة. استخدم 8 أحرف على الأقل.' },
    'err.pwweak':       { en: 'That password has turned up in a known breach. Pick a different one.', ar: 'كلمة المرور هذه ظهرت في تسريب معروف. اختر غيرها.' },
    'err.email':        { en: 'That does not look like an email address.', ar: 'هذا لا يبدو بريدًا إلكترونيًا.' },
    'err.ratelimit':    { en: 'Too many attempts in a row. Wait a minute and try again.', ar: 'محاولات كثيرة متتالية. انتظر دقيقة ثم حاول مجددًا.' },
    'err.unauthorised': { en: 'You are not signed in, or the sign-in has expired.', ar: 'لست مسجّل الدخول، أو انتهت صلاحية الجلسة.' },
    'err.duplicate':    { en: 'That flight is already in your locker.', ar: 'هذه الرحلة موجودة في خزانتك بالفعل.' },
    'err.check':        { en: 'One of those values is not allowed. Check the codes and the date.', ar: 'إحدى القيم غير مسموح بها. راجع الرموز والتاريخ.' },
    'err.rls':          { en: 'The database refused that. You can only touch your own flights.', ar: 'قاعدة البيانات رفضت ذلك. لا تستطيع لمس غير رحلاتك.' },
    'err.fk':           { en: 'That flight is not linked to a signed-in member.', ar: 'هذه الرحلة غير مرتبطة بعضو مسجَّل الدخول.' },
    'err.nolink':          { en: 'No signed link came back.', ar: 'لم يعُد أي رابط موقّع.' },
    'err.unknown':      { en: 'Something went wrong ({status}).', ar: 'حدث خطأ ما ({status}).' },
    'err.nosession':    { en: 'The sign-in did not return a session.', ar: 'لم يُعِد تسجيل الدخول أي جلسة.' },
    'err.notsignedin':  { en: 'Not signed in.', ar: 'لست مسجّل الدخول.' },
    'err.norefresh':    { en: 'Could not refresh the sign-in.', ar: 'تعذّر تجديد الجلسة.' },
    'err.notyours.update': { en: 'That flight is not yours to change.', ar: 'هذه الرحلة ليست لك لتعدّلها.' },
    'err.notyours.delete': { en: 'That flight is not yours to delete.', ar: 'هذه الرحلة ليست لك لتحذفها.' },
    'err.config.http':  { en: 'The settings endpoint answered {status}.', ar: 'نقطة الإعدادات ردّت بالرمز {status}.' },
    'err.config.empty': { en: 'The settings endpoint did not return a database address.', ar: 'نقطة الإعدادات لم تُعِد عنوان قاعدة البيانات.' },

    /* ------------------------------------------------------------ not found */

    'e404.title': { en: 'Nothing at this gate.', ar: 'لا شيء عند هذه البوابة.' },
    'e404.body': {
      en: 'That address does not exist on FL350. The departures board is back this way.',
      ar: 'هذا العنوان غير موجود في FL350. لوحة المغادرة من هنا.'
    },
    'e404.back': { en: 'Back to the front page', ar: 'عد إلى الصفحة الأولى' },

    /* ---------------------------------------------------------- share page */
    /* The page a stranger opens. It has no account and no locker behind it,
       so the wording is written for somebody who has never seen FL350. */

    'share.nav.start':  { en: 'Start your own', ar: 'ابدأ خزانتك' },
    'share.eyebrow':    { en: 'Shared boarding pass', ar: 'بطاقة صعود مشتركة' },
    'share.opening':    { en: 'Opening the link…', ar: 'نفتح الرابط…' },
    'share.sub': {
      en: '{airline} {flightNo}, {date}. Shared from a private logbook — the owner’s note is not part of this link.',
      ar: '{airline} {flightNo}، {date}. مشتركة من سجل رحلات خاص — ملاحظة صاحبها ليست جزءًا من هذا الرابط.'
    },

    'share.missing.title':   { en: 'This link does not open anything.', ar: 'هذا الرابط لا يفتح شيئًا.' },
    'share.missing.heading': { en: 'Nothing to show.', ar: 'لا شيء نعرضه.' },
    'share.missing.body': {
      en: 'Either the flight was never shared, sharing has since been switched off, or the link is not quite right. Nothing about the owner’s locker is revealed either way — this page cannot see it.',
      ar: 'إمّا أن الرحلة لم تُشارَك أصلًا، أو أُوقفت مشاركتها بعد ذلك، أو أن الرابط غير صحيح. وفي كل الأحوال لا يُكشف شيء عن خزانة صاحبها — هذه الصفحة لا تراها.'
    },
    'share.missing.action':  { en: 'What FL350 is', ar: 'ما هو FL350' },
    'share.fail.title':      { en: 'The link could not be opened.', ar: 'تعذّر فتح الرابط.' },
    'share.fail.heading': {
      en: 'Something went wrong on the way to the database.',
      ar: 'حدث خطأ في الطريق إلى قاعدة البيانات.'
    },
    'share.fail.body':       { en: 'Try again in a moment.', ar: 'حاول بعد قليل.' },

    'share.explain.title': { en: 'What is and is not in this link', ar: 'ما في هذا الرابط وما ليس فيه' },
    'share.explain.p1': {
      en: 'The owner of this flight switched sharing on for this one row. The link shows the flight as it would be printed on a boarding pass — airline, number, route, date, aircraft, seat — and nothing else.',
      ar: 'صاحب هذه الرحلة فعّل المشاركة لهذا الصف وحده. يعرض الرابط الرحلة كما تُطبع على بطاقة الصعود — شركة الطيران، الرقم، المسار، التاريخ، الطائرة، المقعد — ولا شيء غير ذلك.'
    },
    'share.explain.p2': {
      en: 'Their private note is not here, and it cannot be. Sharing does not open the table: a stranger still has no rights on it at all. This page asks a single function for a single row by its id, and that function only ever returns the columns above, only for a row whose owner marked it public.',
      ar: 'ملاحظته الخاصة ليست هنا، ولا يمكن أن تكون. المشاركة لا تفتح الجدول: الغريب لا يملك عليه أي صلاحية إطلاقًا. هذه الصفحة تسأل دالة واحدة عن صف واحد بمعرّفه، وتلك الدالة لا تُعيد إلا الأعمدة أعلاه، ولا تُعيدها إلا لصف علّمه صاحبه بأنه عام.'
    },
    'share.footer.what': { en: 'What this is', ar: 'ما هذا الموقع' },
    /* markup: data-i18n-html */
    'footer.private': {
      en: '<strong>FL350</strong> — a private flight log.',
      ar: '<strong>FL350</strong> — سجل رحلات خاص.'
    },

    /* -------------------------------------------------------- the route globe */
    /* routeglobe.js writes its own English at the call site and looks these up,
       so a missing key here is an English sentence, not a raw key. It probes
       'globe.caption.empty' to decide whether to stamp the caption lang="ar":
       that key going missing would put Arabic direction over English words. */

    'globe.caption.empty': {
      en: 'Nothing plotted yet. Add a flight and it appears here.',
      ar: 'لا شيء مرسوم بعد. أضف رحلة وستظهر هنا.'
    },
    'globe.airports': {
      en: { one: '{n} airport', other: '{n} airports' },
      ar: {
        zero: 'لا مطارات',
        one: 'مطار واحد',
        two: 'مطارين',
        few: '{n} مطارات',
        many: '{n} مطارًا',
        other: '{n} مطار'
      }
    },
    /* {airports} arrives already rendered from 'globe.airports', so it is a
       string in the sentence and the noun it carries is already agreed */
    'globe.caption': {
      en: {
        one: '{n} flight between {airports}, centred on {region}.',
        other: '{n} flights between {airports}, centred on {region}.'
      },
      ar: {
        zero: 'لا رحلات بين {airports}، والمنظر متمركز على {region}.',
        one: 'رحلة واحدة بين {airports}، والمنظر متمركز على {region}.',
        two: 'رحلتان بين {airports}، والمنظر متمركز على {region}.',
        few: '{n} رحلات بين {airports}، والمنظر متمركز على {region}.',
        many: '{n} رحلة بين {airports}، والمنظر متمركز على {region}.',
        other: '{n} رحلة بين {airports}، والمنظر متمركز على {region}.'
      }
    },
    /* the module puts the separating space in front of this one itself */
    'globe.skipped': {
      en: {
        one: '{n} flight is not drawn — its airport codes are not in the list, so there are no coordinates for it.',
        other: '{n} flights are not drawn — their airport codes are not in the list, so there are no coordinates for them.'
      },
      ar: {
        zero: 'كل الرحلات مرسومة.',
        one: 'رحلة واحدة غير مرسومة — رمزا مطاريها ليسا في القائمة، فلا إحداثيات لها.',
        two: 'رحلتان غير مرسومتين — رموز مطاراتهما ليست في القائمة، فلا إحداثيات لهما.',
        few: '{n} رحلات غير مرسومة — رموز مطاراتها ليست في القائمة، فلا إحداثيات لها.',
        many: '{n} رحلة غير مرسومة — رموز مطاراتها ليست في القائمة، فلا إحداثيات لها.',
        other: '{n} رحلة غير مرسومة — رموز مطاراتها ليست في القائمة، فلا إحداثيات لها.'
      }
    },

    /* Thirty-one rough anchors, only ever read inside the caption sentence:
       "centred on the Levant". The English must stay character-for-character
       what routeglobe.js falls back to, or the two would drift apart. */
    'globe.region.arabianGulf':         { en: 'the Arabian Gulf', ar: 'الخليج العربي' },
    'globe.region.levant':              { en: 'the Levant', ar: 'بلاد الشام' },
    'globe.region.redSea':              { en: 'the Red Sea', ar: 'البحر الأحمر' },
    'globe.region.northAfrica':         { en: 'North Africa', ar: 'شمال أفريقيا' },
    'globe.region.westAfrica':          { en: 'West Africa', ar: 'غرب أفريقيا' },
    'globe.region.eastAfrica':          { en: 'East Africa', ar: 'شرق أفريقيا' },
    'globe.region.southernAfrica':      { en: 'southern Africa', ar: 'جنوب أفريقيا' },
    'globe.region.westernEurope':       { en: 'western Europe', ar: 'غرب أوروبا' },
    'globe.region.northernEurope':      { en: 'northern Europe', ar: 'شمال أوروبا' },
    'globe.region.easternEurope':       { en: 'eastern Europe', ar: 'شرق أوروبا' },
    'globe.region.mediterranean':       { en: 'the Mediterranean', ar: 'البحر المتوسط' },
    /* the key is spelled the way routeglobe.js spells it, ü and all dropped */
    'globe.region.trkiyeCaucasus':      { en: 'Türkiye and the Caucasus', ar: 'تركيا والقوقاز' },
    'globe.region.centralAsia':         { en: 'Central Asia', ar: 'آسيا الوسطى' },
    'globe.region.siberia':             { en: 'Siberia', ar: 'سيبيريا' },
    'globe.region.southAsia':           { en: 'South Asia', ar: 'جنوب آسيا' },
    'globe.region.southEastAsia':       { en: 'South East Asia', ar: 'جنوب شرق آسيا' },
    'globe.region.eastAsia':            { en: 'East Asia', ar: 'شرق آسيا' },
    'globe.region.japanKorea':          { en: 'Japan and Korea', ar: 'اليابان وكوريا' },
    'globe.region.australia':           { en: 'Australia', ar: 'أستراليا' },
    'globe.region.southPacific':        { en: 'the South Pacific', ar: 'جنوب المحيط الهادئ' },
    'globe.region.northPacific':        { en: 'the North Pacific', ar: 'شمال المحيط الهادئ' },
    'globe.region.westernNorthAmerica': { en: 'western North America', ar: 'غرب أمريكا الشمالية' },
    'globe.region.centralNorthAmerica': { en: 'central North America', ar: 'وسط أمريكا الشمالية' },
    'globe.region.easternNorthAmerica': { en: 'eastern North America', ar: 'شرق أمريكا الشمالية' },
    'globe.region.caribbean':           { en: 'the Caribbean', ar: 'البحر الكاريبي' },
    'globe.region.southAmerica':        { en: 'South America', ar: 'أمريكا الجنوبية' },
    'globe.region.northAtlantic':       { en: 'the North Atlantic', ar: 'شمال الأطلسي' },
    'globe.region.southAtlantic':       { en: 'the South Atlantic', ar: 'جنوب الأطلسي' },
    'globe.region.indianOcean':         { en: 'the Indian Ocean', ar: 'المحيط الهندي' },
    'globe.region.arctic':              { en: 'the Arctic', ar: 'القطب الشمالي' },
    'globe.region.antarctica':          { en: 'Antarctica', ar: 'القارة القطبية الجنوبية' },

    /* --------------------------------------------------------- window seat */
    /* The first four are concatenated with a single space, in this order, and
       the middle two only when the row carries those fields — so each one has
       to read as a whole sentence on its own. The ws.sky.* values are dropped
       into ws.alt at {sky} as a noun phrase, never a sentence. */

    'ws.alt': {
      en: 'A view out of a cabin window at flight level 350 on {flight}, {route}, {day}. Outside is {sky}, with the wing entering the lower part of the frame.',
      ar: 'منظر من نافذة الطائرة على مستوى الطيران 350 في {flight}، {route}، {day}. في الخارج {sky}، والجناح يدخل أسفل الإطار.'
    },
    'ws.alt.aircraft':   { en: 'The aircraft is a {aircraft}.', ar: 'الطائرة {aircraft}.' },
    'ws.alt.seat':       { en: 'The seat is {seat}.', ar: 'المقعد {seat}.' },
    'ws.alt.how':        { en: 'Drag, or use the arrow keys, to look around.', ar: 'اسحب، أو استخدم مفاتيح الأسهم، لتنظر حولك.' },
    'ws.dialog':         { en: 'Window seat — {flight}, {route}', ar: 'مقعد النافذة — {flight}، {route}' },
    'ws.eyes': {
      en: 'The view out of the window. Use the arrow keys to look around.',
      ar: 'المنظر من النافذة. استخدم مفاتيح الأسهم لتنظر حولك.'
    },
    'ws.route':          { en: '{from} to {to}', ar: 'من {from} إلى {to}' },
    'ws.airport.unlisted': { en: 'an unlisted airport', ar: 'مطار غير مدرج' },
    'ws.flight':         { en: 'Flight', ar: 'رحلة' },
    'ws.flight.this':    { en: 'this flight', ar: 'هذه الرحلة' },
    'ws.seat':           { en: 'seat {seat}', ar: 'مقعد {seat}' },
    'ws.cruise':         { en: 'cruise · 35,000 ft', ar: 'طيران مستقر · 35,000 قدم' },
    'ws.gyro':           { en: 'Look with your phone', ar: 'انظر بهاتفك' },
    'ws.gyro.title':     { en: 'Look around by moving the phone', ar: 'انظر حولك بتحريك الهاتف' },
    'ws.gyro.refused': {
      en: 'This device will not report its movement. Drag to look around instead.',
      ar: 'هذا الجهاز لا يُبلّغ عن حركته. اسحب بإصبعك لتنظر حولك بدلًا من ذلك.'
    },
    'ws.vr':             { en: 'Cardboard VR', ar: 'نظارة كاردبورد' },
    'ws.vr.title':       { en: 'Split the view for a Cardboard-style headset', ar: 'اقسم المنظر لنظارة من نوع كاردبورد' },
    'ws.close':          { en: 'Close', ar: 'إغلاق' },
    'ws.close.title':    { en: 'Close the window seat', ar: 'إغلاق مقعد النافذة' },
    'ws.hint': {
      en: 'Turn the phone on its side, then slide it into the headset.',
      ar: 'أدر الهاتف على جانبه، ثم أدخله في النظارة.'
    },
    'ws.sky.night':      { en: 'night, with stars over a dark cloud deck', ar: 'ليل ونجوم فوق طبقة غيوم داكنة' },
    'ws.sky.dawn':       { en: 'the indigo hour before dawn', ar: 'الساعة النيلية قبل الفجر' },
    'ws.sky.dusk':       { en: 'the indigo hour after sunset', ar: 'الساعة النيلية بعد الغروب' },
    'ws.sky.sunrise':    { en: 'sunrise gold laid along the horizon', ar: 'ذهب الشروق ممدود على الأفق' },
    'ws.sky.golden':     { en: 'the long orange light of late afternoon', ar: 'ضوء العصر البرتقالي الطويل' },
    'ws.sky.day':        { en: 'flat daylight blue over a bright cloud deck', ar: 'زرقة نهار مستوية فوق طبقة غيوم مضيئة' },

    /* ------------------------------------------------------------ the wait */
    /* The line under the departure board while a page loads. Short, because
       it is on screen for about half a second, and present tense, because it
       describes something happening rather than promising it.

       The board itself is not in here. It is a split-flap board, Arabic is
       cursive, and one letter per cell would spell nonsense — so on an Arabic
       page waiting.js drops the board and sets this sentence large instead. */

    'wait.logbook':   { en: 'Opening your locker',         ar: 'نفتح خزانتك' },
    'wait.login':     { en: 'Taking you to the door',      ar: 'نأخذك إلى الباب' },
    'wait.signup':    { en: 'Finding you a locker',        ar: 'نجهّز لك خزانة' },
    'wait.share':     { en: 'Fetching that boarding pass', ar: 'نُحضر بطاقة الصعود' },
    'wait.home':      { en: 'Back to the front',           ar: 'عودة إلى الواجهة' },
    'wait.generic':   { en: 'One moment',                  ar: 'لحظة واحدة' },
    'wait.creating':  { en: 'Building your locker',        ar: 'نبني خزانتك' },
    'wait.signingin': { en: 'Checking your key',           ar: 'نتحقق من مفتاحك' }
  };
})();
