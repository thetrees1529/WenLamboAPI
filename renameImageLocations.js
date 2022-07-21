const fs = require("fs").promises

async function main() {
    const fileNames = Array.from(Array(10000).keys())
    for (item of fileNames) {
        const location = `./public/metadata/${item}`
        const json = JSON.parse(await fs.readFile(location))
        json.image = `https://meta.wenlambo.one/images/${item}.png`
        await fs.writeFile(location, JSON.stringify(json))
    }
}

main()