/**
 * Navigation Enhancements
 * Mobile menu toggle and scroll effects
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    const navMobileLinks = document.querySelectorAll('.nav-mobile__link');

    if (navToggle && navMobile) {
      // Toggle menu
      navToggle.addEventListener('click', () => {
        const isOpen = navToggle.classList.contains('open');

        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      // Close menu when clicking a link
      navMobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          closeMenu();
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (navMobile.classList.contains('open')) {
          if (!navMobile.contains(e.target) && !navToggle.contains(e.target)) {
            closeMenu();
          }
        }
      });

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMobile.classList.contains('open')) {
          closeMenu();
        }
      });

      function openMenu() {
        navToggle.classList.add('open');
        navMobile.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }

      function closeMenu() {
        navToggle.classList.remove('open');
        navMobile.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    // Scroll effect for navigation
    const navGlobal = document.querySelector('.nav-global');

    if (navGlobal) {
      let lastScroll = 0;

      window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 20) {
          navGlobal.classList.add('scrolled');
        } else {
          navGlobal.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
      });
    }

    // Set active navigation state
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-global__link, .nav-mobile__link');

    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;

      // Match exact path or section
      if (currentPage === linkPath ||
          (linkPath !== '/' && currentPage.startsWith(linkPath))) {
        link.setAttribute('aria-current', 'page');
      }
    });
  });
})();
