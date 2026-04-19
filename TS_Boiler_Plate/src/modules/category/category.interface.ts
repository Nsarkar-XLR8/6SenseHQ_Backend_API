import { Model } from 'mongoose';

export type ICategory = {
  name: string;
  description?: string;
};

export type ICategoryFilters = {
  searchTerm?: string;
};

export type ICategoryResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: ICategory[];
};

// For the Model
export type CategoryModel = Model<ICategory, Record<string, never>>;