const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    lastName: {
      type: String,
      min: 3,
      max: 20,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    age: {
      type: Number,
      min: 6,
      max: 80,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    problemSolved: {
      type: [String],
    },
    gender: {
      type: String,
      validate(value) {
        if (!["Male", "Female", "Others"].includes(value)) {
          throw new Error("Gender must be Male, Female, or Others.");
        }
      },
    },
    about: {
      type: String,
      default: "User is Learning at Leetcode Platform",
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          );
        }
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
