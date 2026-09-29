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

  function isPhoneValid(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 && /^[78]/.test(digits);
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
