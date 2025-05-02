const express = require("express");
const authRouter = express.Router();

const {
  register,
  login,
  logout,
  getProfile,
} = require("../controllers/userAuthController");

// Register
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/getProfile", getProfile);

//login
//logout
//getProfile

module.exports = authRouter;
