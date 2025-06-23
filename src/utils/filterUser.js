// utils/filterUser.js
module.exports = (user) => {
  const { password,problemSolved, ...filteredUser } = user.toObject();
  return filteredUser;
};
