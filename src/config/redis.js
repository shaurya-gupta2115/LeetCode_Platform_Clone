const { createClient } = require("redis");

//creating redisClient
const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: "redis-14609.c212.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 14609,
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message);
});


module.exports = redisClient;
