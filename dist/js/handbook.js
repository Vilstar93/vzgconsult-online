/*
 * VZG Consult – Kauf und Download des digitalen Ratgebers.
 * ------------------------------------------------------------------
 * Kauf: Klick auf „Jetzt kaufen" erzeugt serverseitig eine Zahlung
 * (/api/buy-handbook) und leitet zum gehosteten Checkout weiter.
 * Download: /download.html?order=<token> prüft die Zahlung und lädt das PDF.
 */
(function () {
    'use strict';

    function status(message, isError) {
        var alert = document.querySelector('[data-buy-status]');
        if (!alert) {
            window.alert(message);
            return;
        }
        alert.textContent = message;
        alert.classList.remove('d-none', 'alert-success', 'alert-warning');
        alert.classList.add(isError ? 'alert-warning' : 'alert-success');
        alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    var buyButton = document.querySelector('.js-buy-handbook');
    if (buyButton) {
        buyButton.addEventListener('click', function (event) {
            event.preventDefault();
            buyButton.disabled = true;
            var original = buyButton.textContent;
            buyButton.textContent = 'Wird vorbereitet …';

            fetch('/api/buy-handbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: buyButton.getAttribute('data-slug') })
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (result) {
                    if (result && result.url) {
                        window.location.href = result.url;
                        return;
                    }
                    status(
                        (result && result.message) || 'Der Kauf konnte nicht gestartet werden.',
                        true
                    );
                })
                .catch(function () {
                    status('Der Kauf konnte nicht gestartet werden. Bitte später erneut versuchen.', true);
                })
                .finally(function () {
                    buyButton.disabled = false;
                    buyButton.textContent = original;
                });
        });
    }

    var downloadBox = document.getElementById('downloadBox');
    if (downloadBox) {
        var params = new URLSearchParams(window.location.search);
        var token = params.get('order') || '';
        var loading = document.getElementById('downloadLoading');
        var ready = document.getElementById('downloadReady');
        var error = document.getElementById('downloadError');
        var link = document.getElementById('downloadLink');

        function fail() {
            if (loading) { loading.classList.add('d-none'); }
            if (error) { error.classList.remove('d-none'); }
        }

        if (!token) {
            fail();
        } else {
            fetch('/api/download?order=' + encodeURIComponent(token), { method: 'HEAD' })
                .then(function (response) {
                    if (!response.ok) { throw new Error('not ready'); }
                    if (loading) { loading.classList.add('d-none'); }
                    if (ready) { ready.classList.remove('d-none'); }
                    if (link) {
                        link.href = '/api/download?order=' + encodeURIComponent(token);
                    }
                })
                .catch(fail);
        }
    }
})();
