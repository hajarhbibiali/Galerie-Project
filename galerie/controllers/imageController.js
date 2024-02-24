const File = require("../models/imagesModel");
const FileUploadService = require("../services/imageService");
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const url = 'mongodb://localhost:27017';
const dbName = 'galerie';
const client = new MongoClient(url);

const uploadFilesControllerFn = async (req, res) => {
  try {
    const files = [];
    // Loop through each uploaded file
    for (const file of req.files) {
      const newFile = new File({
        filename: file.originalname,
        user: req.body.user,
        category: req.body.category,
        imageData: {
          data: file.buffer,
          contentType: file.mimetype,
        },
      });
      files.push(newFile);
    }
    // Save the new file to the database
    const insertedFiles = await FileUploadService.saveFilesToDBService(files);

    if (insertedFiles) {
      res
        .status(200)
        .json({ status: true, message: "Files uploaded successfully" });
    } else {
      res.status(500).json({ status: false, message: "Error uploading files" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

const getFilesControllerFn = async (req, res) => {
    var userId = req.params.userId; // Get user ID from URL parameters
    File.find({ user: userId })
      .then(files => {
        if (files.length === 0) {
          res.status(404).send("No files found for this user");
        } else {
          res.json(
            files.map(function (file) {
              return {
                filename: file.filename,
                category:file.category,
                imageData:
                  "data:" +
                  file.imageData.contentType +
                  ";base64," +
                  file.imageData.data.toString("base64"),
              };
            })
          );
        }
      })
      .catch(err => {
        res.status(500).send("Error occurred: database error");
      });
  };
  var deleteImageControllerFn = async function(req, res) {
    const imageId = req.params.imageId;
    try {
        await client.connect();
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const images = db.collection('images');
        const result = await images.deleteOne({_id: new ObjectId(imageId)});
        if (result.deletedCount === 0) {
            console.log("No documents deleted");
            res.status(404).send();
        } else {
            console.log("1 document deleted");
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.status(500).send();
    } 
};
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});

module.exports = {
  uploadFilesControllerFn,
  getFilesControllerFn,
  deleteImageControllerFn
};
