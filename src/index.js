//index.js
const express = require("express")
const app = express();
require("dotenv").config();


app.get("/",(req,res)=>{
    res.send("Hello Project")
})
const port = process.env.PORT;

app.listen(port, () => {
    console.log("Server started running :) at localhost")
})

