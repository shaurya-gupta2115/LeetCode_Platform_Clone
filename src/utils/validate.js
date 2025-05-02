const validator = require("validator");

const validateUserData = (data) => {
  const mandatoryFields = ["firstName", "password", "emailId"];
  const isAllowed = mandatoryFields.every((k) => Object.keys(data).includes(k));

  if (!isAllowed) {
    throw new Error("Some Fields are missings. Check it again!");
  }

  if (!validator.isEmail(data.emailId)) {
    throw new Error("Invalid Email");
  }
 
};

module.exports = { validateUserData };
