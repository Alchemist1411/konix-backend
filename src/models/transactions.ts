import { Schema, model, Document } from 'mongoose';

interface ITransaction extends Document {
  address: string;
  transactions: Array<string>;
}

const transactionSchema = new Schema<ITransaction>({
  address: { type: String, required: true },
  transactions: { type: Array<string>, required: true },
});

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
