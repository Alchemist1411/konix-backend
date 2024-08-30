import { Schema, model, Document } from 'mongoose';

interface IPrice extends Document {
  timestamp: Date;
  price: number;
}

const priceSchema = new Schema<IPrice>({
  timestamp: { type: Date, default: Date.now },
  price: { type: Number, required: true },
});

export const Price = model<IPrice>('Price', priceSchema);
