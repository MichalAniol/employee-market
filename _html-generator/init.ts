type ExpressRequestT = typeof express.request
type ExpressResponseT = typeof express.response

const init = (function () {

    // Uruchomienie Vite i servera na 8000
    (async () => {
        const server = await createServer({
            root: path.resolve(__dirname, `../${configuration.folderPathOut}`), // Ustawienie katalogu in jako głównego katalogu
            server: {
                cors: true,
                port: 8000, // Definiowanie portu 8000
                fs: {
                    allow: [
                        path.resolve(__dirname, '..') // Zezwala na dostęp do plików poza katalogiem projektu
                    ]
                },
                proxy: {
                    '/api': {
                        target: 'http://localhost:8000',
                        changeOrigin: true,
                        configure: (proxy: any, options: any) => {
                            proxy.on('proxyReq', (proxyReq: any) => {
                                proxyReq.setHeader('Access-Control-Allow-Origin', '*');
                            });
                        }
                    }
                }
            },
        });

        await server.listen()
        console.log('\n')
        info(`Vite działa na: http://localhost:${server.config.server.port}`)
    })()

    const moveFile = (path: string) => {
        const file = oof.load(`${globalPath}${path}`)
        if (file) {
            const pathWithoutFolderPathIn = path.replace(configuration.folderPathIn, '')
            const newPath = `${globalPath}${configuration.folderPathOut}${pathWithoutFolderPathIn}`
            oof.save(newPath, file)

        }
    }

    const ignored = ['.html', '.css']
    
    // Ścieżka do katalogu, który ma być obserwowany
    const watcherIn = chokidar.watch(`./${configuration.folderPathIn}`, {
        ignored: (path: string, stats: any) => stats?.isFile() && ignored.some((elem: string) => path.endsWith(elem)),
        persistent: true // Kontynuowanie działania procesu
    })

    const watcherHtml = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path: string, stats: any) => stats?.isFile() && path.endsWith('.html'),
        persistent: true // Kontynuowanie działania procesu
    })
    const watcherCss = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path: string, stats: any) => stats?.isFile() && path.endsWith('css'),
        persistent: true // Kontynuowanie działania procesu
    })

    const watcherOut = chokidar.watch(`./${configuration.folderPathOut}`, {
        ignored: (path: string, stats: any) => stats?.isFile() && ignored.some((elem: string) => path.endsWith(elem)),
        persistent: true // Kontynuowanie działania procesu
    })

    type WatchedPaths = {
        [directory: string]: string[]
    }

    const getPathOut = (srcPath: string) => {
        const relativePath = path.relative(`./${configuration.folderPathIn}`, srcPath)
        const tempPath = path.join(`./${configuration.folderPathOut}`, relativePath)
        return tempPath
    }

    const start = () => {
        // Obsługa różnych zdarzeń
        watcherIn
            .on('add', (path: string) => {
                // moveFile(path) // w zamian "startFilesAnalyzer"
                info(`Plik dodany: ${path}`)
            })
            .on('change', (path: string) => {
                moveFile(path)
                info(`Plik zmieniony: ${path}`)
            })
            .on('unlink', (path: string) => {
                oof.removeFile(getPathOut(path))
                info(`Plik usunięty: ${path}`)
            })
            .on('addDir', (path: string) => {
                oof.ensureDir(getPathOut(path))
                info(`Katalog dodany: ${path}`)
            })
            .on('unlinkDir', (path: string) => {
                oof.removeDir(getPathOut(path))
                info(`Katalog usunięty: ${path}`)
            })
            .on('error', (error: any) => info(`Błąd: ${error}`))
            .on('ready', async () => {
                info(`✅ Wszystkie pliki i katalogi z ./${configuration.folderPathIn} zostały załadowane!`)
                let watchedPathsIn: WatchedPaths = watcherIn.getWatched()

                watcherOut.on('ready', async () => {
                    let watchedPathsOut: WatchedPaths = watcherOut.getWatched()
                    // info('%c watchedPathsOut:', 'background: #ffcc00; color: #003300', watchedPathsOut)
                    // info(`✅ Wszystkie pliki i katalogi z ./${configuration.folderPathOut} zostały załadowane!`)

                    // Pobierz różnice
                    startFilesAnalyzer.start(watchedPathsIn, watchedPathsOut)
                })

                watcherHtml
                    .on('add', (path: string) => {
                        generator.start()
                        info(`Plik dodany: ${path}`)
                    })
                    .on('change', (path: string) => {
                        generator.start()
                        info(`Plik zmieniony: ${path}`)
                    })
                    .on('unlink', (path: string) => {
                        generator.start()
                        info(`Plik usunięty: ${path}`)
                    })

                    watcherCss
                    .on('add', (path: string) => {
                        generator.start()
                        info(`Plik dodany: ${path}`)
                    })
                    .on('change', (path: string) => {
                        generator.start()
                        info(`Plik zmieniony: ${path}`)
                    })
                    .on('unlink', (path: string) => {
                        generator.start()
                        info(`Plik usunięty: ${path}`)
                    })
            })


        info(`Obserwowanie katalogu ./${configuration.folderPathIn}...`)

        generator.start()
    }

    return {
        start
    }
}())

init.start()
