const path = require("path")
const express = require("express")

const router = express.Router()

router.get("/:image", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../public", `images/${req.params.image}`))
})

module.exports = router

