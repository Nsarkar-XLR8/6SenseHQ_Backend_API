import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProductService } from './product.service.js';
import { IProduct } from './product.interface.js';
import catchAsync from '@/utils/catchAsync.js';
import { sendResponse } from '@/utils/sendResponse.js';
import { pick } from '@/utils/pick.js';
import { buildPagination } from '@/utils/pagination.js';
import { uploadToCloudinaryFromMulter } from '@/utils/cloudinary.js';
import AppError from '@/errors/AppError.js';

/**
 * Logic: Create Product
 * Uses req.body to create a product and returns the generated productCode.
 */
const createProduct = catchAsync(async (req: Request, res: Response) => {
    // 1. Ensure file exists (Multer puts it in req.file)
    if (!req.file) {
        throw AppError.badRequest("Product image is required", [
            { path: "image", message: "Please upload a product image file" }
        ]);
    }

    // 2. Upload to Cloudinary (Step 3/4 logic)
    const uploadResult = await uploadToCloudinaryFromMulter(req.file, "products");

    // 3. Prepare Payload (Strict casting for form-data strings)
    const productData: IProduct = {
        ...req.body,
        category: req.body.category || req.body.categoryId,
        price: Number(req.body.price),
        discount: req.body.discount ? Number(req.body.discount) : 0,
        image: uploadResult.secure_url,
    };

    // 4. Persistence
    const result = await ProductService.createProductToDB(productData);

    sendResponse<IProduct>(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Product created successfully',
        data: result,
    });
});


/**
 * Logic: Get All Products
 * Parses query params for searching, filtering by category, and pagination.
 */
const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    // 1. Extract Filterable Fields
    // const filters = pick(req.query as any, ['searchTerm', 'category']);
    const filters = pick(req.query as Record<string, string>, ['searchTerm', 'category']);

    // 2. Extract Pagination/Sorting Fields
    const paginationInput = pick(req.query as any, ['page', 'limit', 'sortBy', 'sortOrder']);

    // 3. Transform to Strict Pagination Options
    const paginationOptions = buildPagination(paginationInput, {
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
        allowedSortBy: ['name', 'price', 'createdAt', 'discount'],
    });

    const result = await ProductService.getAllProductsFromDB(filters, paginationOptions);

    sendResponse<IProduct[]>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Products fetched successfully',
        meta: result.meta,
        data: result.data,
    });
});

/**
 * Logic: Update Product
 * Updates specific fields for a product identified by ID.
 */
const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params as { productId: string };

    // 1. Prepare the base update data from req.body
    // We cast numbers because form-data sends everything as strings
    const updateData: Partial<IProduct> = {
        ...req.body,
    };

    if (req.body.price) updateData.price = Number(req.body.price);
    if (req.body.discount !== undefined) updateData.discount = Number(req.body.discount);

    // 2. Handle Image Upload only if a new file is provided
    if (req.file) {
        const uploadResult = await uploadToCloudinaryFromMulter(req.file, "6sense_products");
        updateData.image = uploadResult.secure_url;
    }

    // 3. NOW call the service with the prepared updateData
    const result = await ProductService.updateProductInDB(productId, updateData);

    sendResponse<IProduct>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Product updated successfully',
        data: result
    });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const result = await ProductService.getSingleProductFromDB(productId);

    sendResponse<IProduct>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    await ProductService.deleteProductFromDB(productId);

    sendResponse<null>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Product deleted successfully',
        data: null
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};