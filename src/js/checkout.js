/*
 * VZG Consult – Checkout / Zahlungsintegration
 * -------------------------------------------------------------------
 * Diese Datei verbindet das Buchungsformular mit einem Zahlungs-Endpunkt.
 * Der Vercel-Endpunkt baut einen Shopify Cart-Permalink. Es wird kein API-Token
 * benötigt; bezahlt wird anschließend im gehosteten Shopify Checkout.
 */
(function () {
    'use strict';

    var form = document.getElementById('bookingForm');
    if (!form) {
        return;
    }

    var serviceSelect = document.getElementById('service');
    var priceEl = document.getElementById('selectedPrice');

    function updatePrice() {
        if (!serviceSelect || !priceEl) {
            return;
        }
        var option = serviceSelect.options[serviceSelect.selectedIndex];
        if (option && option.getAttribute('data-price')) {
            priceEl.textContent = option.getAttribute('data-price');
        }
    }

    if (serviceSelect) {
        serviceSelect.addEventListener('change', updatePrice);
        updatePrice();
    }

    // Klick auf eine Preis-Karte: passende Leistung im Termin-Formular vorwählen.
    var params = new URLSearchParams(window.location.search);
    var preselect = params.get('service');
    if (preselect && serviceSelect) {
        Array.prototype.forEach.call(serviceSelect.options, function (option) {
            if (option.value === preselect) {
                serviceSelect.value = preselect;
            }
        });
        updatePrice();
    }

    function showConfirmation(message) {
        var target = form.getAttribute('data-thank-you');
        var container = target ? document.querySelector(target) : null;
        var successMessage =
            message ||
            'Ihre Buchungsanfrage ist bei uns eingegangen. Wir senden Ihnen in Kürze eine Bestätigung.';
        if (container) {
            var alert = container.querySelector('.alert');
            if (alert) {
                alert.textContent = successMessage;
                alert.classList.remove('d-none');
            }
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            window.alert(successMessage);
        }
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        var checkoutUrl = form.getAttribute('data-checkout-url');
        if (!checkoutUrl) {
            // Demo-Modus: kein Zahlungsanbieter konfiguriert.
            showConfirmation();
            form.reset();
            updatePrice();
            return;
        }

        var submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Wird verarbeitet …';
        }

        var data = {};
        new FormData(form).forEach(function (value, key) {
            data[key] = value;
        });
        fetch(checkoutUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                if (result && result.url) {
                    window.location.href = result.url;
                    return;
                }
                showConfirmation(
                    result && result.message
                        ? result.message
                        : 'Ihre Buchungsanfrage ist bei uns eingegangen.'
                );
                form.reset();
                updatePrice();
            })
            .catch(function () {
                showConfirmation('Der Shopify Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
            })
            .finally(function () {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Verbindlich buchen';
                }
            });
    });
})();
