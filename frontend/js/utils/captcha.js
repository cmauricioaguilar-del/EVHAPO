// ─── CAPTCHA simple "No soy un robot" ────────────────────────────────────────
// Estado por formulario: 'login' y 'reg'
const _captchaState = {};

function toggleCaptcha(formId) {
  const check = document.getElementById(`${formId}-captcha-check`);
  const box   = document.getElementById(`${formId}-captcha-box`);
  if (!check || !box) return;

  if (_captchaState[formId]) {
    // Desmarcar
    _captchaState[formId] = false;
    check.classList.remove('checked');
    box.classList.remove('verified');
  } else {
    // Marcar — pequeña animación de "verificando"
    check.style.opacity = '0.5';
    setTimeout(() => {
      _captchaState[formId] = true;
      check.style.opacity = '1';
      check.classList.add('checked');
      box.classList.add('verified');
    }, 600);
  }
}
