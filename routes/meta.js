const path = require("path")
const fs = require("fs").promises
const config = require("../configs/meta.js")
const Cache = require("node-cache")
const cache = new Cache({stdTTL: 60 * 60 * 2})

const abi = [
    "function getEarningSpeed(uint tokenId) view returns(uint speed)",
    "function getTokenAttributes(uint256 _tokenId) external view returns (uint256 speed,uint256 unlocked,uint256 locked,uint256 lockedInterest,uint256 totalSpent,uint256 totalEverClaimed,uint8 pitCrew,uint8 crewChief,uint8 mechanic,uint8 gasman,uint8 tireChanger)"
]

const {ethers} = require("ethers")
const provider = new ethers.providers.JsonRpcProvider(config.RPC)

const contract = new ethers.Contract(config.CONTRACT, abi, provider)
const express = require("express")

const router = express.Router()

router.use((req, res, next) => {
    res.set("Cache-Control", "public, max-age=3600")
    next()
})

router.get("/range", async (req, res) => {
    const { from, to } = req.query
    const length = to - from + 1
    if (length > config.MAX_REQUEST) {
        res.status(500)
        res.send("Too many lambos")
    }
    const tokenIds = Array.from(Array(length).keys()).map(item => Number(item) + Number(from))
    try {
        const metadata = await getBulkMetadata(tokenIds)
        res.json(metadata)
    } catch(e) {
        console.error(e)
        res.sendStatus(500)
    }
})

router.get("/list", async (req, res) => {
    const tokenIds = JSON.parse(req.query.tokenIds)
    if (tokenIds.length > config.MAX_REQUEST) {
        res.status(500)
        res.send("Too many lambos")
    }
    try {
        const metadata = await getBulkMetadata(tokenIds)
        res.json(metadata)
    } catch(e) {
        console.error(e)
        res.sendStatus(500)
    }
})

router.get("/:tokenId", async(req, res) => {
    const tokenId = req.params.tokenId
    try {
        const metadata = await getMetadata(tokenId)
        res.json(metadata)
    } catch(e) {
        console.error(e)
        res.sendStatus(500)
    }
})

async function getBulkMetadata(tokenIds) {
    return await Promise.all(tokenIds.map(tokenId => getMetadata(tokenId)))
}

async function getMetadata(tokenId) {
    const cachedVal = cache.get(tokenId)
    if(cachedVal) return cachedVal

    const metadata = JSON.parse(await fs.readFile(path.resolve(__dirname, "../public", `metadata/${tokenId}`)))
    try {
        const garageData = await contract.getTokenAttributes(tokenId)
        metadata.attributes = [
            ...metadata.attributes,
            ...(Object.keys(garageData)).filter(key => isNaN(key)).map(key => ({
                trait_type: key,
                value: ["lockedInterest", "totalSpent", "locked", "totalEverClaimed", "unlocked"].includes(key) ? (BigInt(garageData[key]) / BigInt(1e18)).toString() : garageData[key].toString()
            }))
        ]
    } catch {
        
    }
    cache.set(tokenId, metadata)
    return metadata
}

module.exports = router