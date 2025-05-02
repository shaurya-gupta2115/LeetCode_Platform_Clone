const express = require("express");
const validate = require("validator");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const { validateUserData } = require("../utils/validate");

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
    

    //creating user instance
    await User.create(req.body);
    res.send("User created Successfully");
  } catch (err) {
    res.status(400).json({
      message: "Error in registering : " + err,
    });
  }
};

const login = async (req, res) => {
  try {
   
  } catch (err) {
    res.status(400).json({
      message: "Error is : " + err,
    });
  }
};
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


module.exports = { register ,login, logout, getProfile};
