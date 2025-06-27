const express = require("express");
const app = express();
require("dotenv").config();
const main = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const aiRouter = require('./routes/aiChatting')

app.use(express.json()); // express.json
app.use(cookieParser()); // cookie

//redisClient
const redisClient = require("./config/redis");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

//Routers
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const videoRouter = require("./routes/videoCreator")
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter)
app.use("/video", videoRouter)


// Connection Initialisatin with DB and Redis
const InitalizeConnection = async () => {
  try {
    await Promise.all([main(), redisClient.connect()]); // main and redisClient function will run together in sequence
    console.log("DB Connected");

    app.listen(process.env.PORT, () => {
      console.log("Server listening at port number: " + process.env.PORT);
    });
  } catch (err) {
    console.log("Error: " + err);
  }
};
//initialising the connection with the database and the redisClient --> listening to the server

InitalizeConnection();
