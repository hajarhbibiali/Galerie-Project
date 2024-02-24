const File = require("../models/imagesModel");
module.exports.saveFilesToDBService = (files) => {
    return File.insertMany(files)
      .then(() => {
        return true;
      })
      .catch((error) => {
        console.error(error);
        return false;
      });
  };