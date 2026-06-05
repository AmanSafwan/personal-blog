'use strict';

(function () {
  var form = document.getElementById('contactForm');
  var formNext = document.getElementById('formNext');
  var frameStatus = document.getElementById('frameStatus');
  var sendBtn = document.getElementById('contactSendBtn');
  var message = document.getElementById('message');
  var charCount = document.getElementById('messageHint');
  var returnUrl = '';

  function setReturnUrl(url) {
    if (!url) return;
    returnUrl = url.split('#')[0];
    if (formNext) {
      formNext.value = returnUrl;
    }
  }

  function getDefaultReturnUrl() {
    try {
      if (window.parent && window.parent !== window && window.parent.location.href) {
        return window.parent.location.href.split('?')[0].split('#')[0] + '?sent=1';
      }
    } catch (e) {
      /* cross-origin guard */
    }
    return window.location.href.replace(/contact-frame\.html.*$/, 'contact.html?sent=1');
  }

  setReturnUrl(getDefaultReturnUrl());

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'contact-init') return;
    setReturnUrl(event.data.returnUrl);
  });

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'contact-frame-ready' }, '*');
  }

  function showStatus(text, type) {
    if (!frameStatus) return;
    frameStatus.textContent = text;
    frameStatus.className = 'frame-status ' + (type || '');
  }

  function resizeFrame() {
    var height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 8;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'contact-frame-resize', height: height }, '*');
    }
  }

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
      resizeFrame();
    }
    message.addEventListener('input', updateCharCount);
    updateCharCount();
  }

  window.addEventListener('load', resizeFrame);
  window.addEventListener('resize', resizeFrame);

  if (!form) return;

  function submitNativeFallback() {
    form.action = 'https://formsubmit.co/safwanaman2003@gmail.com';
    form.method = 'POST';
    form.target = '_parent';
    if (formNext) {
      formNext.value = returnUrl || getDefaultReturnUrl();
    }
    form.removeEventListener('submit', onSubmit);
    form.submit();
  }

  function onSubmit(e) {
    e.preventDefault();

    var emailEl = document.getElementById('email');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (sendBtn) {
      sendBtn.setAttribute('aria-busy', 'true');
      sendBtn.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
    }
    showStatus('', '');

    var payload = new FormData(form);
    if (emailEl && emailEl.value) {
      var emailValue = emailEl.value.trim();
      payload.set('email', emailValue);
      payload.set('_replyto', emailValue);
    }

    fetch('https://formsubmit.co/ajax/safwanaman2003@gmail.com', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        }).catch(function () {
          return { ok: response.ok, data: {} };
        });
      })
      .then(function (result) {
        if (result.ok && (!result.data || result.data.success !== false)) {
          showStatus('Message sent. Redirecting...', 'success');
          window.setTimeout(function () {
            try {
              window.parent.location.href = returnUrl || getDefaultReturnUrl();
            } catch (err) {
              window.top.location.href = returnUrl || getDefaultReturnUrl();
            }
          }, 600);
          return;
        }

        var msg = (result.data && result.data.message) || 'Could not send message. Try Email directly instead.';
        showStatus(msg, 'error');
        resetButton();
      })
      .catch(function () {
        showStatus('Network blocked. Trying fallback submit...', 'error');
        window.setTimeout(submitNativeFallback, 400);
      });
  }

  form.addEventListener('submit', onSubmit);

  function resetButton() {
    if (!sendBtn) return;
    sendBtn.removeAttribute('aria-busy');
    sendBtn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Message';
  }
})();
