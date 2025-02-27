"use strict";
const express = require('express');
const fs = require('fs');
const websocket = require('ws');
const http = require('http');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const { createServer } = require('vite');
const oof = (function () {
    let splitted = __dirname.split('\\');
    let path_out = '';
    splitted.forEach((e, i) => i < splitted.length - 1 ? path_out += e + '/' : null);
    const globalPath = __dirname.replace('_html-generator', '');
    const load = (filePath) => {
        console.log('%c filePath:', 'background: #ffcc00; color: #003300', filePath);
        let data = null;
        try {
            if (fs.existsSync(filePath)) {
                data = fs.readFileSync(filePath);
            }
        }
        catch (err) {
            console.error(err);
        }
        return data;
    };
    const loadSvg = (name) => {
        const filePath = globalPath + name;
        let data = null;
        try {
            if (fs.existsSync(filePath)) {
                data = fs.readFileSync(filePath);
            }
        }
        catch (err) {
            console.error(err);
        }
        return data;
    };
    const loadJson = (name) => {
        const filePath = globalPath + name;
        let data = null;
        try {
            if (fs.existsSync(filePath)) {
                data = JSON.parse(fs.readFileSync(filePath));
            }
        }
        catch (err) {
            console.error(err);
        }
        return data;
    };
    const getAllHtmlFiles = (folder, exceptions) => {
        let result = [];
        const getDir = (path, suffix) => {
            const files = fs.readdirSync(path);
            if (files.length > 0) {
                files.forEach((e) => {
                    const forbidden = exceptions.some(f => f === e);
                    if (forbidden)
                        return;
                    const hasDot = e.indexOf('.') === -1;
                    const isHtml = e.indexOf('.html') > -1;
                    const isJs = e.indexOf('.css') > -1;
                    const isSvg = e.indexOf('.svg') > -1;
                    if (isHtml || isJs || isSvg) {
                        result.push(`${suffix}\\${e}`);
                        return;
                    }
                    if (hasDot)
                        getDir(`${path}\\${e}`, `${suffix}\\${e}`);
                });
            }
        };
        const filePath = globalPath + folder;
        getDir(filePath, folder);
        return result;
    };
    const getAllPngFiles = (folder, exceptions) => {
        let result = [];
        const getDir = (path, suffix) => {
            const files = fs.readdirSync(path);
            if (files.length > 0) {
                files.forEach((e) => {
                    const forbidden = exceptions.some(f => f === e);
                    if (forbidden)
                        return;
                    const hasDot = e.indexOf('.') === -1;
                    const isPng = e.indexOf('.png') > -1;
                    if (isPng) {
                        result.push(`${suffix}\\${e}`);
                        return;
                    }
                    if (hasDot)
                        getDir(`${path}\\${e}`, `${suffix}\\${e}`);
                });
            }
        };
        const filePath = globalPath + folder;
        getDir(filePath, folder);
        return result;
    };
    const save = (filePath, data) => {
        fs.writeFileSync(filePath, data);
    };
    return {
        load,
        loadSvg,
        loadJson,
        getAllHtmlFiles,
        getAllPngFiles,
        save
    };
}());
const generator = (function () {
    const INPUT_PATH = 'src';
    const OUTPUT_PATH = 'temp';
    const MINIFY = false;
    const globalPath = __dirname.replace('_html-generator', '');
    const replaceBackslashes = (myPath) => myPath.replace(/\\/g, "/");
    const minify = (code) => {
        if (!MINIFY)
            return code;
        const stringsToRemove = ['\n', '\r', '  '];
        stringsToRemove.forEach(s => {
            let index = code.indexOf(s);
            while (index > -1) {
                const splitted = code.split(s);
                code = splitted.join(' ');
                index = code.indexOf(s);
            }
        });
        return code;
    };
    let css = '';
    const aggregateCss = (myPath, $) => {
        const linkElements = $('link');
        linkElements.each((index, element) => {
            const href = element.attribs.href;
            const rel = element.attribs.rel;
            if (rel === 'stylesheet' && href) {
                const cssPath = `${globalPath}${myPath}//${href}`;
                const file = oof.load(cssPath);
                if (file) {
                    const splitted = href.split('/');
                    splitted.pop();
                    let folder = '';
                    for (let i = 0; i < splitted.length; ++i) {
                        folder += `${splitted[i]}${i < splitted.length - 1 ? '\\' : ''}`;
                    }
                    const newCss = minify(file.toString());
                    css += ` ${minify(newCss)}`;
                    $(element).replaceWith('');
                }
                console.log(`  >> added file: _html\\${href.replace(/\//g, '\\')}`, index + 1, linkElements.length);
            }
        });
    };
    async function copyFiles(srcDir, destDir) {
        try {
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            const entries = fs.readdirSync(srcDir, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(srcDir, entry.name);
                const destPath = path.join(destDir, entry.name);
                if (entry.isDirectory()) {
                    await copyFiles(srcPath, destPath);
                }
                else if (!entry.name.endsWith('.css') && !entry.name.endsWith('.html')) {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
        catch (err) {
            console.error('Błąd kopiowania plików:', err);
        }
    }
    const start = () => {
        const aggregateFiles = (myPath, $) => {
            aggregateCss(myPath, $);
            const fileElements = $('file');
            let folder = '';
            if (fileElements.length > -1) {
                fileElements.each((index, element) => {
                    const src = element.attribs.src;
                    if (src) {
                        const file = oof.load(`${globalPath}${myPath}\\${src}`);
                        if (file) {
                            const splitted = src.split('/');
                            splitted.pop();
                            folder = '';
                            for (let i = 0; i < splitted.length; ++i) {
                                folder += `${splitted[i]}${i < splitted.length - 1 ? '\\' : ''}`;
                            }
                            const newCode = file.toString();
                            const $$ = cheerio.load(newCode);
                            if (folder.length > 0) {
                                const code = aggregateFiles(`${myPath}\\${folder}`, $$);
                                $(element).replaceWith(minify(code.html()));
                            }
                            else {
                                $(element).replaceWith(minify(newCode));
                            }
                        }
                        else {
                            console.error(`>>>>>>>>>>Błędny "src" do pliku: ${myPath}\\${src}`);
                        }
                        console.log(`  >> added file: ${myPath}\\${src.replace(/\//g, '\\')}`, index + 1, fileElements.length);
                    }
                    else {
                        console.error(`Brakuje "src" w pliku: ${myPath}\\${src}`);
                    }
                });
            }
            return $;
        };
        const pathFile = `${globalPath}${INPUT_PATH}\\index.html`;
        const file = oof.load(pathFile);
        const $ = cheerio.load(file);
        copyFiles('src', 'temp')
            .then(() => console.log('Kopiowanie zakończone!'))
            .catch(err => console.error('Błąd:', err));
        aggregateFiles('src', $);
        if ($('head link[rel="stylesheet"][href="style.css"]').length === 0) {
            $('head').append('<link rel="stylesheet" href="style.css">');
        }
        const code = ($.html());
        oof.save(`${globalPath}${OUTPUT_PATH}\\index.html`, minify(code));
        oof.save(`${globalPath}${OUTPUT_PATH}\\style.css`, minify(minify(css)));
        console.log(`>>>> Saved!!! file: index.html`);
    };
    return { start };
}());
(async () => {
    const server = await createServer({
        root: path.resolve(__dirname, '../temp'),
        server: {
            cors: true,
            port: 8000,
            fs: {
                allow: [
                    path.resolve(__dirname, '..')
                ]
            },
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq) => {
                            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
                        });
                    }
                }
            }
        },
    });
    await server.listen();
    console.log(`Vite działa na: http://localhost:${server.config.server.port}`);
})();
const getZero = (num) => num < 10 ? '0' + num : num;
const info = (name) => {
    const time = new Date();
    const h = time.getHours();
    const m = time.getMinutes();
    const s = time.getSeconds();
    const res = `>> ${getZero(h)}:${getZero(m)}:${getZero(s)} - ${name}`;
    console.log(res);
};
const globalPath = __dirname.replace('_html-generator', '');
let watchFiles;
const fileDates = {};
const myWatch = () => {
    watchFiles = oof.getAllHtmlFiles('src', []);
    watchFiles.forEach((elem) => {
        const path = globalPath + elem;
        const time = fs.statSync(path)?.mtime?.getTime();
        const item = fileDates[elem];
        if (time) {
            if (!item) {
                fileDates[elem] = time;
            }
            else {
                if (item !== time) {
                    fileDates[elem] = time;
                    generator.start();
                    info(elem);
                    return;
                }
            }
        }
    });
};
generator.start();
setInterval(() => {
    myWatch();
}, 300);
