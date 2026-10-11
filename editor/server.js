'use strict';

/*
 * VZG Consult – visueller Drag-and-Drop-Editor (GrapesJS)
 * ------------------------------------------------------------------
 * Öffnet die gebauten Seiten (dist/*.html) in einem visuellen Editor
 * (wie Webador), speichert Änderungen nach content/pages/<slug>.html
 * und baut daraus die Website neu (npm run build).
 *
 * Start:  cd editor && npm install && npm start
 * Öffnen: http://localhost:4500
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { execFile } = require('child_process');

// editor/.env laden (GIT_PUSH_TOKEN, EDITOR_PASSWORD, ...) – optional.
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content', 'pages');
const PORT = process.env.EDITOR_PORT || 4500;

// Passwortschutz (optional): EDITOR_PASSWORD in der Umgebung setzen.
const PASSWORD = process.env.EDITOR_PASSWORD || '';

// Verwaltbare Seiten: Slug -> Titel + Quelldatei (Pug).
const PAGES = {
    'index': { title: 'Startseite', pug: 'src/pug/index.pug' },
    'leistungen': { title: 'Leistungen', pug: 'src/pug/leistungen.pug' },
    'ueber-uns': { title: 'Über uns', pug: 'src/pug/ueber-uns.pug' },
    'preise': { title: 'Preise', pug: 'src/pug/preise.pug' },
    'termin': { title: 'Termin buchen', pug: 'src/pug/termin.pug' },
    'kontakt': { title: 'Kontakt', pug: 'src/pug/kontakt.pug' },
    'impressum': { title: 'Impressum', pug: 'src/pug/impressum.pug' },
    'agb': { title: 'AGB & Widerruf', pug: 'src/pug/agb.pug' },
    'datenschutz': { title: 'Datenschutz', pug: 'src/pug/datenschutz.pug' }
};

const app = express();
app.use(express.json({ limit: '25mb' }));

// --- Auth (Basic Auth, nur wenn Passwort gesetzt) ---
app.use((req, res, next) => {
    if (!PASSWORD) return next();
    const header = req.headers.authorization || '';
    const token = header.split(' ')[1] || '';
    const [user, pass] = Buffer.from(token, 'base64').toString('utf8').split(':');
    if (user === 'vzg' && pass === PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="VZG Editor"');
    res.status(401).send('Anmeldung erforderlich');
});

app.use(express.static(path.join(__dirname, 'public')));

// Gebaute Website für den Editor-Canvas bereitstellen (CSS, Bilder, Seiten).
app.use('/site', express.static(DIST));

function pageFile(slug) {
    return path.join(CONTENT, `${slug}.html`);
}

// Liste der Seiten für das Editor-Menü.
app.get('/api/pages', (req, res) => {
    const pages = Object.entries(PAGES).map(([slug, meta]) => ({
        slug,
        title: meta.title,
        edited: fs.existsSync(pageFile(slug))
    }));
    res.json({ pages });
});

// HTML einer Seite laden (bevorzugt gespeicherte Version, sonst frisch gebaut).
app.get('/api/pages/:slug', (req, res) => {
    const slug = req.params.slug;
    if (!PAGES[slug]) return res.status(404).json({ message: 'Unbekannte Seite' });

    const saved = pageFile(slug);
    if (fs.existsSync(saved)) {
        return res.json({ slug, source: 'content', html: fs.readFileSync(saved, 'utf8') });
    }
    const built = path.join(DIST, `${slug}.html`);
    if (fs.existsSync(built)) {
        return res.json({ slug, source: 'build', html: fs.readFileSync(built, 'utf8') });
    }
    res.status(404).json({ message: 'Seite nicht gefunden. Zuerst `npm run build` ausführen.' });
});

// Editor-Inhalt speichern und Website neu bauen.
app.post('/api/pages/:slug', (req, res) => {
    const slug = req.params.slug;
    if (!PAGES[slug]) return res.status(404).json({ message: 'Unbekannte Seite' });
    const { html, css } = req.body || {};
    if (typeof html !== 'string' || !html.trim()) {
        return res.status(400).json({ message: 'Kein HTML-Inhalt übermittelt' });
    }

    const marker = '<!-- VZG-EDITOR-CSS -->';
    let output = html;
    if (css && css.trim()) {
        output = `${html}\n${marker}\n<style id="vzg-editor-styles">\n${css}\n</style>\n`;
    }

    fs.writeFileSync(pageFile(slug), output, 'utf8');

    // Website neu bauen (dist/), damit die Änderung live geht.
    execFile('npm', ['run', 'build'], { cwd: ROOT }, (error, stdout, stderr) => {
        if (error) {
            console.error('[build]', stderr || error.message);
            return res.json({ ok: true, built: false, message: 'Gespeichert, aber Neubau fehlgeschlagen.' });
        }
        res.json({ ok: true, built: true, message: 'Gespeichert und neu gebaut.' });
    });
});

// Gespeicherte Editor-Version verwerfen -> Seite kommt wieder aus dem Pug-Template.
app.delete('/api/pages/:slug', (req, res) => {
    const slug = req.params.slug;
    if (!PAGES[slug]) return res.status(404).json({ message: 'Unbekannte Seite' });
    const file = pageFile(slug);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    execFile('npm', ['run', 'build'], { cwd: ROOT }, (error) => {
        if (error) return res.json({ ok: true, built: false, message: 'Zurückgesetzt, Neubau fehlgeschlagen.' });
        res.json({ ok: true, built: true, message: 'Auf Original zurückgesetzt und neu gebaut.' });
    });
});

// Bild-Upload (Drag & Drop von Bildern in den Editor) -> src/assets/img
const UPLOAD_DIR = path.join(ROOT, 'src', 'assets', 'img');
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
            cb(null, `${Date.now()}-${safe}`);
        }
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, /^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype));
    }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Nur Bilddateien erlaubt.' });
    const url = `assets/img/${req.file.filename}`;
    execFile('npm', ['run', 'build:assets'], { cwd: ROOT }, () => {
        // GrapesJS AssetManager erwartet { data: [{ src }] }
        res.json({ data: [{ src: `/site/${url}` }] });
    });
});

// --- Veröffentlichen: Änderungen nach GitHub pushen (löst Vercel-Deploy aus) ---
// Benötigt ein Schreib-Token in der Umgebung: GIT_PUSH_TOKEN (oder GITHUB_TOKEN).
const PUSH_BRANCH = process.env.GIT_BRANCH || 'main';
const PUSH_TOKEN = process.env.GIT_PUSH_TOKEN || process.env.GITHUB_TOKEN || '';

function git(args, cb) {
    // Token wird über einen Credential-Helper aus der Umgebung gelesen,
    // damit es NICHT in der Kommandozeile/Prozessliste auftaucht.
    const helper = '!f() { echo username=x-access-token; echo password=$GIT_PUSH_TOKEN; }; f';
    execFile(
        'git',
        ['-c', `credential.helper=${helper}`, ...args],
        { cwd: ROOT, env: { ...process.env, GIT_PUSH_TOKEN: PUSH_TOKEN } },
        cb
    );
}

app.post('/api/publish', (req, res) => {
    if (!PUSH_TOKEN) {
        return res.status(400).json({
            ok: false,
            message: 'Kein Schreib-Token gesetzt. Server mit GIT_PUSH_TOKEN=<token> starten.'
        });
    }

    git(['status', '--porcelain'], (err, statusOut) => {
        if (err) return res.json({ ok: false, message: 'git status fehlgeschlagen.' });
        const changed = String(statusOut).trim();

        const afterCommit = () => {
            git(['push', 'origin', `HEAD:${PUSH_BRANCH}`], (pushErr, out, pushErrOut) => {
                if (pushErr) {
                    console.error('[publish]', pushErrOut || pushErr.message);
                    return res.json({
                        ok: false,
                        message: 'Push fehlgeschlagen (Token-Rechte prüfen).',
                        detail: String(pushErrOut || pushErr.message).slice(0, 400)
                    });
                }
                res.json({ ok: true, message: `Veröffentlicht nach GitHub (${PUSH_BRANCH}).`, detail: String(out || pushErrOut).trim() });
            });
        };

        if (!changed) {
            return afterCommit();
        }

        const msg = 'Inhalt über den visuellen Editor aktualisiert';
        git(['add', '-A'], (addErr) => {
            if (addErr) return res.json({ ok: false, message: 'git add fehlgeschlagen.' });
            // Workflow-Dateien ausklammern: das Push-Token hat keinen `workflow`-Scope.
            git(['reset', '-q', '--', '.github/workflows'], () => {
                git(['-c', 'user.name=VZG Editor', '-c', 'user.email=editor@vzgconsult.online', 'commit', '-m', msg], (commitErr, out) => {
                    if (commitErr && !/nothing to commit/.test(String(out))) {
                        return res.json({ ok: false, message: 'git commit fehlgeschlagen.' });
                    }
                    afterCommit();
                });
            });
        });
    });
});

app.get('/api/publish/status', (req, res) => {
    res.json({ branch: PUSH_BRANCH, token: Boolean(PUSH_TOKEN) });
});

app.listen(PORT, () => {
    console.log(`VZG Editor läuft auf http://localhost:${PORT}`);
    if (!PASSWORD) {
        console.log('Hinweis: Kein Passwort gesetzt (EDITOR_PASSWORD). Nur lokal verwenden!');
    }
});
