
import { Schema, model } from 'mongoose';
import { CategoryModel, ICategory } from './category.interface.js';


const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);