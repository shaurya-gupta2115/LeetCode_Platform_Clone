const express = require("express");
const app = express();
require("dotenv").config();

app.get("/hello", (req, res) => {
  res.send("hello World baby ");
});

app.listen(process.env.PORT, () => {
  console.log("Server started running :) at :" + process.env.PORT);
});
