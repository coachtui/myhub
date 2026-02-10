/**
 * Dark Mode Theme Toggle
 * Handles theme switching with localStorage persistence
 */

(function() {
  'use strict';

  // Check for saved preference or system preference
  function getInitialTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      return savedTheme;
    }

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  }

  // Apply theme immediately to prevent flash
  const theme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', theme);

  // Toggle function
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Announce to screen readers
    const announcement = newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    announceToScreenReader(announcement);
  }

  // Announce changes to screen readers
  function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Attach to toggle button when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('[data-theme-toggle]');

    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);

      // Add keyboard support
      toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    });
  });
})();
