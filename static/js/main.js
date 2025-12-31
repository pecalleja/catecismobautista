/**
 * El Catecismo Bautista - Main JavaScript
 */

(function () {
    'use strict';

    // Google Analytics helper
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    }

    // Theme Toggle
    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Track theme change
            trackEvent('theme_toggle', { theme: newTheme });
        });
    }

    // Keyboard Navigation
    function initKeyboardNav() {
        document.addEventListener('keydown', function (e) {
            // Only on question pages
            const prevLink = document.querySelector('.nav-prev');
            const nextLink = document.querySelector('.nav-next');

            if (e.key === 'ArrowLeft' && prevLink && !isInputFocused()) {
                trackEvent('keyboard_nav', { direction: 'previous' });
                prevLink.click();
            } else if (e.key === 'ArrowRight' && nextLink && !isInputFocused()) {
                trackEvent('keyboard_nav', { direction: 'next' });
                nextLink.click();
            }
        });
    }

    function isInputFocused() {
        const active = document.activeElement;
        return (
            active &&
            (active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable)
        );
    }

    // Smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });

                    // Update URL without jumping
                    history.pushState(null, null, '#' + targetId);
                }
            });
        });
    }

    // Handle hash on page load (for group links)
    function initHashHandler() {
        if (window.location.hash) {
            const targetId = window.location.hash.slice(1);
            const target = document.getElementById(targetId);

            if (target) {
                // Ensure the group is expanded
                const groupContent = target.querySelector('.group-content');
                const groupToggle = target.querySelector('.group-toggle');

                if (groupContent && groupToggle) {
                    groupContent.classList.remove('collapsed');
                    groupToggle.setAttribute('aria-expanded', 'true');
                }

                // Scroll after a short delay to ensure layout is complete
                setTimeout(function () {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }, 100);
            }
        }
    }

    // Cookie Consent
    function initCookieConsent() {
        const banner = document.getElementById('cookie-consent');
        const acceptBtn = document.getElementById('cookie-accept');
        const rejectBtn = document.getElementById('cookie-reject');

        if (!banner) return;

        // Check if user already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (consent) {
            banner.style.display = 'none';
            return;
        }

        // Show banner
        banner.style.display = 'flex';
        banner.setAttribute('aria-hidden', 'false');

        // Accept button
        acceptBtn.addEventListener('click', function () {
            localStorage.setItem('cookie-consent', 'accepted');
            banner.style.display = 'none';
            banner.setAttribute('aria-hidden', 'true');

            // Load Google Analytics
            if (typeof loadGoogleAnalytics === 'function') {
                loadGoogleAnalytics();
            }
        });

        // Reject button
        rejectBtn.addEventListener('click', function () {
            localStorage.setItem('cookie-consent', 'rejected');
            banner.style.display = 'none';
            banner.setAttribute('aria-hidden', 'true');
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        initThemeToggle();
        initKeyboardNav();
        initSmoothScroll();
        initHashHandler();
        initCookieConsent();
    });
})();
