'use strict';

(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var returnUrl = window.location.href.split('?')[0].split('#')[0] + '?sent=1';
  var frame = document.getElementById('contactFormFrame');

  function showSuccessState() {
    var banner = document.getElementById('contactSuccessBanner');
    if (banner) {
      banner.hidden = false;
      banner.classList.add('is-visible');
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

  function sendInit() {
    if (!frame) return;
    try {
      frame.contentWindow.postMessage({
        type: 'contact-init',
        returnUrl: returnUrl,
        theme: document.body.classList.contains('light-theme') ? 'light' : 'dark'
      }, '*');
    } catch (e) {
      /* iframe not ready */
    }
  }

  if (frame) {
    frame.addEventListener('load', sendInit);
    sendInit();
  }

  var themeObserver = new MutationObserver(sendInit);
  if (document.body) {
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'contact-frame-ready') return;
    sendInit();
  });
})();
