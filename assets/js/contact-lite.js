'use strict';

(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var form = document.getElementById('contactForm');
  var formNext = document.getElementById('formNext');
  if (formNext) {
    formNext.value = window.location.href.split('?')[0].split('#')[0] + '?sent=1';
  }

  function showSuccessState() {
    var banner = document.getElementById('contactSuccessBanner');
    var status = document.getElementById('formStatus');

    if (banner) {
      banner.hidden = false;
      banner.classList.add('is-visible');
    }

    if (status) {
      status.textContent = 'Your message was delivered. I will reply to your email within 24 to 48 hours.';
      status.classList.add('success');
      status.classList.remove('error');
    }

    if (window.history && window.history.replaceState) {
      var clean = window.location.href.split('?')[0].split('#')[0];
      window.history.replaceState({}, document.title, clean);
    }

    if (banner && banner.scrollIntoView) {
      window.setTimeout(function () {
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  }

  if (window.location.search.indexOf('sent=1') !== -1) {
    showSuccessState();
  }

  if (form) {
    form.addEventListener('submit', function () {
      var emailEl = document.getElementById('email');
      var replyTo = document.getElementById('formReplyTo');
      var sendBtn = document.getElementById('contactSendBtn');

      if (emailEl && replyTo && emailEl.value) {
        replyTo.value = emailEl.value.trim();
      }

      if (sendBtn) {
        sendBtn.setAttribute('aria-busy', 'true');
        sendBtn.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
      }
    });
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
        charCount.textContent = len + ' characters ready to send';
        charCount.classList.add('is-valid');
      }
    }
    message.addEventListener('input', updateCharCount);
    updateCharCount();
  }
})();
