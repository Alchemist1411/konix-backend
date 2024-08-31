import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
    address: string;
    transactions: Array<string> | null;
}

const transactionSchema = new Schema<ITransaction>({
    address: { type: String, required: true },
    transactions: { type: Array, required: true },
});

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
