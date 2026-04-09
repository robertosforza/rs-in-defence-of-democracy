/**
 * Academic Portfolio — script.js
 * ============================================================
 * Handles all JavaScript interactions for both pages:
 *   1. Navbar scroll-elevation effect
 *   2. Mobile navigation toggle
 *   3. Abstract panel expand / collapse
 *   4. PDF viewer dynamic height (fills available viewport)
 *   5. Fullscreen viewer toggle
 *   6. PDF loading state overlay
 *
 * No dependencies. Vanilla JS only. Works in all modern browsers.
 * ============================================================
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITY HELPERS
     ============================================================ */

  /** Get element by id (short alias) */
  function $id(id) {
    return document.getElementById(id);
  }

  /** Get first element matching selector */
  function $qs(sel) {
    return document.querySelector(sel);
  }

  /** Get all elements matching selector */
  function $all(sel) {
    return document.querySelectorAll(sel);
  }


  /* ============================================================
     1. NAVBAR — SCROLL ELEVATION
     Adds .scrolled class when page scrolls past a threshold.
     CSS transitions the nav background from transparent-glass to opaque.
     ============================================================ */

  var navbar = $id('navbar');

  function updateNavElevation() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 6);
  }

  if (navbar) {
    window.addEventListener('scroll', updateNavElevation, { passive: true });
    updateNavElevation(); // run once on page load
  }


  /* ============================================================
     2. MOBILE NAVIGATION TOGGLE
     Shows/hides .nav-links on narrow viewports.
     Also closes when a link is clicked or user clicks outside nav.
     ============================================================ */

  var navToggle = $id('navToggle');
  var navLinks  = $id('navLinks');

  function closeMobileNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navLinks) {

    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when a nav link is clicked
    $all('.nav-link').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });

    // Close when clicking anywhere outside the nav
    document.addEventListener('click', function (e) {
      if (navbar && !navbar.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });

  }


  /* ============================================================
     3. ABSTRACT PANEL — EXPAND / COLLAPSE
     Toggles .is-open on both the trigger button and the panel.
     CSS grid-template-rows trick enables smooth height animation
     without needing to know the content height in advance.
     After toggling, recalculates viewer height (see §4).
     ============================================================ */

  var abstractTrigger = $id('abstractTrigger');
  var abstractPanel   = $id('abstractPanel');

  if (abstractTrigger && abstractPanel) {

    abstractTrigger.addEventListener('click', function () {
      var isOpen = abstractPanel.classList.toggle('is-open');
      abstractTrigger.classList.toggle('is-open', isOpen);
      abstractTrigger.setAttribute('aria-expanded', String(isOpen));

      // After the CSS transition finishes (~420ms), recalculate viewer height
      // so it adjusts to the new abstract panel size
      setTimeout(setViewerHeight, 450);
    });

  }


  /* ============================================================
     4. PDF VIEWER — DYNAMIC HEIGHT
     Calculates the remaining viewport height after all other
     fixed/static elements (nav, header, abstract, chrome, footer)
     and applies it to .viewer-frame so the PDF fills the screen.
     Recalculates on window resize and after abstract toggles.
     ============================================================ */

  var viewerFrame = $id('viewerFrame');

  function setViewerHeight() {
    if (!viewerFrame) return;

    var wh = window.innerHeight;

    // Measure each contributing element's height
    var navEl      = $id('navbar');
    var headerEl   = $id('docHeader');
    var absEl      = $id('abstractBar');
    var chromeEl   = $qs('.viewer-chrome');
    var footerEl   = $qs('.site-footer');
    var sectionEl  = $id('viewerSection');

    var navH    = navEl      ? navEl.offsetHeight      : 64;
    var headerH = headerEl   ? headerEl.offsetHeight   : 0;
    var absH    = absEl      ? absEl.offsetHeight      : 0;
    var chromeH = chromeEl   ? chromeEl.offsetHeight   : 44;
    var footerH = footerEl   ? footerEl.offsetHeight   : 52;

    // viewer-section has 1.5rem (24px) padding top + 1.5rem bottom = 48px total
    // (see .viewer-section { padding: 1.5rem 2rem } in style.css)
    var sectionPad = sectionEl
      ? parseFloat(getComputedStyle(sectionEl).paddingTop)
        + parseFloat(getComputedStyle(sectionEl).paddingBottom)
      : 48;

    var computed = wh - navH - headerH - absH - chromeH - footerH - sectionPad;

    // Minimum height: 420px desktop, 55vh mobile (prevents viewer being tiny on small screens)
    var isMobile = window.innerWidth < 768;
    var minH = isMobile ? Math.round(wh * 0.55) : 420;

    viewerFrame.style.height = Math.max(computed, minH) + 'px';
  }

  if (viewerFrame) {
    // Resize on window resize
    window.addEventListener('resize', setViewerHeight, { passive: true });

    // Run on initial load — use double rAF to ensure layout has settled
    // (fonts, images, and browser chrome all affect element heights)
    function runInitialResize() {
      requestAnimationFrame(function () {
        requestAnimationFrame(setViewerHeight);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInitialResize);
    } else {
      runInitialResize();
    }

    // Also run after window fully loads (fonts, etc.)
    window.addEventListener('load', setViewerHeight, { once: true });
  }


  /* ============================================================
     5. FULLSCREEN VIEWER TOGGLE
     Requests fullscreen on .viewer-container (chrome + frame).
     Falls back gracefully if the browser blocks fullscreen API.
     In fullscreen, forces the frame to fill 100% of available height.
     ============================================================ */

  var fullscreenBtn      = $id('fullscreenBtn');
  var viewerContainer    = $qs('.viewer-container');

  if (fullscreenBtn && viewerContainer) {

    fullscreenBtn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        viewerContainer.requestFullscreen().catch(function (err) {
          // Fullscreen may be blocked by browser/OS — fail silently
          console.info('[Academic Portfolio] Fullscreen unavailable:', err.message);
        });
      } else {
        document.exitFullscreen();
      }
    });

    // Respond to fullscreen state changes (including user pressing Escape)
    document.addEventListener('fullscreenchange', function () {
      var isFullscreen = !!document.fullscreenElement;

      fullscreenBtn.setAttribute(
        'aria-label',
        isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen viewer'
      );

      if (!isFullscreen) {
        // Restore calculated height when exiting fullscreen
        setViewerHeight();
      }
    });

  }


  /* ============================================================
     6. PDF LOADING STATE
     Adds .is-loading to the viewer frame when the page loads,
     then removes it once the iframe fires its load event.
     CSS uses ::before / ::after pseudo-elements to show a
     loading overlay and "Loading document…" text.
     ============================================================ */

  var pdfEmbed = $id('pdfEmbed');

  if (pdfEmbed && viewerFrame) {

    // Add loading class immediately
    viewerFrame.classList.add('is-loading');

    function removeLoadingState() {
      viewerFrame.classList.remove('is-loading');
    }

    // Remove when iframe loads
    pdfEmbed.addEventListener('load', removeLoadingState, { once: true });

    // Fail-safe: remove after 5 seconds regardless
    // (Some browsers don't fire load on cross-origin iframes even when loaded)
    setTimeout(removeLoadingState, 5000);

  }


})(); // end IIFE
