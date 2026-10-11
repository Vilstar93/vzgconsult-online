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
