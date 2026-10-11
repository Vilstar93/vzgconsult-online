/*!
* Start Bootstrap - VZG Consult v1.0.0 (https://startbootstrap.com/theme/business-casual)
* Copyright 2013-2026 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/vzg-consult-website/blob/master/LICENSE)
*/
// Marks the current page in the navigation and highlights today's hours
window.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#mainNav .nav-link').forEach((link) => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.closest('.nav-item').classList.add('active');
        }
    });
});
