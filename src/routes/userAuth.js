const express = require('express');
const filteredUser = require("../utils/filterUser")
const authRouter =  express.Router();
const {
  userInfo,register,
  login,
  logout,
  adminRegister,
  deleteProfile,
} = require("../controllers/userAuthent");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

// Register

authRouter.post("/info",userMiddleware, userInfo);
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);

authRouter.get("/check", userMiddleware,(req,res)=>{
  const safeUser = filteredUser(req.result) // req.result is having data of the user through the middleware and that middleware data is passed through filterUser
  res.status(200).json({user: safeUser, validUser: true})
})
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile

