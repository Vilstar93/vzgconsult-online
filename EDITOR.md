# Visueller Editor (Drag & Drop) – VZG Consult

Ein Web-Editor im Stil von Webador/Wix, mit dem Sie die Website **visuell
bearbeiten** können: Elemente per **Drag & Drop** verschieben, Texte direkt
anklicken und ändern, Bilder hochladen, Blöcke einfügen, Farben/Schriften
anpassen – ohne Code.

Der Editor basiert auf **GrapesJS** (Open Source, BSD-3, GitHub:
https://github.com/GrapesJS/grapesjs).

---

## Starten

```bash
cd editor
npm install        # nur beim ersten Mal
npm start
```

Danach im Browser öffnen: **http://localhost:4500**

Empfohlen: Passwort setzen (nur lokal nötig, wenn der Port öffentlich ist):

```bash
EDITOR_PASSWORD=meinGeheimesPasswort npm start
# Login: Benutzer "vzg", Passwort wie gesetzt
```

### Direkt aus dem Editor nach GitHub veröffentlichen

Mit dem Button **🚀 Veröffentlichen** (oben rechts) werden die Änderungen
committet und zu GitHub gepusht – Vercel baut die Live-Seite danach automatisch
neu. Dafür braucht der Server ein **Schreib-Token** in der Umgebung:

```bash
EDITOR_PASSWORD=geheim \
GIT_PUSH_TOKEN=github_pat_xxx \
npm start
```

- `GIT_PUSH_TOKEN` – ein GitHub-Token mit Schreibrecht (Fine-grained PAT mit
  *Contents: Read and write*, oder Classic PAT mit `repo`).
- `GIT_BRANCH` – Ziel-Branch (Standard: `main`).

> Ohne gesetztes `GIT_PUSH_TOKEN` bleibt der Button inaktiv und meldet
> „Kein Schreib-Token gesetzt". Speichern/Neu-Bauen funktioniert trotzdem
> lokal. Das Token wird nur an `git` weitergereicht (über einen
> Credential-Helper) und erscheint **nicht** in der Prozessliste.

---

## Bedienung

| Element | Funktion |
| --- | --- |
| **Seite** (Dropdown) | Zwischen den Seiten wechseln (Start, Leistungen, Preise, …) |
| **Speichern & neu bauen** | Änderung speichern und die Website automatisch neu bauen (`npm run build`) |
| **↶ / ↷** | Rückgängig / Wiederholen |
| **Vorschau** | Vollbild-Vorschau ohne Editor-Rahmen |
| **{} Code** | HTML und CSS direkt ansehen/bearbeiten |
| **↺ Original** | Änderungen verwerfen, Seite wieder aus dem Pug-Template herstellen |
| **Blöcke (links)** | Fertige Bausteine per Drag & Drop einfügen: *Hero*, *Drei Karten*, *Call-to-Action*, *Preistabelle* sowie Standard-Blöcke |
| **Rechte Leiste** | Stile (Farben, Schrift, Abstände), Einstellungen, Ebenen |
| **Geräte (oben)** | Desktop / Tablet / Handy-Vorschau |

Bilder: einfach in den Editor ziehen oder im Bild-Dialog hochladen – sie landen
in `src/assets/img/` und sind danach auf der ganzen Website nutzbar.

Tastenkürzel: **Strg/Cmd + S** = Speichern.

---

## Wie es funktioniert

1. Der Editor lädt die gebaute Seite aus `dist/<seite>.html`.
2. Beim Speichern wird das bearbeitete HTML nach **`content/pages/<seite>.html`** geschrieben.
3. Der Build (`scripts/build-pug.js`) prüft für jede Seite, ob eine Datei in
   `content/pages/` existiert. **Wenn ja, wird diese statt des Pug-Templates
   verwendet** (Pug = Standard/Vorlage, Editor = Ihre Änderungen).
4. Die Website wird neu gebaut → Änderung ist sofort in `dist/` und damit live.

So bleibt die ursprüngliche Vorlage immer erhalten: Mit **↺ Original** löschen
Sie die gespeicherte Version und die Seite kommt wieder aus dem Pug-Template.

---

## Veröffentlichen (Änderungen live stellen)

Nach dem Bearbeiten die geänderten Dateien committen und pushen:

```bash
git add content/pages
git commit -m "Inhalt über den visuellen Editor angepasst"
git push
```

Vercel baut danach automatisch neu und die Live-Seite zeigt die Änderung.

> **Sicherheit:** Der Editor darf **nicht öffentlich** erreichbar sein – er kann
> Dateien schreiben. Immer lokal (oder hinter Login/VPN) betreiben und
> `EDITOR_PASSWORD` setzen.

---

## Dateien

- `editor/server.js` – Express-Server (API: Seiten laden/speichern, Bild-Upload, Build)
- `editor/public/index.html` – GrapesJS-Oberfläche
- `content/pages/*.html` – Ihre gespeicherten Seitenversionen
