import catchAsync from '@/utils/catchAsync.js';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { CategoryService } from './category.service.js';
import { sendResponse } from '@/utils/sendResponse.js';
import { ICategory } from './category.interface.js';
import { pick } from '@/utils/pick.js';
import { buildPagination } from '@/utils/pagination.js';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.createCategoryIntoDB(req.validated?.body);

  sendResponse<ICategory>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});


const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  // 1. Extract Filter criteria
  const filters = pick(req.query as any, ['searchTerm']);
  
  // 2. Extract Pagination criteria
  const paginationInput = pick(req.query as any, ['page', 'limit', 'sortBy', 'sortOrder']);
  
  // 3. Transform to strict PaginationResult
  const paginationOptions = buildPagination(paginationInput, {
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    allowedSortBy: ['name', 'createdAt'],
  });

  const result = await CategoryService.getAllCategoriesFromDB(filters, paginationOptions);

  sendResponse<ICategory[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});


const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params as { categoryId: string };
  const result = await CategoryService.updateCategoryInDB(categoryId, req.validated?.body);

  sendResponse<ICategory | null>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params as { categoryId: string };
  await CategoryService.deleteCategoryFromDB(categoryId);

  sendResponse<ICategory | null>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: null,
  });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params as { categoryId: string };
  const result = await CategoryService.getSingleCategoryFromDB(categoryId);

  sendResponse<ICategory | null>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category fetched successfully',
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getSingleCategory,
};