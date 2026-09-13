/* FL350 · the door. Create an account, or come back to one. */
(function () {
  'use strict';

  var FL = window.FL350;
  var ui = FL.ui;
  var t = FL.i18n.t;

  var form = document.getElementById('auth-form');
  var tabIn = document.getElementById('tab-signin');
  var tabUp = document.getElementById('tab-signup');
  var nameField = document.getElementById('field-name');
  var inputName = document.getElementById('display-name');
  var inputEmail = document.getElementById('email');
  var inputPassword = document.getElementById('password');
  var submit = document.getElementById('auth-submit');
  var alertBox = document.getElementById('auth-alert');
  var passwordHint = document.getElementById('password-hint');
  var title = document.getElementById('auth-title');
  var lede = document.getElementById('auth-lede');
  var switchNote = document.getElementById('auth-switch');

  var mode = 'signin'; // or 'signup'

  /* -------------------------------------------------------------- helpers */

  function nextPath() {
    var params = new URLSearchParams(location.search);
    var next = params.get('next') || '/logbook';
    // Only ever follow a path on this site — never an address someone appended.
    return /^\/[A-Za-z0-9/_-]*$/.test(next) ? next : '/logbook';
  }

  function say(message, kind) {
    if (!message) {
      alertBox.hidden = true;
      alertBox.textContent = '';
      return;
    }
    alertBox.hidden = false;
    alertBox.textContent = message;
    alertBox.setAttribute('data-kind', kind || 'bad');
  }

  function setError(input, message) {
    var holder = document.getElementById(input.id + '-error');
    if (holder) holder.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  }

  function checkEmail() {
    var value = inputEmail.value.trim();
    if (!value) return setError(inputEmail, t('auth.err.email.empty'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return setError(inputEmail, t('auth.err.email.bad'));
    }
    return setError(inputEmail, '');
  }

  function checkPassword() {
    var value = inputPassword.value;
    if (!value) return setError(inputPassword, t('auth.err.password.empty'));
    if (mode === 'signup' && value.length < 8) {
      return setError(inputPassword, t('auth.err.password.short'));
    }
    return setError(inputPassword, '');
  }

  function checkName() {
    if (mode !== 'signup') return true;
    var value = inputName.value.trim();
    if (!value) return setError(inputName, t('auth.err.name.empty'));
    if (value.length > 40) return setError(inputName, t('auth.err.name.long'));
    return setError(inputName, '');
  }

  /* ----------------------------------------------------------------- mode */

  function setMode(next) {
    mode = next;
    var signingUp = mode === 'signup';

    tabIn.setAttribute('aria-selected', signingUp ? 'false' : 'true');
    tabUp.setAttribute('aria-selected', signingUp ? 'true' : 'false');
    nameField.hidden = !signingUp;
    inputName.required = signingUp;
    inputPassword.setAttribute('autocomplete', signingUp ? 'new-password' : 'current-password');

    title.textContent = t(signingUp ? 'auth.title.signup' : 'auth.title.signin');
    lede.textContent = t(signingUp ? 'auth.lede.signup' : 'auth.lede.signin');
    submit.querySelector('span').textContent = t(signingUp ? 'auth.submit.signup' : 'auth.submit.signin');
    passwordHint.textContent = signingUp ? t('auth.hint.password') : '';
    switchNote.innerHTML =
      ui.esc(t(signingUp ? 'auth.switch.have' : 'auth.switch.first')) +
      ' <button type="button" class="link-button" id="auth-swap">' +
      ui.esc(t(signingUp ? 'auth.switch.signin' : 'auth.switch.create')) +
      '</button>';

    var swap = document.getElementById('auth-swap');
    if (swap) {
      swap.addEventListener('click', function () {
        setMode(signingUp ? 'signin' : 'signup');
        inputEmail.focus();
      });
    }

    say('');
    setError(inputPassword, '');
    setError(inputName, '');
  }

  tabIn.addEventListener('click', function () { setMode('signin'); });
  tabUp.addEventListener('click', function () { setMode('signup'); });

  /* --------------------------------------------------------------- submit */

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    say('');

    var ok = checkEmail() && checkPassword() && checkName();
    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var email = inputEmail.value.trim();
    var password = inputPassword.value;
    ui.busy(submit, true);

    var work =
      mode === 'signup'
        ? FL.auth.signUp(email, password, inputName.value.trim()).then(function (result) {
            if (result.needsConfirmation) {
              ui.busy(submit, false);
              setMode('signin');
              say(t('auth.msg.created'), 'good');
              return null;
            }
            return result.session;
          })
        : FL.auth.signIn(email, password);

    work
      .then(function (session) {
        if (!session) return;
        location.replace(nextPath());
      })
      .catch(function (err) {
        ui.busy(submit, false);
        say(err.message || t('auth.err.generic'));
        if (/password/i.test(err.message || '')) inputPassword.focus();
      });
  });

  inputEmail.addEventListener('blur', checkEmail);
  inputPassword.addEventListener('blur', checkPassword);
  inputName.addEventListener('blur', checkName);

  // Re-check only after the first complaint, so it does not nag while typing.
  [inputEmail, inputPassword, inputName].forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') {
        if (input === inputEmail) checkEmail();
        if (input === inputPassword) checkPassword();
        if (input === inputName) checkName();
      }
    });
  });

  /* ----------------------------------------------------------------- boot */

  ui.mountThemeToggle(document.getElementById('theme-toggle'));

  var params = new URLSearchParams(location.search);
  if (params.get('signedout')) say(t('auth.msg.signedout'), 'good');
  if (params.get('next') && !params.get('signedout')) {
    say(t('auth.msg.membersonly'), 'good');
  }

  setMode(params.get('mode') === 'signup' ? 'signup' : 'signin');

  // Already signed in? Go straight through.
  if (FL.auth.session()) {
    FL.auth
      .verify()
      .then(function () { location.replace(nextPath()); })
      .catch(function () { FL.auth.signOut(); });
  }

  document.addEventListener('fl350:langchange', function () {
    setMode(mode);
  });

  inputEmail.focus();
})();
