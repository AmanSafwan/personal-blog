'use strict';

(function ($) {
  if (!$('body').hasClass('page-home')) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TICKER_ITEMS = [
    'Python', 'Machine Learning', 'Web Development', 'SQL & Data',
    'Git Workflow', 'JavaScript', 'Django', 'FYP Research',
    'UniSZA FIK', "Dean's List", 'PNGK 3.81', 'Open Source',
    'Mobile Apps', 'REST APIs', 'SMSKPP'
  ];

  function buildTicker() {
    var $track = $('#homeTickerTrack');
    if (!$track.length) return;

    function chipsHtml() {
      return TICKER_ITEMS.map(function (label) {
        return '<span class="home-ticker-chip"><i class="fa fa-circle"></i>' + label + '</span>';
      }).join('');
    }

    $track.html(chipsHtml() + chipsHtml());
    if (reducedMotion) {
      $track.closest('.home-ticker').addClass('is-paused');
    }
  }

  var carouselNavText = [
    '<span class="carousel-nav-btn" aria-label="Previous slide" title="Previous"><i class="fa fa-angle-left" aria-hidden="true"></i></span>',
    '<span class="carousel-nav-btn" aria-label="Next slide" title="Next"><i class="fa fa-angle-right" aria-hidden="true"></i></span>'
  ];

  function owlDefaults() {
    return {
      autoplay: !reducedMotion,
      autoplayTimeout: 3500,
      autoplayHoverPause: true,
      smartSpeed: 500,
      loop: true,
      nav: true,
      dots: true,
      navText: carouselNavText
    };
  }

  function initPortfolioSlider() {
    var $slider = $('#homePortfolioSlider');
    if (!$slider.length || typeof $slider.owlCarousel !== 'function') return;

    $slider.owlCarousel($.extend({}, owlDefaults(), {
      autoplayTimeout: 3200,
      margin: 20,
      responsive: {
        0: { items: 1 },
        576: { items: 2 },
        992: { items: 3 }
      },
      onInitialized: function () {
        $slider.find('.portfolio-card').addClass('revealed');
      }
    }));
  }

  function initGalleryCarousel() {
    var $carousel = $('#homeGalleryCarousel');
    if (!$carousel.length || typeof $carousel.owlCarousel !== 'function') return;

    $carousel.owlCarousel($.extend({}, owlDefaults(), {
      autoplayTimeout: 2800,
      margin: 18,
      center: false,
      responsive: {
        0: { items: 1, stagePadding: 28 },
        576: { items: 2, stagePadding: 16 },
        992: { items: 3, stagePadding: 0 }
      }
    }));
  }

  function initRepoCarousel() {
    var $carousel = $('#homeRepoCarousel');
    if (!$carousel.length || typeof $carousel.owlCarousel !== 'function') return;
    var count = $carousel.find('.repo-card').length;
    if (count === 0) return;
    if ($carousel.hasClass('owl-loaded')) return;

    $carousel.owlCarousel($.extend({}, owlDefaults(), {
      autoplayTimeout: 3800,
      margin: 20,
      loop: count > 2,
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        1100: { items: 3 }
      }
    }));
  }

  function initHomeCounters() {
    var $strip = $('#homeStatsStrip');
    if (!$strip.length) return;

    function animateValue($el) {
      if ($el.data('done')) return;
      var target = parseFloat($el.data('count'));
      if (isNaN(target)) return;

      $el.data('done', true);
      var decimal = parseInt($el.data('decimal'), 10) || 0;
      var suffix = $el.data('suffix') || '';
      var prefix = $el.data('prefix') || '';
      var duration = reducedMotion ? 0 : 1200;
      var start = performance.now();

      function frame(now) {
        var t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = target * eased;
        $el.text(prefix + (decimal ? val.toFixed(decimal) : Math.round(val)) + suffix);
        if (t < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    function check() {
      if ($strip.offset().top > $(window).scrollTop() + $(window).height() - 40) return;
      $strip.find('.home-stat-num').each(function () {
        animateValue($(this));
      });
    }

    $(window).on('scroll.homeCounters resize.homeCounters', check);
    check();
  }

  function initPortfolioTilt() {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    $(document).on('mousemove', '.portfolio-card--interactive', function (e) {
      var card = this;
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(700px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-4px)';
    });

    $(document).on('mouseleave', '.portfolio-card--interactive', function () {
      this.style.transform = '';
    });
  }

  function initScrollCue() {
    $('.hero-scroll-cue').on('click', function (e) {
      var href = $(this).attr('href');
      if (!href || href.charAt(0) !== '#') return;
      var $target = $(href);
      if (!$target.length) return;
      e.preventDefault();
      $('html, body').animate({ scrollTop: $target.offset().top - 64 }, 700);
    });
  }

  $(document).on('home:reposLoaded', initRepoCarousel);

  $(function () {
    buildTicker();
    initPortfolioSlider();
    initGalleryCarousel();
    initHomeCounters();
    initPortfolioTilt();
    initScrollCue();

    if ($('#homeRepoCarousel .repo-card').length) {
      initRepoCarousel();
    }
  });
})(jQuery);
