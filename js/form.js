// Форма записи: подстановка услуги из карточки и простая проверка полей.
// Отправки на сервер в тестовом нет — показываем сообщение об успехе.

(function () {
  const form = document.querySelector('[data-consult-form]');
  if (!form) return;

  const serviceInput = form.elements.service;
  const nameInput = form.elements.name;
  const phoneInput = form.elements.phone;
  const consentInput = form.elements.consent;
  const status = form.querySelector('.consult__status');

  // «Консультация» в карточке: запоминаем услугу и ставим курсор в форму
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      serviceInput.value = link.dataset.service;
      form.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInput.focus({ preventScroll: true });
    });
  });

  // Телефон: поле всегда начинается с +7, остальное форматируется по ходу ввода
  const PHONE_PREFIX = '+7 ';

  function nationalDigits(value) {
    let digits = value.replace(/\D/g, '');
    if (value.startsWith('+7')) digits = digits.slice(1);
    // вставили номер целиком: 8 999… или 7 999…
    if (digits.length > 10 && /^[78]/.test(digits)) digits = digits.slice(1);
    return digits.slice(0, 10);
  }

  function formatPhone(digits) {
    // разделитель появляется только со следующей цифрой — иначе Backspace
    // упирался бы в «) » и не мог его стереть
    let result = PHONE_PREFIX;
    if (digits.length > 0) result += '(' + digits.slice(0, 3);
    if (digits.length > 3) result += ') ' + digits.slice(3, 6);
    if (digits.length > 6) result += '-' + digits.slice(6, 8);
    if (digits.length > 8) result += '-' + digits.slice(8, 10);
    return result;
  }

  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) phoneInput.value = PHONE_PREFIX;
  });

  phoneInput.addEventListener('blur', () => {
    if (nationalDigits(phoneInput.value).length === 0) phoneInput.value = '';
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = formatPhone(nationalDigits(phoneInput.value));
  });

  function isPhoneValid(value) {
    return nationalDigits(value).length === 10;
  }

  function markInvalid(input, invalid) {
    input.setAttribute('aria-invalid', String(invalid));
  }

  form.addEventListener('input', (event) => {
    if (event.target.matches('.field__input')) {
      markInvalid(event.target, false);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInvalid = nameInput.value.trim().length < 2;
    const phoneInvalid = !isPhoneValid(phoneInput.value);
    markInvalid(nameInput, nameInvalid);
    markInvalid(phoneInput, phoneInvalid);

    if (nameInvalid || phoneInvalid) {
      status.textContent = 'Проверьте ФИО и номер телефона.';
      (nameInvalid ? nameInput : phoneInput).focus();
      return;
    }
    if (!consentInput.checked) {
      status.textContent = 'Нужно согласие на обработку персональных данных.';
      return;
    }

    status.textContent = 'Спасибо! Мы перезвоним в ближайшее время.';
    form.reset();
    serviceInput.value = '';
  });
})();
