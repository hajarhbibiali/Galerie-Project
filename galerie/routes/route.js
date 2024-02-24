var express = require('express');
const multer = require("multer");
const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

var usersController = require('../controllers/usersController');
var imageController = require('../controllers/imageController');
var flaskController = require('../controllers/flaskController')
var categoryController = require('../controllers/categoryController');


router.route('/login').post(usersController.loginUserControllerFn);
router.route('/register').post(usersController.createusersControllerFn);
router.route('/album').post(upload.array('files'), imageController.uploadFilesControllerFn);
router.route('/album/:userId').get(imageController.getFilesControllerFn);
router.delete('/album/:imageId', imageController.deleteImageControllerFn);

//categories
router.post('/category', categoryController.postCategoryControllerFn);
router.get('/category', categoryController.getCategoriesControllerFn);
router.delete('/category/:categoryId', categoryController.deleteCategoryControllerFn);

// router.route('/album/process').post(flaskController.sendImagesControllerFn);


module.exports = router;