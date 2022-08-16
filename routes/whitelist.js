const harmony = {
    image: "https://storageapi.fleek.co/c607c1dc-cdb6-453f-ab3e-9e0b1c8a1cd9-bucket/Whitelist/Ticket-Avax-Muscle-Presale-hirez-harmony.jpg"
} 
const avax = {
    image: "https://storageapi.fleek.co/c607c1dc-cdb6-453f-ab3e-9e0b1c8a1cd9-bucket/Whitelist/Ticket-Avax-Muscle-Presale-hirez.jpg"
}
const base = {
    name: "Muscle Whitelist"
}

const express = require("express")
const router = express.Router()

router.get("/hmwl/:tokenId", (req, res) => {
    const number = Number(req.params.tokenId)
    if (number) res.json({...getBase(number), ...harmony})
    else res.sendStatus(404)
})

router.get("/amwl/:tokenId", (req, res) => {
    const number = Number(req.params.tokenId)
    if (number) res.json({...getBase(number), ...avax})
    else res.sendStatus(404)
})

function getBase(tokenId) {
    return {tokenId, ...base}
}

module.exports = router