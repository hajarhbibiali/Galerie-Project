const Category = require('../models/categoryModel');

var postCategoryControllerFn = (req, res) => {
  const name = req.body.name;
  const newCategory = new Category({ name });

  newCategory.save()
    .then(() => {
      res.status(200).json({ message: 'Category added successfully' });
    })
    .catch(err => {
      res.status(400).json({ error: err });
    });
};

var getCategoriesControllerFn = (req, res) => {
  Category.find()
    .then(categories => {
      res.status(200).json(categories);
    })
    .catch(err => {
      res.status(400).json({ error: err });
    });
};

var deleteCategoryControllerFn = (req, res) => {
  const categoryId = req.params.categoryId;

  Category.findByIdAndDelete(categoryId)
    .then(() => {
      res.status(200).json({ message: 'Category deleted successfully' });
    })
    .catch(err => {
      res.status(400).json({ error: err });
    });
};
module.exports = {
    postCategoryControllerFn,
    getCategoriesControllerFn,
    deleteCategoryControllerFn
  };