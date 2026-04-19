import { Model, Types } from 'mongoose';

export type IProduct = {
  name: string;
  description: string;
  price: number;
  discount: number;
  image: string;
  status: 'in stock' | 'stock out';
  productCode: string; // The algorithmic field
  category: Types.ObjectId; // Reference field
};

export type ProductModel = Model<IProduct, Record<string, never>>;