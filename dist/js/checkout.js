/*
 * VZG Consult – Checkout / Zahlungsintegration
 * -------------------------------------------------------------------
 * Diese Datei verbindet das Buchungsformular mit einem Zahlungs-Endpunkt.
 * Sie ist bewusst ohne API-Schlüssel: Die Zahlung wird serverseitig erzeugt
 * (Stripe Checkout / Payment Link), damit keine Secrets im Browser landen.
 *
 * SO AKTIVIEREN SIE DIE ONLINE-ZAHLUNG:
 *   1. Zahlungsanbieter wählen (z. B. Stripe – siehe PAYMENTS.md).
 *   2. Auf der Buchungsseite am <form> das Attribut `data-checkout-url`
 *      auf Ihren Endpunkt setzen, z. B.:
 *         data-checkout-url="/api/create-checkout-session"
 *      Der Endpunkt erhält die Formulardaten als JSON und gibt zurück:
 *         { "url": "https://checkout.stripe.com/..." }
 *   3. Ohne `data-checkout-url` läuft das Formular im Demo-Modus:
 *      Es wird keine Zahlung ausgelöst, nur eine Bestätigung angezeigt.
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
        var payNow =
            form.querySelector('input[name="payment"]:checked') &&
            form.querySelector('input[name="payment"]:checked').value === 'online';

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
        data.payNow = payNow;

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
                showConfirmation(
                    'Ihre Anfrage konnte nicht automatisch verarbeitet werden. Bitte kontaktieren Sie uns telefonisch unter 015750171967.'
                );
            })
            .finally(function () {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Verbindlich buchen';
                }
            });
    });
})();
