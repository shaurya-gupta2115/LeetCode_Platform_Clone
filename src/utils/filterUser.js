// utils/filterUser.js
module.exports = (user) => {
  const { password, ...filteredUser } = user.toObject();
  return filteredUser;
};
