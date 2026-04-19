import validateRequest from '@/middlewares/validateRequest.js';
import { Router } from 'express';
import { ProductValidation } from './product.validation.js';
import { ProductController } from './product.controller.js';
import { upload } from '@/middlewares/multerMiddleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Comprehensive API module for managing products with dynamically generated codes and integrated Multi-part Cloudinary uploads
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated internal ID
 *         name:
 *           type: string
 *           description: The product's name
 *         description:
 *           type: string
 *           description: A brief summary or outline
 *         price:
 *           type: number
 *           description: Original price value
 *         discount:
 *           type: number
 *           description: Applicable discount percentage (0 to 100)
 *         finalPrice:
 *           type: number
 *           description: Dynamically computed backend cost (price minus discount percentage)
 *         image:
 *           type: string
 *           description: Secure URL linked to Cloudinary CDN
 *         status:
 *           type: string
 *           enum: [in stock, stock out]
 *           description: Real-time availability indicator
 *         productCode:
 *           type: string
 *           description: MD5 Hex + Algorithmically compiled substring indices (ex. p48asd4-0alport8)
 *         category:
 *           type: string
 *           description: Referenced Category Document ObjectId
 */

/**
 * @swagger
 * /api/v1/product/create-product:
 *   post:
 *     summary: Create a newly structured product
 *     operationId: createProduct
 *     description: Accepts multipart/form-data for file uploads, validates standard attributes, generates algorithmic productCode hash, and commits to MongoDB.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - image
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *                 default: 0
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Buffer format file upload directly to Cloudinary
 *               status:
 *                 type: string
 *                 enum: [in stock, stock out]
 *                 default: in stock
 *               category:
 *                 type: string
 *                 description: Asserts referential integrity against the Category schema
 *     responses:
 *       201:
 *         description: Product properly persisted to DB and Cloudinary
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
 *                   $ref: '#/components/schemas/Product'
 */
router.post(
    '/create-product',
    upload.single('image'),
    validateRequest(ProductValidation.createProductZodSchema),
    ProductController.createProduct
);

/**
 * @swagger
 * /api/v1/product/update-product/{productId}:
 *   patch:
 *     summary: Extensively update an existing product
 *     description: Modifies existing product parameters and optionally updates the Cloudinary image.
 *     operationId: updateProduct
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Hexadecimal Product ID Target
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new image to override existing Cloudinary attachment
 *               status:
 *                 type: string
 *                 enum: [in stock, stock out]
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Output confirms successfully overridden fields
 */
router.patch(
    '/update-product/:productId',
    upload.single('image'),
    validateRequest(ProductValidation.updateProductZodSchema),
    ProductController.updateProduct
);

/**
 * @swagger
 * /api/v1/product/get-all-products:
 *   get:
 *     summary: Extract heavily filtered products
 *     description: Fetches a paginated and filtered list of products based on search term or category.
 *     operationId: getAllProducts
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Execute $regex querying across 'name'
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Restrict queries directly to a category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Pagination start
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Pagination boundaries
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field mapping index criteria (e.g., name, price, discount, createdAt)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of items wrapped with precise pagination bounds
 */
router.get(
    '/get-all-products', 
    ProductController.getAllProducts
);

/**
 * @swagger
 * /api/v1/product/get-single-product/{productId}:
 *   get:
 *     summary: Read exclusively single product parameters
 *     description: Retrieves detailed attributes and category population for a single product ID.
 *     operationId: getSingleProduct
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Granular details mapped
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 */
router.get(
    '/get-single-product/:productId',
    ProductController.getSingleProduct
);

/**
 * @swagger
 * /api/v1/product/delete-product/{productId}:
 *   delete:
 *     summary: Eradicate single products completely
 *     operationId: deleteProduct
 *     description: Permanently obliterates Cloudinary CDN resources utilizing their secure API endpoints concurrently with flushing MongoDB traces.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Eradication status completion
 */
router.delete(
    '/delete-product/:productId',
    ProductController.deleteProduct
);

export const ProductRoutes = router;