const generator = (function () {
    const INPUT_PATH = 'src'
    const OUTPUT_PATH = 'temp'

    const MINIFY = false

    const globalPath = __dirname.replace('_html-generator', '')

    const replaceBackslashes = (myPath: string): string => myPath.replace(/\\/g, "/");

    const minify = (code: string) => {
        if (!MINIFY) return code

        const stringsToRemove = ['\n', '\r', '  ']

        stringsToRemove.forEach(s => {
            let index = code.indexOf(s)
            while (index > -1) {
                const splitted = code.split(s)
                code = splitted.join(' ')
                index = code.indexOf(s)
            }
        })

        return code
    }

    let css = ''

    const aggregateCss = (myPath: string, $: any) => {
        const linkElements = $('link')

        linkElements.each((index: number, element: any) => {
            const href = element.attribs.href
            // const elementType = element.attribs.type
            const rel = element.attribs.rel

            if (rel === 'stylesheet' && href) {
                const cssPath = `${globalPath}${myPath}//${href}`
                const file = oof.load(cssPath)
                if (file) {
                    const splitted = href.split('/')
                    splitted.pop()

                    let folder = ''
                    for (let i = 0; i < splitted.length; ++i) {
                        folder += `${splitted[i]}${i < splitted.length - 1 ? '\\' : ''}`
                    }

                    const newCss = minify(file.toString())
                    css += ` ${minify(newCss)}`
                    $(element).replaceWith('')
                }
                console.log(`  >> added file: _html\\${href.replace(/\//g, '\\')}`, index + 1, linkElements.length)
            }
        })
    }

    async function copyFiles(srcDir: string, destDir: string) {
        try {
            // Sprawdź, czy katalog docelowy istnieje, jeśli nie – utwórz go
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Pobierz listę plików i katalogów
            const entries = fs.readdirSync(srcDir, { withFileTypes: true });

            for (const entry of entries) {
                const srcPath = path.join(srcDir, entry.name);
                const destPath = path.join(destDir, entry.name);

                if (entry.isDirectory()) {
                    // Jeśli to katalog, utwórz go i kopiuj dalej rekurencyjnie
                    await copyFiles(srcPath, destPath);
                } else if (!entry.name.endsWith('.css') && !entry.name.endsWith('.html')) {
                    // Jeśli to plik i nie jest .css/.html, skopiuj go
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        } catch (err) {
            console.error('Błąd kopiowania plików:', err);
        }
    }

    const start = () => {

        const aggregateFiles = (myPath: string, $: any) => {
            aggregateCss(myPath, $)

            const fileElements = $('file')
            let folder = ''
            if (fileElements.length > -1) {
                fileElements.each((index: number, element: any) => {
                    const src = element.attribs.src

                    if (src) {
                        const file = oof.load(`${globalPath}${myPath}\\${src}`)
                        if (file) {
                            const splitted = src.split('/')
                            splitted.pop()

                            folder = ''
                            for (let i = 0; i < splitted.length; ++i) {
                                folder += `${splitted[i]}${i < splitted.length - 1 ? '\\' : ''}`
                            }

                            const newCode = file.toString()
                            const $$ = cheerio.load(newCode)

                            if (folder.length > 0) {
                                const code = aggregateFiles(`${myPath}\\${folder}`, $$)
                                $(element).replaceWith(minify(code.html()))
                            } else {
                                $(element).replaceWith(minify(newCode))
                            }

                        } else {
                            console.error(`>>>>>>>>>>Błędny "src" do pliku: ${myPath}\\${src}`)
                        }
                        console.log(`  >> added file: ${myPath}\\${src.replace(/\//g, '\\')}`, index + 1, fileElements.length)
                    } else {
                        console.error(`Brakuje "src" w pliku: ${myPath}\\${src}`)
                    }
                })
            }

            return $
        }



        const pathFile = `${globalPath}${INPUT_PATH}\\index.html`
        const file = oof.load(pathFile)
        const $ = cheerio.load(file)

        copyFiles('src', 'temp')
            .then(() => console.log('Kopiowanie zakończone!'))
            .catch(err => console.error('Błąd:', err));

        aggregateFiles('src', $)

        // Dodaj <link> do <head>, jeśli jeszcze go tam nie ma
        if ($('head link[rel="stylesheet"][href="style.css"]').length === 0) {
            $('head').append('<link rel="stylesheet" href="style.css">');
        }

        const code = ($.html())

        oof.save(`${globalPath}${OUTPUT_PATH}\\index.html`, minify(code))
        oof.save(`${globalPath}${OUTPUT_PATH}\\style.css`, minify(minify(css)))
        console.log(`>>>> Saved!!! file: index.html`)
    }

    return { start }
}())
