/*
 * VZG Consult – Sprachumschaltung (Deutsch / Bulgarisch)
 * -------------------------------------------------------
 * Übersetzt zur Laufzeit alle Textknoten der Seite ins Bulgarische. Die
 * Übersetzungen liegen in src/i18n/bg.json (per fetch geladen). Der jeweilige
 * Originaltext wird direkt am Textknoten gesichert, sodass Deutsch jederzeit
 * ohne Verlust wiederhergestellt werden kann.
 *
 * Kein Framework: reines DOM. Attributwerte (placeholder, alt, title,
 * aria-label) werden über Schlüssel mit dem Präfix "@attr:" übersetzt.
 */
(function () {
    'use strict';

    var doc = document;
    var dict = null;
    var loading = null;
    var nodes = null; // Liste aus { node: Text, key: string }
    var current = 'de';

    function pageLanguage() {
        return (doc.documentElement.getAttribute('lang') || 'de').toLowerCase().indexOf('bg') === 0 ? 'bg' : 'de';
    }

    function norm(text) {
        return String(text).replace(/\s+/g, ' ').trim();
    }

    function isSkipped(node) {
        var parent = node.parentNode;
        if (!parent) { return true; }
        var tag = parent.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') { return true; }
        if (!node.nodeValue || !node.nodeValue.replace(/\s+/g, '')) { return true; }
        return false;
    }

    /* Sammelt alle übersetzbaren Textknoten und merkt sich ihren Originaltext. */
    function collectNodes() {
        if (nodes) { return nodes; }
        nodes = [];
        var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
            if (isSkipped(node)) { continue; }
            if (node.__vzgOrig === undefined) {
                node.__vzgOrig = node.nodeValue;
            }
            nodes.push({ node: node, key: norm(node.__vzgOrig) });
        }
        return nodes;
    }

    function applyBulgarian() {
        collectNodes().forEach(function (item) {
            if (!Object.prototype.hasOwnProperty.call(dict, item.key)) { return; }
            var orig = item.node.__vzgOrig;
            var lead = orig.match(/^\s*/)[0];
            var tail = orig.match(/\s*$/)[0];
            item.node.nodeValue = lead + dict[item.key] + tail;
        });
        translateAttributes();
        doc.documentElement.setAttribute('lang', 'bg');
        current = 'bg';
    }

    function restoreGerman() {
        collectNodes().forEach(function (item) {
            item.node.nodeValue = item.node.__vzgOrig;
        });
        restoreAttributes();
        doc.documentElement.setAttribute('lang', 'de');
        current = 'de';
    }

    var ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

    function attrTargets() {
        return doc.querySelectorAll('[placeholder],[alt],[title],[aria-label]');
    }

    function translateAttributes() {
        Array.prototype.forEach.call(attrTargets(), function (el) {
            ATTRS.forEach(function (attr) {
                var val = el.getAttribute(attr);
                if (val === null) { return; }
                if (el.getAttribute('data-vzg-orig-' + attr) === null) {
                    el.setAttribute('data-vzg-orig-' + attr, val);
                }
                var orig = el.getAttribute('data-vzg-orig-' + attr);
                var key = '@attr:' + norm(orig);
                if (Object.prototype.hasOwnProperty.call(dict, key)) {
                    el.setAttribute(attr, dict[key]);
                }
            });
        });
    }

    function restoreAttributes() {
        Array.prototype.forEach.call(attrTargets(), function (el) {
            ATTRS.forEach(function (attr) {
                var orig = el.getAttribute('data-vzg-orig-' + attr);
                if (orig !== null) { el.setAttribute(attr, orig); }
            });
        });
    }

    function loadDictionary() {
        if (dict) { return Promise.resolve(dict); }
        if (loading) { return loading; }
        loading = fetch('i18n/bg.json').then(function (res) {
            if (!res.ok) { throw new Error('Sprachdatei konnte nicht geladen werden.'); }
            return res.json();
        }).then(function (data) {
            dict = data;
            return dict;
        });
        return loading;
    }

    function updateSwitcher(lang) {
        Array.prototype.forEach.call(doc.querySelectorAll('[data-lang-set]'), function (btn) {
            var isActive = btn.getAttribute('data-lang-set') === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function setLanguage(lang) {
        loadDictionary().then(function () {
            if (lang === 'bg') { applyBulgarian(); } else { restoreGerman(); }
            updateSwitcher(lang);
        }).catch(function () {
            /* Sprache nicht verfügbar – Seite bleibt auf Deutsch. */
        });
    }

    function init() {
        Array.prototype.forEach.call(doc.querySelectorAll('[data-lang-set]'), function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                var lang = btn.getAttribute('data-lang-set');
                if (lang === current) { return; }
                setLanguage(lang);
                try { window.localStorage.setItem('vzg-lang', lang); } catch (e) { /* kein Speicher */ }
            });
        });

        var saved = null;
        try { saved = window.localStorage.getItem('vzg-lang'); } catch (e) { /* kein Speicher */ }
        var initial = saved || pageLanguage();
        if (initial === 'bg' && current !== 'bg') {
            setLanguage('bg');
        } else {
            updateSwitcher('de');
        }
    }

    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
