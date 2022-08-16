const path = require("path")
const fs = require("fs").promises
const config = require("../configs/meta.js")
const Cache = require("node-cache")
const cache = new Cache({stdTTL: config.CACHE_TTL})

const abi = [
    "function getTokenAttributes(uint256 _tokenId) external view returns (uint256 speed,uint256 unlocked,uint256 locked,uint256 lockedInterest,uint256 totalSpent,uint256 totalEverClaimed,uint8 pitCrew,uint8 crewChief,uint8 mechanic,uint8 gasman,uint8 tireChanger)"
]

const abi2 = [
    "function getAttributes(uint256 _tokenId) external view returns ((string statistic, uint value)[] views)"
]

const {ethers} = require("ethers")
const provider = new ethers.providers.JsonRpcProvider(config.RPC)

const contract = new ethers.Contract(config.CONTRACT, abi, provider)
const contract2 = new ethers.Contract(config.CONTRACT2, abi2, provider)
const express = require("express")

const router = express.Router()

router.get("/range", async (req, res) => {
    const { from, to } = req.query
    const length = to - from + 1
    if (length > config.MAX_REQUEST) {
        res.status(500)
        res.send("Too many lambos")
    }
    const tokenIds = Array.from(Array(length).keys()).map(item => Number(item) + Number(from))
    const metadata = await getBulkMetadata(tokenIds)
    res.json(metadata)
})

router.get("/list", lamboLimit, async (req, res) => {
    const tokenIds = JSON.parse(req.query.tokenIds)
    const metadata = await getBulkMetadata(tokenIds)
    res.json(metadata)
})

router.get("/", async(req, res) => {
    const tokenId = req.query.tokenId
    const metadata = await getMetadata(tokenId)
    res.json(metadata)
})

async function getBulkMetadata(tokenIds) {
    return await Promise.all(tokenIds.map(tokenId => getMetadata(tokenId)))
}

function lamboLimit(req,res,next) {
    const tokenIds = JSON.parse(req.query.tokenIds)
    if (tokenIds.length > config.MAX_REQUEST) {
        res.status(500)
        res.send("Too many lambos")
    }
    next()
}

async function getMetadata(tokenId) {
    const cachedVal = cache.get(tokenId)
    if(cachedVal) return cachedVal

    const metadata = JSON.parse(await fs.readFile(path.resolve(__dirname, "../public", `metadata/${tokenId}`)))
    try {
        const garageData = await contract.getTokenAttributes(tokenId)
        const views = await contract2.getAttributes(tokenId)
        metadata.attributes = [
            ...metadata.attributes,
            ...(Object.keys(garageData)).filter(key => isNaN(key)).map(key => ({
                trait_type: key,
                value: ["lockedInterest", "totalSpent", "locked", "totalEverClaimed", "unlocked"].includes(key) ?(Number((BigInt(garageData[key]) / BigInt(1e17)))/10).toString() : garageData[key].toString()
            })),
            ...views.map(view => ({
                trait_type: view.statistic,
                value: view.value.toString()
            }))
            
        ]
    } catch(e) {
      console.log(e) 
    }
    cache.set(tokenId, metadata)
    return metadata
}

module.exports = router