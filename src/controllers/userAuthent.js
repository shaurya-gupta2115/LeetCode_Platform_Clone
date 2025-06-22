const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const filteredUser = require("../utils/filterUser")

const userInfo = async (req, res) => {
  try {
    const userId = req.result._id;
    if (!userId) return res.status(400).send("User ID is Missing");

    const user = await User.findById(userId).select(
      "_id firstName emailId role problemSolved createdAt updatedAt"
    );

    if (!user) return res.status(404).send("User Not Found");

    res.status(200).json({user}); // ✅ Properly send user info back to frontend
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const register = async (req, res) => {
  try {
    // validate the data;
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user"; // even he given role as for admin or something else, we will set it to user

    const user = await User.create(req.body);

    const safeUser = await filteredUser(user) // this data should be send to the frontent as reply information 
    //register krne ke time pe token generate karna hai
    // and that token is to be placed in the cookie for futher availability
    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );
    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(201).json({user: safeUser, registration: "successful"});
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId) throw new Error("Invalid Credentials");
    if (!password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error("Invalid Credentials");

    //when a user do login, the new token is generated and that token is to be placed in the cookie for futher availability
    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    const safeUser = await filteredUser(user); 

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 }); //cookies ki place se bhi to token hatana tha after certain time

    res.status(200).json({user: safeUser, login: "successful"});
  } catch (err) {
    res.status(401).send("Error: " + err);
  }
};

// logOut feature

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    const payload = jwt.decode(token);

    // {
    //   "_id": "662bc4f1d5e345f2efb61ed9",
    //   "emailId": "shaurya@gmail.com",
    //   "role": "user",
    //   "exp": 1718254073  // 👈 Expiry timestamp (seconds)
    // }

    //    Token add kar dung Redis ke blockList
    await redisClient.set(`token:${token}`, "Blocked"); // pair me jaate hai to usi trh hi rahenge
    await redisClient.expireAt(`token:${token}`, payload.exp);

    //    Cookies ko clear kar dena.....
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("Logged Out Succesfully");
  } catch (err) {
    res.status(503).send("Error: " + err);
  }
};

const adminRegister = async (req, res) => {
  try {
    if (req.result.role !== "admin") throw new Error("Invalid Credentials - its role is not admin");
    // console.log(req.result);
    
    // validate the data;
    validate(req.body);

    const { firstName, emailId, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    const user = await User.create(req.body);
    // const user = await User.create({ firstName, emailId, password, role });

    // const token = jwt.sign(
    //   { _id: user._id, emailId: emailId, role: user.role },
    //   process.env.JWT_KEY,
    //   { expiresIn: 60 * 60 }
    // );
    // res.cookie("token", token, { maxAge: 60 * 60 * 1000 });

    res.status(201).send("User Registered Successfully by Admin");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const deleteProfile = async (req, res) => {
  try {
    //req.result custom property hai jo tumhare authentication middleware me JWT verify hone ke baad add ki jaati hai. i.e. req.result = payload (of JWT)
    const userId = req.result._id; // token ke payload se userId le lo
    if (!userId) return res.status(400).send("User ID is Missing");

    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo..
    const result = await Submission.deleteMany({ userId }); //jaha bhi submission me userId hoga cureent wala ..use delete krdena hai
    console.log(result.deletedCount + " submissions deleted.");

    res.status(200).send("Deleted Successfully");
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  userInfo,
  register,
  login,
  logout,
  adminRegister,
  deleteProfile,
};
