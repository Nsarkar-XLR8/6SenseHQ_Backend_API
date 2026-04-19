import { Schema, model } from 'mongoose';
import { IProduct, ProductModel } from './product.interface.js';


const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    image: { type: String, required: true },
    status: {
      type: String,
      enum: ['in stock', 'stock out'],
      lowercase: true,
      default: 'in stock',
    },
    productCode: { 
      type: String, 
      unique: true,
      // We'll leave 'required: true' out for now since it's generated on save
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Requirement: Pricing Calculation
 * Include the final price after applying the discount percentage.
 */
productSchema.virtual('finalPrice').get(function () {
  const discountAmount = this.price * (this.discount / 100);
  return Number((this.price - discountAmount).toFixed(2));
});

export const Product = model<IProduct, ProductModel>('Product', productSchema);