'use strict';

const { Category } = require('../../../models');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');
const { Op } = require('sequelize'); // Add this line to import Op

// Validation rules for category creation
const categoryValidationRules = [
  body('category_name').notEmpty().withMessage('Category name is required'),
];

// Utility function to handle errors
const handleErrors = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({ error: error.message || 'An error occurred' });
};

// Create Category
exports.createCategory = [
  ...categoryValidationRules, // Validate request body
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if the category already exists (excluding soft-deleted ones)
      const existingCategory = await Category.findOne({
        where: { 
          category_name: req.body.category_name,
          is_deleted: 0 // Only check for active categories
        }
      });

      if (existingCategory) {
        return res.status(409).json({ error: 'Category name already exists and is active.' });
      }

      // If the category exists with is_deleted = 1 (soft-deleted), allow creation
      const deletedCategory = await Category.findOne({
        where: { 
          category_name: req.body.category_name,
          is_deleted: 1 // Check for soft-deleted categories
        }
      });

      if (deletedCategory) {
        // Restore the soft-deleted category or create a new one if needed
        // Assuming you might want to reactivate the soft-deleted category
        await deletedCategory.update({ is_deleted: 0 });

        return res.status(200).json({ message: 'Category reactivated successfully', category: deletedCategory });
      }

      // Create the category if not found
      const newCategory = await Category.create({
        sector_name: req.body.sector_name, // optional
        category_name: req.body.category_name, // required
        is_deleted: 0 // Set it as active by default
      });

      // Respond with the newly created category
      return res.status(201).json(newCategory);
    } catch (error) {
      return handleErrors(res, error);
    }
  }
];


// Get all Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_deleted: false }
    });
    return res.status(200).json(categories);
  } catch (error) {
    return handleErrors(res, error);
  }
};

// Get Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, is_deleted: false }
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json(category);
  } catch (error) {
    return handleErrors(res, error);
  }
};

// Update Category
exports.updateCategory = [
  ...categoryValidationRules, // Validate request body
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryId = req.params.id;
      const categoryName = req.body.category_name;

      // Check if the category already exists (excluding the current category) and ensure it's not soft-deleted
      const existingCategory = await Category.findOne({
        where: { 
          category_name: categoryName, 
          id: { [Op.ne]: categoryId }, // Exclude the current category
          is_deleted: 0 // Only check for active categories
        }
      });

      if (existingCategory) {
        return res.status(409).json({ error: 'Category with this name already exists and is active' });
      }

      // Check for soft-deleted category with the same name
      const deletedCategory = await Category.findOne({
        where: { 
          category_name: categoryName,
          is_deleted: 1 // Check for soft-deleted categories
        }
      });

      if (deletedCategory) {
        // Reactivate the soft-deleted category
        await deletedCategory.update({ is_deleted: 0 });

        return res.status(200).json({ message: 'Category reactivated successfully', category: deletedCategory });
      }

      // Update category if no conflict with name
      const [updated] = await Category.update(req.body, {
        where: { id: categoryId },
      });

      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }

      return res.status(200).json({ message: 'Category updated successfully' });
    } catch (error) {
      return handleErrors(res, error);
    }
  }
];


// Delete Category (Mark as deleted)
exports.deleteCategory = [
  async (req, res) => {
    try {
      const [updated] = await Category.update(
        { is_deleted: true },
        { where: { id: req.params.id } }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.status(200).json({ message: 'Category marked as deleted successfully' });
    } catch (error) {
      return handleErrors(res, error);
    }
  }
];
