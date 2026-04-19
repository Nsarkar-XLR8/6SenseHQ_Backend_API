import { PaginationResult } from "@/utils/pagination.js";
import { ICategory, ICategoryFilters, ICategoryResponse } from "./category.interface.js";
import { Category } from "./category.model.js";
import { isValidObjectId } from "mongoose";
import AppError from "@/errors/AppError.js";


const createCategoryIntoDB = async (payload: ICategory): Promise<ICategory> => {
  const result = await Category.create(payload);
  return result;
};

const getAllCategoriesFromDB = async (
  filters: ICategoryFilters,
  paginationOptions: PaginationResult
): Promise<ICategoryResponse> => {
  const { searchTerm } = filters;
  const { limit, page, skip, sort } = paginationOptions;

  // Search logic
  const query = searchTerm 
    ? { name: { $regex: searchTerm, $options: 'i' } } 
    : {};

  const result = await Category.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Category.countDocuments(query);

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

const updateCategoryInDB = async (
  categoryId: string,
  payload: Partial<ICategory>
): Promise<ICategory | null> => {
  if (!isValidObjectId(categoryId)) {
    throw AppError.badRequest("Invalid Category ID format.");
  }

  const finalUpdateData = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== "" && value !== undefined)
  );

  const result = await Category.findByIdAndUpdate(categoryId, finalUpdateData, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw AppError.notFound("Category not found.");
  }

  return result;
};

const deleteCategoryFromDB = async (categoryId: string): Promise<ICategory | null> => {
  if (!isValidObjectId(categoryId)) {
    throw AppError.badRequest("Invalid Category ID format.");
  }

  const result = await Category.findByIdAndDelete(categoryId);
  if (!result) {
    throw AppError.notFound("Category not found.");
  }

  return result;
};

const getSingleCategoryFromDB = async (categoryId: string): Promise<ICategory | null> => {
  if (!isValidObjectId(categoryId)) {
    throw AppError.badRequest("Invalid Category ID format.");
  }

  const isExist = await Category.findById(categoryId);
  if (!isExist) {
    throw AppError.notFound("Category not found.");
  }

  return isExist;
};

export const CategoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  updateCategoryInDB,
  deleteCategoryFromDB,
  getSingleCategoryFromDB,
};