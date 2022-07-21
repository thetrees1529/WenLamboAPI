const express = require("express")
const path = require("path")
const app = express()

app.use("/public", express.static(path.join(__dirname,"public")))
app.use("/meta", require("./routes/meta.js"))
app.use("/images", require("./routes/images.js"))

app.listen(80)