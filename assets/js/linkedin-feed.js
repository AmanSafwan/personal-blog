'use strict';

/**
 * Native LinkedIn-style feed, real post text & images synced from post URLs.
 * Data: data/linkedin-feed.json (run: node scripts/sync-linkedin-posts.mjs)
 */
(function ($) {
  var FEED_PATH = 'data/linkedin-feed.json';
  var PAGE_SIZE = 4;
  var TEXT_CLAMP = 420;

  var state = {
    profile: null,
    posts: [],
    filter: 'all',
    visible: PAGE_SIZE,
    lastSynced: null
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

  function formatTimeAgo(iso) {
    try {
      var then = new Date(iso).getTime();
      var now = Date.now();
      var diff = Math.max(0, now - then);
      var mins = Math.floor(diff / 60000);
      if (mins < 60) return mins <= 1 ? 'Just now' : mins + 'm';
      var hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h';
      var days = Math.floor(hrs / 24);
      if (days < 7) return days + 'd';
      var weeks = Math.floor(days / 7);
      if (weeks < 5) return weeks + 'w';
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
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
        return p.text || p.image;
      });
      state.lastSynced = data.lastSynced;
      state.mode = data.mode || 'native-feed';
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

  function linkifyText(text) {
    var safe = escapeHtml(text || '');
    safe = safe.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    safe = safe.replace(
      /(lnkd\.in\/[^\s<]+)/g,
      '<a href="https://$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return safe;
  }

  function renderHashtags(tags) {
    if (!tags || !tags.length) return '';
    return (
      '<div class="feed-tags">' +
      tags
        .map(function (t) {
          return '<span>#' + escapeHtml(t) + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function renderPostBody(post) {
    var text = post.text || '';
    var long = text.length > TEXT_CLAMP;
    var display = long ? text.slice(0, TEXT_CLAMP).trim() + '…' : text;
    var html = '<div class="feed-card-body"><div class="feed-card-text">';
    html += '<span class="feed-text-visible">' + linkifyText(display) + '</span>';
    if (long) {
      html +=
        '<span class="feed-text-full">' + linkifyText(text) + '</span>' +
        '<button type="button" class="feed-see-more" data-action="expand" aria-expanded="false">See more</button>';
    }
    html += renderHashtags(post.hashtags) + '</div></div>';
    return html;
  }

  function renderPostCard(post, index) {
    var profile = state.profile || {};
    var avatar = profile.avatar || 'assets/img/profile/aman-safwan.png';
    var cat = post.category
      ? post.category.charAt(0).toUpperCase() + post.category.slice(1)
      : 'Post';
    var timeAgo = formatTimeAgo(post.publishedAt);
    var imageBlock = '';

    if (post.image) {
      imageBlock =
        '<a class="feed-card-image-link image-popup" href="' +
        escapeHtml(post.image) +
        '" data-caption="' +
        escapeHtml(post.imageAlt || post.text || 'LinkedIn post') +
        '">' +
        '<img class="feed-card-image" src="' +
        escapeHtml(post.image) +
        '" alt="' +
        escapeHtml(post.imageAlt || 'Post image') +
        '" loading="lazy" decoding="async">' +
        '</a>';
    }

    return (
      '<article class="feed-card feed-card--native reveal-on-scroll" data-feed-id="' +
      escapeHtml(post.id) +
      '" data-category="' +
      escapeHtml(post.category || 'all') +
      '" style="animation-delay:' +
      index * 0.05 +
      's">' +
      '<header class="feed-card-header">' +
      '<img class="feed-avatar" src="' +
      escapeHtml(avatar) +
      '" alt="' +
      escapeHtml(profile.name || 'Aman Safwan') +
      '" width="48" height="48" loading="lazy">' +
      '<div class="feed-author">' +
      '<h4>' +
      escapeHtml(profile.name || 'Aman Safwan Bin Musliyadi') +
      ' <i class="fa fa-linkedin-square feed-li-badge" aria-hidden="true"></i></h4>' +
      '<span class="feed-author-meta">' +
      escapeHtml(profile.headline || 'SMSKPP · UniSZA FIK') +
      '</span>' +
      '<span class="feed-post-time">' +
      timeAgo +
      ' · <i class="fa fa-globe" aria-hidden="true"></i></span>' +
      '</div>' +
      '<span class="feed-badge">' +
      escapeHtml(cat) +
      '</span>' +
      '</header>' +
      renderPostBody(post) +
      imageBlock +
      '<div class="feed-card-stats">' +
      '<span class="feed-stat-reactions"><i class="fa fa-thumbs-up"></i> React on LinkedIn</span>' +
      '<span class="feed-stat-comments">View comments</span>' +
      '</div>' +
      '<div class="feed-card-actions">' +
      '<button type="button" class="feed-action" data-action="like" aria-label="Like"><i class="fa fa-thumbs-o-up"></i> Like</button>' +
      '<a class="feed-action" href="' +
      escapeHtml(post.postUrl) +
      '" target="_blank" rel="noopener noreferrer"><i class="fa fa-comment-o"></i> Comment</a>' +
      '<a class="feed-action" href="' +
      escapeHtml(post.postUrl) +
      '" target="_blank" rel="noopener noreferrer"><i class="fa fa-share"></i> Share</a>' +
      '</div>' +
      '<footer class="feed-card-footer">' +
      '<a href="' +
      escapeHtml(post.postUrl) +
      '" target="_blank" rel="noopener noreferrer"><i class="fa fa-linkedin"></i> View original post on LinkedIn</a>' +
      '</footer>' +
      '</article>'
    );
  }

  function renderEmptyState() {
    var profile = state.profile || {};
    var activityUrl = profile.activityUrl || profile.url;
    return (
      '<div class="feed-empty feed-empty--live">' +
      '<div class="feed-empty-icon"><i class="fa fa-linkedin"></i></div>' +
      '<h3>Sync your LinkedIn posts</h3>' +
      '<p>Add post URLs to <code>data/linkedin-post-urls.json</code>, then run <code>node scripts/sync-linkedin-posts.mjs</code> to pull real text and images.</p>' +
      '<ol class="feed-setup-steps">' +
      '<li>Open <a href="' +
      escapeHtml(activityUrl) +
      '" target="_blank" rel="noopener noreferrer">your LinkedIn activity</a></li>' +
      '<li>Copy link to post → paste into <code>linkedin-post-urls.json</code></li>' +
      '<li>Run the sync script and refresh this page</li>' +
      '</ol>' +
      '<div class="feed-empty-actions">' +
      '<a class="site-btn linkedin-btn" href="' +
      escapeHtml(profile.url || 'https://www.linkedin.com/in/amansafwan/') +
      '" target="_blank" rel="noopener noreferrer"><i class="fa fa-linkedin"></i> View LinkedIn Profile</a>' +
      '</div>' +
      '</div>'
    );
  }

  function renderComposer() {
    var profile = state.profile || {};
    var $composer = $('#feedComposer');
    if (!$composer.length) return;
    $composer.html(
      '<img src="' +
      escapeHtml(profile.avatar || 'assets/img/profile/aman-safwan.png') +
      '" alt="" width="48" height="48">' +
      '<div class="feed-composer-text">' +
      '<strong>' +
      escapeHtml(profile.name || 'Aman Safwan') +
      '</strong>' +
      '<p>Posts synced from my real LinkedIn profile, same content &amp; photos.</p>' +
      '</div>' +
      '<a href="contact.html" class="site-btn sb-color">Message Me</a>'
    );
  }

  function renderTabs() {
    var cats = getCategories();
    var $tabs = $('.feed-tabs');
    if (!cats.length || !state.posts.length) {
      $tabs.attr('hidden', true).hide();
      return;
    }
    $tabs.removeAttr('hidden').show();
    var html = '<button class="feed-tab active" data-feed-filter="all" type="button">All Posts</button>';
    cats.forEach(function (cat) {
      html +=
        '<button class="feed-tab" data-feed-filter="' +
        escapeHtml(cat) +
        '" type="button">' +
        escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1)) +
        '</button>';
    });
    $tabs.html(html);
  }

  function updateSyncBar() {
    var $bar = $('#feedSyncBar');
    if (!$bar.length) return;
    var profile = state.profile || {};
    var count = state.posts.length;
    var withImages = state.posts.filter(function (p) {
      return p.image;
    }).length;
    var synced = state.lastSynced ? formatSynced(state.lastSynced) : '-';

    $bar.find('[data-feed-profile-link]').attr('href', profile.url);
    $bar.find('#feedLastSynced').text(synced);
    $bar.find('.feed-sync-count').html(
      count
        ? '<strong>' +
          count +
          '</strong> posts synced · <strong>' +
          withImages +
          '</strong> with original photos'
        : '<span class="feed-sync-pending">No posts synced yet</span>'
    );
    if (profile.followers) {
      $bar.find('[data-feed-followers]').text(profile.followers);
    }
    $bar.toggleClass('feed-sync-bar--empty', count === 0);
  }

  function initFeedInteractions() {
    if ($.fn.magnificPopup) {
      $('#linkedinFeed .image-popup').magnificPopup({
        type: 'image',
        gallery: { enabled: true },
        mainClass: 'mfp-fade'
      });
    }
  }

  function showToast(msg) {
    var $t = $('#feedToast');
    if (!$t.length) {
      $t = $('<div id="feedToast" class="feed-toast" role="status"></div>').appendTo('body');
    }
    $t.text(msg).addClass('is-visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      $t.removeClass('is-visible');
    }, 2200);
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

    el.innerHTML = posts.map(renderPostCard).join('');
    var total = getFilteredPosts().length;
    $('#loadMoreFeed').toggle(total > state.visible);
    initFeedInteractions();
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

    $(document).on('click', '.feed-see-more', function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $wrap = $btn.closest('.feed-card-text');
      var expanded = $wrap.toggleClass('is-expanded').hasClass('is-expanded');
      $btn.text(expanded ? 'See less' : 'See more').attr('aria-expanded', expanded);
    });

    $(document).on('click', '.feed-action[data-action="like"]', function () {
      var $btn = $(this);
      $btn.toggleClass('liked');
      var liked = $btn.hasClass('liked');
      $btn.find('i')
        .toggleClass('fa-thumbs-o-up', !liked)
        .toggleClass('fa-thumbs-up', liked);
      showToast(liked ? 'Saved, react on LinkedIn for the real count' : 'Like removed');
    });
  }

  function initLinkedInFeed() {
    if (!document.getElementById('linkedinFeed')) return;

    $('#linkedinFeed').html(
      '<div class="feed-loading"><div class="feed-loading-spinner"></div><p>Loading your LinkedIn posts…</p></div>'
    );

    bindEvents();

    loadFeedData()
      .done(function () {
        renderComposer();
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
