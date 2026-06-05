'use strict';

function hidePreloader() {
  var $preloader = $('#preloder');
  if ($preloader.length) {
    $preloader.remove();
  }
  $('body').addClass('preloader-done');
}

$(function () {
  hidePreloader();
});

$(window).on('load', hidePreloader);

(function ($) {
  $('.set-bg').each(function () {
    var bg = $(this).data('setbg');
    if (bg) {
      $(this).css('background-image', 'url(' + bg + ')');
    }
  });

  var carouselNavText = [
    '<span class="carousel-nav-btn" aria-label="Previous slide" title="Previous"><i class="fa fa-angle-left" aria-hidden="true"></i></span>',
    '<span class="carousel-nav-btn" aria-label="Next slide" title="Next"><i class="fa fa-angle-right" aria-hidden="true"></i></span>'
  ];

  if ($.fn.owlCarousel && $('.hero-slider').length) {
    $('.hero-slider').owlCarousel({
      items: 1,
      nav: true,
      navText: carouselNavText,
      dots: true,
      autoplay: true,
      autoplayTimeout: 3500,
      autoplayHoverPause: true,
      animateOut: 'fadeOut',
      animateIn: 'fadeIn',
      loop: true,
      smartSpeed: 500,
      mouseDrag: true,
      touchDrag: true
    });
  }

  if ($.fn.owlCarousel && $('.testimonial-slider').length) {
    $('.testimonial-slider').owlCarousel({
      items: 1,
      nav: false,
      dots: true,
      autoplay: true,
      loop: true
    });
  }

  if ($.fn.circleProgress) {
    $('.circle-progress').each(function () {
      var cpvalue = $(this).data('cpvalue');
      var cpcolor = $(this).data('cpcolor');
      var cpid = $(this).data('cpid');
      var isSkillRing = $(this).hasClass('skill-ring');
      var size = isSkillRing ? 100 : 80;
      $(this).append('<div class="' + cpid + '"></div><div class="progress-value"><h3>' + cpvalue + '%</h3></div>');
      $('.' + cpid).circleProgress({
        value: Math.min(cpvalue / 100, 1),
        size: size,
        thickness: isSkillRing ? 5 : 4,
        fill: cpcolor,
        emptyFill: isSkillRing ? 'rgba(212, 175, 55, 0.12)' : 'rgba(0, 0, 0, 0)'
      });
    });
  }

  if ($.fn.magnificPopup && $('.video-play').length) {
    $('.video-play').magnificPopup({ type: 'iframe' });
  }

  var pageName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!pageName || pageName === '') pageName = 'index.html';
  $('.main-menu a').each(function () {
    var href = ($(this).attr('href') || '').toLowerCase();
    if (href === pageName) {
      $(this).addClass('active');
    }
  });

  function initHeader() {
    var $header = $('.header-section');
    if (!$header.find('.header-actions').length) {
      $header.append('<div class="header-actions"></div>');
    }
    var $actions = $header.find('.header-actions');
    if (!$actions.find('.theme-toggle').length) {
      $actions.append('<button class="theme-toggle" type="button" aria-label="Toggle color theme">Light</button>');
    }

    var currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
      $('body').addClass('light-theme');
    }
    $('.theme-toggle').text($('body').hasClass('light-theme') ? 'Dark' : 'Light');

    $('.theme-toggle').off('click').on('click', function () {
      $('body').toggleClass('light-theme');
      var isLight = $('body').hasClass('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      $(this).text(isLight ? 'Dark' : 'Light');
    });

    $(window).on('scroll.header', function () {
      if ($(window).scrollTop() > 48) {
        $header.addClass('header-scrolled');
      } else {
        $header.removeClass('header-scrolled');
      }
    }).trigger('scroll');
  }

  initHeader();

  if ($.fn.slicknav && $('.main-menu').length && !$('.slicknav_menu').length) {
    $('.main-menu').slicknav({
      appendTo: '.header-actions',
      allowParentLinks: true,
      closeOnClick: true,
      label: ''
    });
  }

  $(document).on('click', '.slicknav_nav a', function () {
    var $btn = $('.slicknav_btn');
    if ($btn.length && $btn.parent().hasClass('slicknav_open')) {
      $btn.trigger('click');
    }
  });

  function initScrollProgress() {
    if (!$('.scroll-progress').length) {
      $('body').prepend('<div class="scroll-progress" aria-hidden="true"><span class="scroll-progress-bar"></span></div>');
    }
    var $bar = $('.scroll-progress-bar');
    if (!$bar.length) return;

    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      $bar.css('width', pct + '%');
    }

    $(window).on('scroll.scrollProgress resize.scrollProgress', update);
    update();
  }

  initScrollProgress();

  var pageSlug = pageName.replace('.html', '');
  if (pageSlug) {
    $('body').addClass('page-' + (pageSlug === 'index' ? 'home' : pageSlug));
  }

  $('#year').text(new Date().getFullYear());

  if (!$('body').hasClass('page-contact')) {
    var $legacyForm = $('#contactForm');
    if ($legacyForm.length) {
      $legacyForm.on('submit', function () {
        var email = ($('#email').val() || '').trim();
        if (email) {
          $('#formReplyTo').val(email);
        }
      });
    }
  }

  if (!$('.scroll-top-btn').length) {
    $('body').append('<button class="scroll-top-btn" aria-label="Back to top"><i class="fa fa-arrow-up"></i></button>');
  }

  $(window).on('scroll', function () {
    if ($(window).scrollTop() > 350) {
      $('.scroll-top-btn').addClass('visible');
    } else {
      $('.scroll-top-btn').removeClass('visible');
    }
  });

  $('.scroll-top-btn').on('click', function () {
    $('html, body').animate({ scrollTop: 0 }, 500);
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function langColor(lang) {
    var map = {
      Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
      Java: '#b07219', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c',
      'Jupyter Notebook': '#DA5B0B', Shell: '#89e051', C: '#555555'
    };
    return map[lang] || '#d4af37';
  }

  window._githubRepos = [];

  function renderRepoCards(repos) {
    return repos.map(function (r, i) {
      var name = escapeHtml(r.name || '');
      var desc = escapeHtml(r.description || 'No description provided.');
      var lang = r.language || '';
      var langHtml = lang
        ? '<span class="repo-lang"><span class="repo-lang-dot" style="background:' + langColor(lang) + '"></span>' + escapeHtml(lang) + '</span>'
        : '';
      var updated = formatDate(r.updated_at);
      var stars = typeof r.stargazers_count === 'number' ? r.stargazers_count : 0;
      var forks = typeof r.forks_count === 'number' ? r.forks_count : 0;
      var topics = (r.topics || []).slice(0, 3).map(function (t) {
        return '<span class="repo-tag">' + escapeHtml(t) + '</span>';
      }).join('');
      var demoBtn = r.homepage
        ? '<a class="repo-btn-demo" href="' + escapeHtml(r.homepage) + '" target="_blank" rel="noopener noreferrer"><i class="fa fa-external-link"></i> Live Demo</a>'
        : '';

      return '' +
        '<article class="repo-card reveal-on-scroll" data-lang="' + escapeHtml(lang || 'Other') + '" style="animation-delay:' + (i * 0.05) + 's">' +
        '  <div class="repo-card-header">' +
        '    <h4><a href="' + r.html_url + '" target="_blank" rel="noopener noreferrer"><i class="fa fa-github"></i> ' + name + '</a></h4>' +
        '  </div>' +
        '  <p class="repo-card-desc">' + desc + '</p>' +
        '  <div class="repo-tags">' + topics + '</div>' +
        '  <div class="repo-meta-row">' +
        langHtml +
        '    <span><i class="fa fa-star"></i> ' + stars + '</span>' +
        '    <span><i class="fa fa-code-fork"></i> ' + forks + '</span>' +
        '    <span><i class="fa fa-clock-o"></i> ' + escapeHtml(updated) + '</span>' +
        '  </div>' +
        '  <div class="repo-card-actions">' +
        '    <a class="repo-btn-code" href="' + r.html_url + '" target="_blank" rel="noopener noreferrer"><i class="fa fa-github"></i> View Code</a>' +
        demoBtn +
        '  </div>' +
        '</article>';
    }).join('');
  }

  function updateGithubStats(repos) {
    var el = document.getElementById('githubStats');
    if (!el || !repos.length) return;
    var langs = {};
    repos.forEach(function (r) {
      if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
    });
    var topLang = Object.keys(langs).sort(function (a, b) { return langs[b] - langs[a]; })[0] || '-';
    el.innerHTML =
      '<div class="github-stat"><strong>' + repos.length + '</strong><span>Repositories</span></div>' +
      '<div class="github-stat"><strong>' + topLang + '</strong><span>Top Language</span></div>' +
      '<div class="github-stat"><strong>Live</strong><span>GitHub API</span></div>' +
      '<div class="github-stat"><strong><i class="fa fa-github"></i></strong><span>AmanSafwan</span></div>';
  }

  function buildRepoFilters(repos) {
    var tabs = document.getElementById('repoFilterTabs');
    if (!tabs) return;
    var langs = {};
    repos.forEach(function (r) {
      var l = r.language || 'Other';
      langs[l] = true;
    });
    var html = '<button class="repo-filter-tab active" data-repo-lang="all" type="button">All</button>';
    Object.keys(langs).sort().forEach(function (l) {
      html += '<button class="repo-filter-tab" data-repo-lang="' + escapeHtml(l) + '" type="button">' + escapeHtml(l) + '</button>';
    });
    tabs.innerHTML = html;
  }

  function filterRepos(lang) {
    var grid = document.getElementById('repoGrid');
    if (!grid) return;
    var list = window._githubRepos;
    if (lang && lang !== 'all') {
      list = list.filter(function (r) {
        return (r.language || 'Other') === lang;
      });
    }
    grid.innerHTML = renderRepoCards(list);
    if (typeof window.revealOnScroll === 'function') window.revealOnScroll();
  }

  function loadGithubRepos(targetSelector, limit) {
    var el = document.querySelector(targetSelector);
    if (!el) return;

    var url = 'https://api.github.com/users/AmanSafwan/repos?per_page=100&sort=updated';
    fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('GitHub API error');
        return r.json();
      })
      .then(function (repos) {
        var filtered = (repos || []).filter(function (x) {
          return x && !x.fork;
        });
        filtered.sort(function (a, b) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        });

        window._githubRepos = filtered;

        if (targetSelector === '#repoGrid') {
          updateGithubStats(filtered);
          buildRepoFilters(filtered);
        }

        var top = limit ? filtered.slice(0, limit) : filtered;
        if (!top.length) {
          el.innerHTML = '<div class="repo-loading">No repositories found.</div>';
          return;
        }
        el.innerHTML = renderRepoCards(top);
        if (typeof window.revealOnScroll === 'function') window.revealOnScroll();
        if (targetSelector === '#homeRepoCarousel') {
          $(document).trigger('home:reposLoaded');
        }
      })
      .catch(function () {
        el.innerHTML = '<div class="repo-loading">Unable to load repositories. Visit <a class="read-more" href="https://github.com/AmanSafwan" target="_blank" rel="noopener noreferrer">GitHub</a>.</div>';
      });
  }

  $(document).on('click', '.repo-filter-tab', function () {
    $('.repo-filter-tab').removeClass('active');
    $(this).addClass('active');
    filterRepos($(this).data('repo-lang'));
  });

  loadGithubRepos('#repoGrid', 0);
  loadGithubRepos('#homeRepoCarousel', 8);

  function revealOnScroll() {
    $('.reveal-on-scroll').each(function () {
      var el = $(this);
      if (el.hasClass('revealed')) return;
      if (el.offset().top < $(window).scrollTop() + $(window).height() - 80) {
        el.addClass('revealed');
      }
    });
  }
  window.revealOnScroll = revealOnScroll;
  $(window).on('scroll resize', revealOnScroll);
  revealOnScroll();

  function animateCounters() {
    $('.stat-num').each(function () {
      var $el = $(this);
      if ($el.data('animated')) return;
      var target = parseInt($el.data('count'), 10);
      if (!target || $el.offset().top > $(window).scrollTop() + $(window).height()) return;
      $el.data('animated', true);
      var current = 0;
      var step = Math.ceil(target / 40);
      var timer = setInterval(function () {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        $el.text(current);
      }, 30);
    });
  }
  $(window).on('scroll', animateCounters);
  animateCounters();

  $('.filter-btn').on('click', function () {
    var filter = $(this).data('filter');
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    $('.blog-post[data-category]').each(function () {
      var cat = $(this).data('category');
      if (filter === 'all' || cat === filter) {
        $(this).removeClass('hidden-post').show();
      } else {
        $(this).addClass('hidden-post').hide();
      }
    });
  });

  $('.sb-cata-list a[data-cat]').on('click', function (e) {
    e.preventDefault();
    if (!$('.blog-filter').length) return;
    var cat = $(this).data('cat');
    $('.filter-btn[data-filter="' + cat + '"]').addClass('active').trigger('click');
    $('.filter-btn').not('[data-filter="' + cat + '"]').removeClass('active');
    $('html, body').animate({ scrollTop: $('.blog-filter').offset().top - 100 }, 400);
  });

  // Lightbox, delegated so carousels and dynamic grids work
  if ($.fn.magnificPopup && $('.image-popup').length) {
    $('body').magnificPopup({
      delegate: '.image-popup',
      type: 'image',
      gallery: { enabled: true },
      image: {
        titleSrc: function (item) {
          return item.el.attr('data-caption') || '';
        }
      }
    });
  }

  $('.gallery-filter-btn').on('click', function () {
    var filter = $(this).data('filter');
    $('.gallery-filter-btn').removeClass('active');
    $(this).addClass('active');

    $('#photoJournalGrid .photo-card[data-category]').each(function () {
      var cat = $(this).data('category');
      var show = filter === 'all' || cat === filter;
      var $card = $(this);
      if (show) {
        $card.stop(true).css({ opacity: 0, display: 'block' }).animate({ opacity: 1 }, 280);
      } else {
        $card.stop(true).animate({ opacity: 0 }, 180, function () {
          $card.hide();
        });
      }
    });
    updateGalleryCount();
  });

  function updateGalleryCount() {
    var $grid = $('#photoJournalGrid');
    if (!$grid.length) return;
    var visible = $grid.find('.photo-card:visible').length;
    var total = $grid.find('.photo-card').length;
    $('#galleryPhotoCount').text(visible === total ? total : visible + ' / ' + total);
  }

  if ($('#photoJournalGrid').length) {
    updateGalleryCount();
  }

  /* ---- LinkedIn feed is handled by js/linkedin-feed.js ---- */

  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 80 }, 500);
    }
  });

})(jQuery);
