require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json());
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/database");
const authRouter = require("./routes/userAuth")

app.use("/",authRouter)

connectDB()
.then(async () => {
  try {
    app.listen(process.env.PORT, () => {
      console.log("Server is listening at port : " + process.env.PORT);
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
