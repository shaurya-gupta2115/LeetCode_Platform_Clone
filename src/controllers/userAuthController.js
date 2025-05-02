const express = require("express");
const validate = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { validateUserData } = require("../utils/validate");

// register user api
const register = async (req, res) => {
  try {
    const { firstName, emailId, password } = req.body;

    //verifying data -> ki aaya hai bhi ki nhi sahi wala
    validateUserData(req.body);

    // check whether the email already exists in the User Collection or not

    // User.exists({emailId})
    //but no need kyunki humne emailId ko unique banaya hai and due to this jb bhi user create hoga tb
    // wo agar same emailId dekhega to User wala error message de dega ki kya reason hai

    //protecting the password --> using bcrypt npm library for this

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;

    //creating user instance
    const user = await User.create(req.body);

    // const user = new User({
    //   //here we can also use "User.create" instead "new User"
    //   firstName,
    //   lastName,
    //   emailId,
    //   age,
    //   role,
    //   problemSolved,
    //   gender,
    //   about,
    //   password: hashedPassword,
    // });
    // await user.save();

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId },
      process.env.JWT_KEY,
      {
        expiresIn: 60 * 60,
      }
    );

    // we are sending cookie also when the user first enter and make him/her login :)
    res.cookie("token", token, { maxAge: 60 * 60 * 1000 }); // when we use expire we use Date(Date.now()) like things instead we are using this which takes value in milliseconds

    res.status(201).send("User created Successfully");
  } catch (err) {
    res.status(400).json({
      message: "Error in registering : " + err,
    });
  }
};

//login api
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!password) throw new Error("Invalid Credentials");
    if (!emailId) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });

    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const passwordDB = user.password;

    const isValidUser = await bcrypt.compare(password, passwordDB);

    // creating token to be sent
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId },
      process.env.JWT_KEY,
      {
        expiresIn: 60 * 60,
      }
    );

    // if password got matched then
    if (isValidUser) {
      res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    }

    res.status(200).send("User loggedIn Successfully ");
    
  } catch (err) {
    res.status(401).json({
      //401 for unauthorised access
      message: "Error is : " + err,
    });
  }
};

//logout api
const logout = async (req, res) => {
  try {
  } catch (err) {
    res.status(400).json({
      message: "Error is : " + err,
    });
  }
};

const getProfile = async (req, res) => {
  try {
  } catch (err) {
    res.status(400).json({
      message: "Error is : " + err,
    });
  }
};

module.exports = { register, login, logout, getProfile };
