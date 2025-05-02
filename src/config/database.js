const mongoose = require("mongoose");

// console.log(process.env.DB_CONNECTION_STRING);

const connectDB = async (req, res) => {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log("Database Connected");

};

module.exports = {connectDB};
