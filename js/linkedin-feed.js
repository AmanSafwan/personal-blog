'use strict';

/**
 * Real LinkedIn Feed — displays ONLY native LinkedIn embeds.
 * Data: data/linkedin-feed.json (generated from data/linkedin-post-urls.json)
 * Every post is a real LinkedIn iframe with live reactions, comments, and shares.
 */
(function ($) {
  var FEED_PATH = 'data/linkedin-feed.json';
  var PAGE_SIZE = 3;

  var state = {
    profile: null,
    posts: [],
    filter: 'all',
    visible: PAGE_SIZE
  };

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatSynced(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso || '';
    }
  }

  function loadFeedData() {
    return $.ajax({
      url: FEED_PATH,
      dataType: 'json',
      cache: false
    }).then(function (data) {
      state.profile = data.profile || {};
      state.posts = (data.posts || []).filter(function (p) {
        return p.type === 'embed' && p.embedSrc;
      });
      state.lastSynced = data.lastSynced;
      state.mode = data.mode || 'live-embed';
      return data;
    });
  }

  function getFilteredPosts() {
    if (state.filter === 'all') return state.posts;
    return state.posts.filter(function (p) {
      return p.category === state.filter;
    });
  }

  function getCategories() {
    var cats = {};
    state.posts.forEach(function (p) {
      if (p.category && p.category !== 'all') cats[p.category] = true;
    });
    return Object.keys(cats);
  }

  function renderEmbedCard(post, index) {
    var cat = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Post';
    return '' +
      '<article class="li-embed-card" data-feed-id="' + escapeHtml(post.id) + '" data-category="' + escapeHtml(post.category || 'all') + '" style="animation-delay:' + (index * 0.06) + 's">' +
      '  <div class="li-embed-toolbar">' +
      '    <span class="li-embed-category">' + escapeHtml(cat) + '</span>' +
      '    <span class="li-embed-live"><i class="fa fa-linkedin"></i> Live on LinkedIn</span>' +
      '    <a class="li-embed-open" href="' + escapeHtml(post.postUrl) + '" target="_blank" rel="noopener noreferrer">Open post <i class="fa fa-external-link"></i></a>' +
      '  </div>' +
      '  <div class="li-embed-frame">' +
      '    <iframe src="' + escapeHtml(post.embedSrc) + '" title="LinkedIn post" frameborder="0" allowfullscreen="" scrolling="no" loading="lazy"></iframe>' +
      '  </div>' +
      '</article>';
  }

  function renderEmptyState() {
    var profile = state.profile || {};
    var activityUrl = profile.activityUrl || profile.url;
    return '' +
      '<div class="feed-empty feed-empty--live">' +
      '  <div class="feed-empty-icon"><i class="fa fa-linkedin"></i></div>' +
      '  <h3>Connect your real LinkedIn posts</h3>' +
      '  <p>LinkedIn does not allow websites to auto-pull your posts without authentication. This blog uses <strong>official LinkedIn embeds</strong> — each post you add appears here with real likes, comments, and shares from LinkedIn.</p>' +
      '  <ol class="feed-setup-steps">' +
      '    <li>Open <a href="' + escapeHtml(activityUrl) + '" target="_blank" rel="noopener noreferrer">your LinkedIn activity</a> (while signed in)</li>' +
      '    <li>Open a post → click <strong>⋯</strong> → <strong>Copy link to post</strong></li>' +
      '    <li>Paste the URL into <code>data/linkedin-post-urls.json</code> and push to GitHub</li>' +
      '  </ol>' +
      '  <div class="feed-empty-actions">' +
      '    <a class="site-btn linkedin-btn" href="' + escapeHtml(profile.url || 'https://www.linkedin.com/in/amansafwan/') + '" target="_blank" rel="noopener noreferrer"><i class="fa fa-linkedin"></i> View LinkedIn Profile</a>' +
      '    <a class="site-btn" href="' + escapeHtml(activityUrl) + '" target="_blank" rel="noopener noreferrer"><i class="fa fa-rss"></i> All Activity</a>' +
      '  </div>' +
      '</div>';
  }

  function renderTabs() {
    var cats = getCategories();
    var $tabs = $('.feed-tabs');
    if (!cats.length || !state.posts.length) {
      $tabs.hide();
      return;
    }
    $tabs.show();
    var html = '<button class="feed-tab active" data-feed-filter="all" type="button">All</button>';
    cats.forEach(function (cat) {
      html += '<button class="feed-tab" data-feed-filter="' + escapeHtml(cat) + '" type="button">' +
        escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1)) + '</button>';
    });
    $tabs.html(html);
  }

  function updateSyncBar() {
    var $bar = $('#feedSyncBar');
    if (!$bar.length) return;
    var profile = state.profile || {};
    var count = state.posts.length;
    var synced = state.lastSynced ? formatSynced(state.lastSynced) : '—';

    $bar.find('[data-feed-profile-link]').attr('href', profile.url);
    $bar.find('[data-feed-count]').text(count);
    $bar.find('#feedLastSynced').text(synced);
    $bar.find('.feed-sync-count').html(
      count
        ? '<strong data-feed-count>' + count + '</strong> live LinkedIn post' + (count !== 1 ? 's' : '') + ' embedded'
        : '<span class="feed-sync-pending">Waiting for post URLs — see steps below</span>'
    );
    $bar.toggleClass('feed-sync-bar--empty', count === 0);
  }

  function renderFeed() {
    var el = document.getElementById('linkedinFeed');
    if (!el) return;

    var posts = getFilteredPosts().slice(0, state.visible);
    if (!posts.length) {
      el.innerHTML = renderEmptyState();
      $('#loadMoreFeed').hide();
      return;
    }

    el.innerHTML = posts.map(renderEmbedCard).join('');
    var total = getFilteredPosts().length;
    $('#loadMoreFeed').toggle(total > state.visible);
    if (typeof window.revealOnScroll === 'function') window.revealOnScroll();
  }

  function bindEvents() {
    $(document).on('click', '.feed-tab', function () {
      state.filter = $(this).data('feed-filter') || 'all';
      state.visible = PAGE_SIZE;
      $('.feed-tab').removeClass('active');
      $(this).addClass('active');
      renderFeed();
    });

    $('#loadMoreFeed').on('click', function () {
      state.visible += PAGE_SIZE;
      renderFeed();
    });
  }

  function initLinkedInFeed() {
    if (!document.getElementById('linkedinFeed')) return;

    $('#linkedinFeed').html(
      '<div class="feed-loading"><div class="feed-loading-spinner"></div><p>Loading live LinkedIn feed…</p></div>'
    );

    bindEvents();

    loadFeedData()
      .done(function () {
        renderTabs();
        updateSyncBar();
        renderFeed();
      })
      .fail(function () {
        $('#linkedinFeed').html(renderEmptyState());
        updateSyncBar();
      });
  }

  $(initLinkedInFeed);
})(jQuery);
