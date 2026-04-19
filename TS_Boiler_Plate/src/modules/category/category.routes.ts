import validateRequest from '@/middlewares/validateRequest.js';
import express from 'express';
import { CategoryValidation } from './category.validation.js';
import { CategoryController } from './category.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: API module for assigning and categorizing product associations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated Mongoose ObjectId
 *         name:
 *           type: string
 *           description: The name structure of the category
 *         description:
 *           type: string
 *           description: A brief summary or outline of the category
 *         slug:
 *           type: string
 *           description: Auto-generated SEO-friendly URL variant
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of original document mounting
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of latest metadata modification
 */

/**
 * @swagger
 * /api/v1/category/create-category:
 *   post:
 *     summary: Create a new category
 *     description: Registers a new category for product classification.
 *     operationId: createCategory
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Electronics"
 *               description:
 *                 type: string
 *                 example: "Description of the category"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 */
router.post(
  '/create-category',
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

/**
 * @swagger
 * /api/v1/category/get-all-categories:
 *   get:
 *     summary: Retrieve all categories
 *     description: Fetches a paginated list of all active categories.
 *     operationId: getAllCategories
 *     tags: [Category]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Execute $regex querying across 'name'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Categories fetched successfully"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPage:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/get-all-categories', CategoryController.getAllCategories);

/**
 * @swagger
 * /api/v1/category/get-single-category/{categoryId}:
 *   get:
 *     summary: Retrieve a single category
 *     description: Retrieves metadata for a specific category by its ID.
 *     operationId: getSingleCategory
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: The internal ObjectId of the category to retrieve
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 */
router.get('/get-single-category/:categoryId', CategoryController.getSingleCategory);

/**
 * @swagger
 * /api/v1/category/update-category/{categoryId}:
 *   patch:
 *     summary: Update a single category
 *     description: Modifies existing category parameters.
 *     operationId: updateCategory
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: The designated target ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Electronics"
 *               description:
 *                 type: string
 *                 example: "Description of the category"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 */
router.patch(
  '/update-category/:categoryId', 
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

/**
 * @swagger
 * /api/v1/category/delete-category/{categoryId}:
 *   delete:
 *     summary: Delete a single category
 *     description: Permanently removes a category from the system.
 *     operationId: deleteCategory
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: The relevant Category ID explicitly marked for deletion
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 */
router.delete('/delete-category/:categoryId', CategoryController.deleteCategory);

export const CategoryRoutes = router;