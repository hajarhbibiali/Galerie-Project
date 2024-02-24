var usersService = require("../services/usersService");

var createusersControllerFn = async (req, res) => {
  try {
    console.log(req.body);
    var status = await usersService.createUserDBService(req.body);
    console.log(status);

    if (status) {
      res.send({ status: true, message: "user created successfully" });
    } else {
      res.send({ status: false, message: "Error creating user" });
    }
  } catch (err) {
    console.log(err);
  }
};

var loginUserControllerFn = async (req, res) => {
  var result = null;
  try {
    result = await usersService.loginUserDBService(req.body);
    if (result.status) {
      res.send({ status: true, message: result.msg, id: result._id });
    } else {
      res.send({ status: false, message: result.msg });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: error.msg });
  }
};

module.exports = {
  createusersControllerFn,
  loginUserControllerFn,
}
