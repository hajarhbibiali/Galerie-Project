const userModel = require("../models/userModel");
const key = "123456789trytryrtyr";
const encryptor = require("simple-encryptor")(key);

module.exports.createUserDBService = (userDetails) => {
  const encryptedPassword = encryptor.encrypt(userDetails.password);
  const user = new userModel({
    firstname: userDetails.firstname,
    lastname: userDetails.lastname,
    email: userDetails.email,
    password: encryptedPassword,
  });

  return user
    .save()
    .then(() => {
      return true; // User saved successfully
    })
    .catch((error) => {
      console.error(error);
      return false; // Error occurred while saving user
    });
};

module.exports.loginUserDBService = (userDetails) => {
  return userModel
    .findOne({ email: userDetails.email })
    .then((user) => {
      if (user) {
        const decryptedPassword = encryptor.decrypt(user.password);
        if (decryptedPassword === userDetails.password) {
          return {
            status: true,
            msg: "User Validated Successfully",
            _id: user._id,
          };
        } else {
          return { status: false, msg: "User Validation Failed" };
        }
      } else {
        return { status: false, msg: "Invalid User" };
      }
    })
    .catch((error) => {
      console.error(error);
      return { status: false, msg: "Invalid Data" };
    });
};
