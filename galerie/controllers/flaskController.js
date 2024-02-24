const imagesService = require("../services/flaskService");

var sendImagesControllerFn = async (req, res) => {
  var result = null;
  try {
    result = await imagesService.sendImagesDBService(req.body);
    if (result.status) {
      res.send({ status: true, message: result.msg });
    } else {
      res.send({ status: false, message: result.msg });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: error.msg });
  }
};

module.exports = {
  sendImagesControllerFn,
};
