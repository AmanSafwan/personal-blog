'use strict';

(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (window.location.search.indexOf('sent=1') !== -1) {
    var status = document.getElementById('formStatus');
    if (status) {
      status.textContent = 'Message sent successfully. I will reply to your email within 24–48 hours. Thank you!';
      status.classList.add('success');
    }
    if (window.history && window.history.replaceState) {
      var clean = window.location.href.split('?')[0].split('#')[0];
      window.history.replaceState({}, document.title, clean);
    }
  }

  var message = document.getElementById('message');
  var charCount = document.getElementById('messageHint');
  if (message && charCount) {
    function updateCharCount() {
      var len = (message.value || '').trim().length;
      if (len < 10) {
        charCount.textContent = len + ' / 10 characters minimum';
        charCount.classList.remove('is-valid');
      } else {
        charCount.textContent = len + ' characters · Ready to send';
        charCount.classList.add('is-valid');
      }
    }
    message.addEventListener('input', updateCharCount);
    updateCharCount();
  }
})();
