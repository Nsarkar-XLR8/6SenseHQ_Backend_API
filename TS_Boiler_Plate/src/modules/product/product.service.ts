import { PaginationResult } from "../../utils/pagination.js";
import AppError from "../../errors/AppError.js"; // Adjust path based on your boilerplate
import { Category } from "../category/category.model.js";
import { IProduct } from "./product.interface.js";
import { Product } from "./product.model.js";
import { generateProductCode } from "./product.utils.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";
import mongoose from "mongoose";


const createProductToDB = async (payload: IProduct): Promise<IProduct> => {
    // 1. Verify Category exists before creating product
    const categoryExists = await Category.findById(payload.category);
    if (!categoryExists) {
        throw AppError.notFound("The associated category for this product does not exist.");
    }

    // 2. Generate unique Product Code via Step 3 Utility
    payload.productCode = generateProductCode(payload.name);

    // 3. Save to Database
    const result = await Product.create(payload);
    return result;
};


const getAllProductsFromDB = async (
    filters: { searchTerm?: string; category?: string },
    paginationOptions: PaginationResult
) => {
    const { searchTerm, category } = filters;
    const { limit, page, skip, sort } = paginationOptions;

    const query: Record<string, any> = {};

    // Search by Name (Partial match)
    if (searchTerm) {
        query.name = { $regex: searchTerm.trim(), $options: "i" };
    }

    // Filter by Category
    // if (category) {
    //     query.category = category;
    // }
    if (category && category.trim() !== "") {
        query.category = new mongoose.Types.ObjectId(category);
    }

    // Execute Data Fetch and Count in parallel for performance
    const [result, total] = await Promise.all([
        Product.find(query)
            .populate("category")
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Product.countDocuments(query),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data: result,
    };
};


const updateProductInDB = async (
    productId: string,
    payload: Partial<IProduct>
): Promise<IProduct> => {
    const isExist = await Product.findById(productId);
    if (!isExist) {
        throw AppError.notFound("Product update failed: Product not found.");
    }

   const finalUpdateData = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== "" && value !== undefined)
    );

    const result = await Product.findByIdAndUpdate(productId, finalUpdateData, {
        new: true,
        runValidators: true,
    });

    if (!result) {
        throw AppError.notFound("Product update failed: Product not found during update.");
    }

    return result;
};

const getSingleProductFromDB = async (productId: string): Promise<IProduct> => {
    const result = await Product.findById(productId).populate("category");
    if (!result) {
        throw AppError.notFound("Product not found.");
    }
    return result;
};

const deleteProductFromDB = async (productId: string): Promise<void> => {
    const product = await Product.findById(productId);
    if (!product) {
        throw AppError.notFound("Product not found.");
    }

    // Extract Cloudinary public_id and delete
    if (product.image) {
        try {
            const urlParts = product.image.split('/');
            const publicIdWithExtension = urlParts.slice(-2).join('/');
            const publicId = publicIdWithExtension.split('.')[0];
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (error) {
            console.error("Failed to delete product image from Cloudinary during product deletion:", error);
        }
    }

    await Product.findByIdAndDelete(productId);
};

export const ProductService = {
    createProductToDB,
    getAllProductsFromDB,
    getSingleProductFromDB,
    updateProductInDB,
    deleteProductFromDB,
};