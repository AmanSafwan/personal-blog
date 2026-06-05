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

  if (frame) {
    function sendInit() {
      try {
        frame.contentWindow.postMessage({
          type: 'contact-init',
          returnUrl: returnUrl
        }, '*');
      } catch (e) {
        /* iframe not ready */
      }
    }

    frame.addEventListener('load', sendInit);
    sendInit();
  }

  window.addEventListener('message', function (event) {
    if (!event.data) return;

    if (event.data.type === 'contact-frame-ready') {
      sendInit();
    }

    if (event.data.type === 'contact-frame-resize' && frame && event.data.height) {
      frame.style.height = Math.max(event.data.height, 520) + 'px';
    }
  });
})();
