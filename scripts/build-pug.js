'use strict';
const upath = require('upath');
const sh = require('shelljs');
const fs = require('fs');
const renderPug = require('./render-pug');

const srcPath = upath.resolve(upath.dirname(__filename), '../src');
const contentPath = upath.resolve(upath.dirname(__filename), '../content/pages');
const distPath = upath.resolve(upath.dirname(__filename), '../dist');

sh.find(srcPath).forEach(_processFile);

function _processFile(filePath) {
    if (
        filePath.match(/\.pug$/)
        && !filePath.match(/include/)
        && !filePath.match(/mixin/)
        && !filePath.match(/\/pug\/layouts\//)
    ) {
        // Mit dem visuellen Editor gespeicherte Seite hat Vorrang vor dem Pug-Template.
        const slug = upath.basename(filePath, '.pug');
        const override = upath.join(contentPath, `${slug}.html`);
        if (fs.existsSync(override)) {
            console.log(`### INFO: Editor-Inhalt für "${slug}" verwenden (${override})`);
            sh.mkdir('-p', distPath);
            sh.cp(override, upath.join(distPath, `${slug}.html`));
            return;
        }
        renderPug(filePath);
    }
}