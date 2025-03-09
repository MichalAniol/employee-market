"use strict";
const express = require('express');
const fs = require('fs');
const websocket = require('ws');
const http = require('http');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const { createServer } = require('vite');
const chokidar = require('chokidar');
const configuration = require('../gConfig.js');
const globalPath = __dirname.replace('_html-generator', '');
const getZero = (num) => num < 10 ? '0' + num : num;
const info = (name) => {
    const time = new Date();
    const h = time.getHours();
    const m = time.getMinutes();
    const s = time.getSeconds();
    const res = `>> ${getZero(h)}:${getZero(m)}:${getZero(s)} - ${name}`;
    console.log(res);
};
const oof = (function () {
    let splitted = __dirname.split('\\');
    let path_out = '';
    splitted.forEach((e, i) => i < splitted.length - 1 ? path_out += e + '/' : null);
    const load = (filePath) => {
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
                    const condition = configuration.watchedFilesTypes.some((f) => e.indexOf(f) > -1);
                    if (condition) {
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
    const ensureDir = (srcPath) => {
        if (!fs.existsSync(srcPath)) {
            fs.mkdirSync(srcPath, { recursive: true });
            console.log(`Katalog utworzony w ./${configuration.folderPathOut}: ${srcPath}`);
        }
    };
    const removeDir = (srcPath) => {
        if (fs.existsSync(srcPath)) {
            fs.rmSync(srcPath, { recursive: true, force: true });
            console.log(`Katalog usunięty w ./${configuration.folderPathOut}: ${srcPath}`);
        }
    };
    const removeFile = (srcPath) => {
        if (fs.existsSync(srcPath)) {
            fs.unlinkSync(srcPath);
            console.log(`Plik usunięty w ./${configuration.folderPathOut}: ${srcPath}`);
        }
    };
    const getSizeOfCreateFile = async (srcPath) => {
        let result = null;
        if (fs.existsSync(srcPath)) {
            try {
                const stats = fs.statSync(srcPath);
                result = stats.size;
            }
            catch (err) {
                console.error(err);
            }
        }
        return result;
    };
    return {
        load,
        loadSvg,
        loadJson,
        getAllHtmlFiles,
        getAllPngFiles,
        save,
        ensureDir,
        removeDir,
        removeFile,
        getSizeOfCreateFile
    };
}());
const startFilesAnalyzer = (function () {
    const FileType = {
        dir: 'DIR',
        file: 'FILE'
    };
    const normalizePath = (filePath, baseFolder) => path.relative(`./${baseFolder}`, filePath);
    const flattenPaths = (watched, baseFolder) => {
        const result = new Map();
        Object.entries(watched).forEach(([dir, files]) => {
            const normalizedDir = normalizePath(dir, baseFolder);
            result.set(normalizedDir, FileType.dir);
            files.forEach(file => {
                const filePath = normalizePath(path.join(dir, file), baseFolder);
                result.set(filePath, FileType.file);
            });
        });
        return result;
    };
    const compareDirectories = (watchedIn, watchedOut) => {
        const pathsIn = flattenPaths(watchedIn, configuration.folderPathIn);
        const pathsOut = flattenPaths(watchedOut, configuration.folderPathOut);
        const onlyInPathsIn = [...pathsIn.entries()]
            .filter(([p]) => !pathsOut.has(p))
            .map(([p, type]) => [p, type]);
        const onlyInPathsOut = [...pathsOut.entries()]
            .filter(([p]) => !pathsIn.has(p))
            .map(([p, type]) => [p, type]);
        const inBothPaths = [...pathsIn.entries()]
            .filter(([p]) => pathsOut.has(p))
            .map(([p, type]) => [p, type]);
        return {
            onlyInPathsIn,
            onlyInPathsOut,
            inBothPaths
        };
    };
    const copyItem = async (srcPath, destPath, type) => {
        try {
            if (type === FileType.dir) {
                oof.removeDir(destPath);
            }
            else {
                const file = oof.load(srcPath);
                if (file) {
                    oof.save(destPath, file);
                }
            }
            info(`✅ Skopiowano: ${srcPath} ➝ ${destPath}`);
        }
        catch (error) {
            console.error(`❌ Błąd kopiowania ${srcPath}:`, error);
        }
    };
    const removeItem = async (pathToRemove, type) => {
        try {
            if (type === FileType.dir) {
                oof.removeDir(pathToRemove);
            }
            else {
                oof.removeFile(pathToRemove);
            }
            info(`🗑️ Usunięto: ${pathToRemove}`);
        }
        catch (error) {
            console.error(`❌ Błąd usuwania ${pathToRemove}:`, error);
        }
    };
    const syncDirectories = async (diff) => {
        const { onlyInPathsIn, onlyInPathsOut } = diff;
        for (const relativePath of onlyInPathsIn) {
            const srcPath = path.join(globalPath, configuration.folderPathIn, relativePath[0]);
            const destPath = path.join(globalPath, configuration.folderPathOut, relativePath[0]);
            await copyItem(srcPath, destPath, relativePath[1]);
        }
        for (const relativePath of onlyInPathsOut) {
            const pathToRemove = path.join(globalPath, configuration.folderPathOut, relativePath[0]);
            await removeItem(pathToRemove, relativePath[1]);
        }
    };
    const copyFileToOut = async (filePathIn, filePathOut) => {
        try {
            const file = oof.load(filePathIn);
            if (file) {
                oof.save(filePathOut, file);
            }
            info(`✅ Skopiowano plik: ${filePathIn} ➝ ${filePathOut}`);
        }
        catch (error) {
            console.error(`❌ Błąd kopiowania pliku: ${filePathIn} ➝ ${filePathOut}`, error);
        }
    };
    const compareFileDates = async (filePathIn, filePathOut) => {
        try {
            const statIn = await oof.getSizeOfCreateFile(filePathIn);
            const statOut = await oof.getSizeOfCreateFile(filePathOut);
            return statIn === statOut;
        }
        catch (error) {
            console.error(`❌ Błąd podczas sprawdzania dat pliku: ${filePathIn} i ${filePathOut}`, error);
            return false;
        }
    };
    const checkFilesDatesAndSync = async (inBothPaths) => {
        for (const [relativePath, type] of inBothPaths) {
            const filePathIn = path.join(globalPath, configuration.folderPathIn, relativePath);
            const filePathOut = path.join(globalPath, configuration.folderPathOut, relativePath);
            if (type === FileType.file) {
                const areFilesSame = await compareFileDates(filePathIn, filePathOut);
                if (!areFilesSame) {
                    await copyFileToOut(filePathIn, filePathOut);
                }
                else {
                }
            }
        }
    };
    const start = async (watchedPathsIn, watchedPathsOut) => {
        const diff = compareDirectories(watchedPathsIn, watchedPathsOut);
        await syncDirectories(diff);
        checkFilesDatesAndSync(diff.inBothPaths);
    };
    return {
        start
    };
}());
const generator = (function () {
    const minify = (code) => {
        if (!configuration.minifyFiles)
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
    const aggregateHtml = () => {
    };
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
        const pathFile = `${globalPath}${configuration.folderPathIn}\\index.html`;
        const file = oof.load(pathFile);
        const $ = cheerio.load(file);
        aggregateFiles(configuration.folderPathIn, $);
        if ($('head link[rel="stylesheet"][href="style.css"]').length === 0) {
            $('head').append('<link rel="stylesheet" href="style.css">');
        }
        const code = ($.html());
        oof.save(`${globalPath}${configuration.folderPathOut}\\index.html`, minify(code));
        oof.save(`${globalPath}${configuration.folderPathOut}\\style.css`, minify(minify(css)));
        console.log(`>>>> Saved!!! file: index.html`);
    };
    return { start };
}());
const init = (function () {
    (async () => {
        const server = await createServer({
            root: path.resolve(__dirname, `../${configuration.folderPathOut}`),
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
        console.log('\n');
        info(`Vite działa na: http://localhost:${server.config.server.port}`);
    })();
    const moveFile = (path) => {
        const file = oof.load(`${globalPath}${path}`);
        if (file) {
            const pathWithoutFolderPathIn = path.replace(configuration.folderPathIn, '');
            const newPath = `${globalPath}${configuration.folderPathOut}${pathWithoutFolderPathIn}`;
            oof.save(newPath, file);
        }
    };
    const ignored = ['.html', '.css'];
    const watcherIn = chokidar.watch(`./${configuration.folderPathIn}`, {
        ignored: (path, stats) => stats?.isFile() && ignored.some((elem) => path.endsWith(elem)),
        persistent: true
    });
    const watcherHtml = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path, stats) => stats?.isFile() && path.endsWith('.html'),
        persistent: true
    });
    const watcherCss = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path, stats) => stats?.isFile() && path.endsWith('css'),
        persistent: true
    });
    const watcherOut = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path, stats) => stats?.isFile() && ignored.some((elem) => path.endsWith(elem)),
        persistent: true
    });
    const getPathOut = (srcPath) => {
        const relativePath = path.relative(`./${configuration.folderPathIn}`, srcPath);
        const tempPath = path.join(`./${configuration.folderPathOut}`, relativePath);
        return tempPath;
    };
    const start = () => {
        watcherIn
            .on('add', (path) => {
            info(`Plik dodany: ${path}`);
        })
            .on('change', (path) => {
            moveFile(path);
            info(`Plik zmieniony: ${path}`);
        })
            .on('unlink', (path) => {
            oof.removeFile(getPathOut(path));
            info(`Plik usunięty: ${path}`);
        })
            .on('addDir', (path) => {
            oof.ensureDir(getPathOut(path));
            info(`Katalog dodany: ${path}`);
        })
            .on('unlinkDir', (path) => {
            oof.removeDir(getPathOut(path));
            info(`Katalog usunięty: ${path}`);
        })
            .on('error', (error) => info(`Błąd: ${error}`))
            .on('ready', async () => {
            info(`✅ Wszystkie pliki i katalogi z ./${configuration.folderPathIn} zostały załadowane!`);
            let watchedPathsIn = watcherIn.getWatched();
            watcherOut.on('ready', async () => {
                let watchedPathsOut = watcherOut.getWatched();
                startFilesAnalyzer.start(watchedPathsIn, watchedPathsOut);
            });
            watcherHtml
                .on('add', (path) => {
                generator.start();
                info(`Plik dodany: ${path}`);
            })
                .on('change', (path) => {
                generator.start();
                info(`Plik zmieniony: ${path}`);
            })
                .on('unlink', (path) => {
                generator.start();
                info(`Plik usunięty: ${path}`);
            });
            watcherCss
                .on('add', (path) => {
                generator.start();
                info(`Plik dodany: ${path}`);
            })
                .on('change', (path) => {
                generator.start();
                info(`Plik zmieniony: ${path}`);
            })
                .on('unlink', (path) => {
                generator.start();
                info(`Plik usunięty: ${path}`);
            });
        });
        info(`Obserwowanie katalogu ./${configuration.folderPathIn}...`);
        generator.start();
    };
    return {
        start
    };
}());
init.start();
