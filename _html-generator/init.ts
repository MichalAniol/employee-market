type ExpressRequestT = typeof express.request
type ExpressResponseT = typeof express.response

// Uruchomienie Vite i servera na 8000
(async () => {
    const server = await createServer({
        root: path.resolve(__dirname, '../temp'), // Ustawienie katalogu 'src' jako głównego katalogu
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
    console.log(`Vite działa na: http://localhost:${server.config.server.port}`)
})()

const getZero = (num: number) => num < 10 ? '0' + num : num

const info = (name: string) => {
    const time = new Date()
    const h = time.getHours()
    const m = time.getMinutes()
    const s = time.getSeconds()
    const res = `>> ${getZero(h)}:${getZero(m)}:${getZero(s)} - ${name}`
    console.log(res)
}

const globalPath = __dirname.replace('_html-generator', '')
let watchFiles
const fileDates: { [k: string]: number } = {}

const myWatch = () => {
    watchFiles = oof.getAllHtmlFiles('src', [])

    watchFiles.forEach((elem: string) => {
        const path = globalPath + elem
        const time = fs.statSync(path)?.mtime?.getTime()
        const item = fileDates[elem]

        if (time) {
            if (!item) {
                fileDates[elem] = time
            } else {
                if (item !== time) {
                    fileDates[elem] = time
                    generator.start()
                    // sendChatMessage('reload')
                    info(elem)
                    return
                }
            }
        }
    })
}
generator.start()

setInterval(() => {
    myWatch()
}, 300)

