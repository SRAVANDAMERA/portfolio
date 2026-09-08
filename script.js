(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ------------------------------------------------------------------
     Theme toggle (light / dark) — persisted in localStorage
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var THEME_KEY = "sravan-portfolio-theme";

  function getPreferredTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (e) {
      stored = null;
    }
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      themeToggle.setAttribute("aria-pressed", "true");
      themeToggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      root.removeAttribute("data-theme");
      themeToggle.setAttribute("aria-pressed", "false");
      themeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  applyTheme(getPreferredTheme());

  themeToggle.addEventListener("click", function () {
    var isDark = root.getAttribute("data-theme") === "dark";
    var next = isDark ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* localStorage unavailable — theme just won't persist */
    }
  });

  /* Follow system preference changes only if the user hasn't chosen manually */
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var hasManualPref = false;
      try {
        hasManualPref = localStorage.getItem(THEME_KEY) !== null;
      } catch (err) {
        hasManualPref = false;
      }
      if (!hasManualPref) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll progress bar
     ------------------------------------------------------------------ */
  var progressBar = document.getElementById("progressBar");
  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  }

  /* ------------------------------------------------------------------
     Sticky nav + active section tracking
     ------------------------------------------------------------------ */
  var nav = document.getElementById("siteNav");
  var navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");
  var sections = ["about", "stack", "work", "education", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function updateNavScrollState() {
    if (window.scrollY > 12) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }

  function updateActiveSection() {
    var current = null;
    var offset = 120;
    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= offset && rect.bottom >= offset) {
        current = section.id;
      }
    });
    navLinks.forEach(function (link) {
      var isActive = link.dataset.section === current;
      link.classList.toggle("is-active", isActive);
    });
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        updateNavScrollState();
        updateActiveSection();
        updateProjectNav();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  navToggle.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    });
  });

  /* ------------------------------------------------------------------
     Reveal on scroll (IntersectionObserver)
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = Math.min(i * 60, 240);
            setTimeout(function () {
              el.classList.add("is-visible");
            }, delay);
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------
     Project side navigator — active state on scroll
     ------------------------------------------------------------------ */
  var projectNavLinks = document.querySelectorAll(".project-nav a");
  var projectSections = document.querySelectorAll(".project");

  function updateProjectNav() {
    if (!projectSections.length) return;
    var current = null;
    projectSections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
        current = section.id.split("-")[1];
      }
    });
    projectNavLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.project === current);
    });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons (desktop only)
     ------------------------------------------------------------------ */
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + (x * 0.18) + "px, " + (y * 0.28) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ------------------------------------------------------------------
     Custom cursor ring (desktop only)
     ------------------------------------------------------------------ */
  var cursorRing = document.getElementById("cursorRing");
  if (!isTouchDevice) {
    var ringX = 0, ringY = 0, targetX = 0, targetY = 0;

    window.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      cursorRing.classList.add("is-active");
    });
    document.addEventListener("mouseleave", function () {
      cursorRing.classList.remove("is-active");
    });

    function animateRing() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      cursorRing.style.left = ringX + "px";
      cursorRing.style.top = ringY + "px";
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll("a, button, .stack-item").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursorRing.classList.add("is-large"); });
      el.addEventListener("mouseleave", function () { cursorRing.classList.remove("is-large"); });
    });
  } else {
    cursorRing.style.display = "none";
  }

  /* ------------------------------------------------------------------
     Copy-to-clipboard for email / phone
     ------------------------------------------------------------------ */
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 1800);
  }

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.dataset.copy;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          showToast("Copied");
        }).catch(function () {
          showToast("Copy failed");
        });
      } else {
        showToast("Copy failed");
      }
    });
  });

})();