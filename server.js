const express = require("express")
const path = require("path")
const app = express()
require("dotenv").config()

app.use("/public", express.static(path.join(__dirname,"public")))
app.use("/meta", require("./routes/meta.js"))
app.use("/images", require("./routes/images.js"))
app.use(require("./routes/whitelist.js"))

app.listen(process.env.PORT)