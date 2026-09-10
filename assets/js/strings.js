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

    /* ------------------------------------------------------------- statistics */

    'stat.flights':     { en: 'Flights', ar: 'الرحلات' },
    'stat.flights.sub': { en: '{n} in {year}', ar: '{n} في {year}' },

    'stat.distance': { en: 'Distance', ar: 'المسافة' },
    'unit.km':       { en: 'km', ar: 'كم' },
    'stat.distance.laps':     { en: '≈ {laps}× around the Earth', ar: '≈ {laps} مرة حول الأرض' },
    'stat.distance.approx':   { en: 'approximate, great circle', ar: 'تقديرية، دائرة عظمى' },
    /* the counted noun is the legs, so this one agrees with {n} */
    'stat.distance.measured': {
      en: { one: '{n} of {total} leg measured', other: '{n} of {total} legs measured' },
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

    'form.err.flightno.empty': { en: 'Which flight was it?', ar: 'أي رحلة كانت؟' },
    'form.err.flightno.len':   { en: 'Between 2 and 10 characters, like KU 681.', ar: 'من 2 إلى 10 خانات، مثل KU 681.' },
    'form.err.airline.empty':  { en: 'Which airline?', ar: 'أي شركة طيران؟' },
    'form.err.airline.short':  { en: 'A little more than that.', ar: 'أكثر من ذلك بقليل.' },
    'form.err.from':           { en: 'Three letters, like KWI.', ar: 'ثلاثة أحرف، مثل KWI.' },
    'form.err.to':             { en: 'Three letters, like ICN.', ar: 'ثلاثة أحرف، مثل ICN.' },
    'form.err.same':           { en: 'A flight has to land somewhere else.', ar: 'الرحلة لا بد أن تهبط في مكان آخر.' },
    'form.err.date.empty':     { en: 'When did you fly?', ar: 'متى سافرت؟' },
    'form.err.date.future':    { en: 'This is a log of flights you have taken, so not the future.', ar: 'هذا سجل لرحلات سافرتها، فلا مكان للمستقبل.' },
    'form.err.seat':           { en: 'Like 32A — a row number and one letter.', ar: 'مثل 32A — رقم صف وحرف واحد.' },
    'form.err.note.long':      { en: 'A bit long — 2000 characters at most.', ar: 'طويلة قليلًا — 2000 حرف كحد أقصى.' },

    'confirm.title': { en: 'Remove this flight?', ar: 'حذف هذه الرحلة؟' },
    'confirm.text': {
      en: 'Remove {flightNo}, {from} to {to} on {date}? This cannot be undone.',
      ar: 'حذف {flightNo}، من {from} إلى {to} بتاريخ {date}؟ لا يمكن التراجع عن ذلك.'
    },
    'confirm.no':  { en: 'Keep it', ar: 'أبقِها' },
    'confirm.yes': { en: 'Remove it', ar: 'احذفها' },

    /* -------------------------------------------------------------- toasts */

    'toast.updated':    { en: '{flightNo} updated.', ar: 'تم تحديث {flightNo}.' },
    'toast.saved':      { en: 'Saved. {flightNo}, {from} to {to}.', ar: 'حُفظت. {flightNo}، من {from} إلى {to}.' },
    'toast.removed':    { en: 'Flight removed.', ar: 'حُذفت الرحلة.' },
    'toast.savefail':   { en: 'That did not save.', ar: 'لم يُحفظ ذلك.' },
    'toast.deletefail': { en: 'That did not delete.', ar: 'لم يُحذف ذلك.' },

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
    'e404.back': { en: 'Back to the front page', ar: 'عد إلى الصفحة الأولى' }
  };
})();
