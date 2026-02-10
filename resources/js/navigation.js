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

    // Sidebar navigation toggle (for mobile)
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.sidebar-nav');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav__link');
    let sidebarBackdrop = null;

    if (sidebarToggle && sidebar) {
      // Create backdrop element
      sidebarBackdrop = document.createElement('div');
      sidebarBackdrop.className = 'sidebar-nav__backdrop';
      document.body.appendChild(sidebarBackdrop);

      // Toggle sidebar
      sidebarToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('sidebar-nav--open');

        if (isOpen) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });

      // Close sidebar when clicking a link
      sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            closeSidebar();
          }
        });
      });

      // Close sidebar when clicking backdrop
      sidebarBackdrop.addEventListener('click', () => {
        closeSidebar();
      });

      // Close sidebar on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('sidebar-nav--open')) {
          closeSidebar();
        }
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
          closeSidebar();
        }
      });

      function openSidebar() {
        sidebar.classList.add('sidebar-nav--open');
        sidebarBackdrop.classList.add('active');
        sidebarToggle.setAttribute('aria-expanded', 'true');
        if (window.innerWidth < 768) {
          document.body.style.overflow = 'hidden';
        }
      }

      function closeSidebar() {
        sidebar.classList.remove('sidebar-nav--open');
        sidebarBackdrop.classList.remove('active');
        sidebarToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    // Set active sidebar link state
    const sidebarNavLinks = document.querySelectorAll('.sidebar-nav__link');
    if (sidebarNavLinks.length > 0) {
      const currentPath = window.location.pathname;

      sidebarNavLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;

        // Match exact path or section
        if (currentPath === linkPath ||
            (linkPath !== '/' && currentPath.startsWith(linkPath))) {
          link.classList.add('sidebar-nav__link--active');
          link.setAttribute('aria-current', 'page');
        }
      });
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
