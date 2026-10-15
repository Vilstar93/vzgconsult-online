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
    var dateInput = document.getElementById('date');
    var timeSelect = document.getElementById('time');
    var phoneTime = document.getElementById('phoneTime');
    var phoneTimeHint = document.getElementById('phoneTimeHint');
    var phoneService = 'Erstberatung Energie';
    if (dateInput) {
        var today = new Date();
        dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    }

    function updateAppointmentFields() {
        var isPhone = serviceSelect && serviceSelect.value === phoneService;
        if (timeSelect && phoneTime) {
            timeSelect.classList.toggle('d-none', isPhone);
            timeSelect.disabled = isPhone;
            phoneTime.classList.toggle('d-none', !isPhone);
            phoneTime.disabled = !isPhone;
            phoneTime.required = isPhone;
        }
        if (phoneTimeHint) {
            phoneTimeHint.classList.toggle('d-none', !isPhone);
        }
    }

    function updatePrice() {
        if (!serviceSelect || !priceEl) {
            return;
        }
        var option = serviceSelect.options[serviceSelect.selectedIndex];
        if (option && option.getAttribute('data-price')) {
            priceEl.textContent = option.getAttribute('data-price');
        }
        updateAppointmentFields();
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
        if (data.service === phoneService) {
            var appointment = new Date(data.date + 'T' + data.phoneTime);
            if (!Number.isFinite(appointment.getTime()) || appointment.getTime() < Date.now() + 2 * 60 * 60 * 1000) {
                showConfirmation('Bitte wählen Sie einen Termin, der mindestens zwei Stunden in der Zukunft liegt.');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Verbindlich buchen';
                }
                return;
            }
            data.startAt = appointment.toISOString();
            data.time = data.phoneTime;
        }
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
