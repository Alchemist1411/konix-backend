import express, { Request, Response } from 'express';
import { Transaction } from './models/transactions';
import { Price } from './models/price';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const connectionString = process.env.MONGO_URI || '';
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(connectionString, {})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));


app.get('/api/transactions/:address', async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const response = await axios.get(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`
        );

        const transactions = response.data.result;

        if (!transactions || transactions.length === 0) {
            return res.status(404).send('No transactions found for this address');
        }

        const existingEntry = await Transaction.findOne({ address });
        if (existingEntry) {
            existingEntry.transactions = transactions;
            await existingEntry.save();
        } else {
            await new Transaction({ address, transactions }).save();
        }

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', (error as any).message);
        res.status(500).send('Error fetching transactions');
    }
});

app.get('/api/expenses/:address', async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const transactionData = await Transaction.findOne({ address });
        if (!transactionData) return res.status(404).send('Address not found');

        const lastPrice = await Price.findOne().sort({ timestamp: -1 });
        if (!lastPrice) return res.status(500).send('Price data unavailable');

        const expenses = transactionData.transactions?.reduce((acc, tx) => {
            const parsedTx = JSON.parse(tx);
            const gasUsed = parseInt(parsedTx.gasUsed);
            const gasPrice = parseInt(parsedTx.gasPrice);
            const expense = (gasUsed * gasPrice) / 1e18; // Converting wei to ether
            return acc + expense;
        }, 0);

        res.json({ expenses, currentEthPrice: lastPrice.price });
    } catch (error) {
        console.error('Error calculating expenses:', (error as any).message);
        res.status(500).send('Error calculating expenses');
    }
});

cron.schedule('*/10 * * * *', async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
        const ethPrice = response.data.ethereum.inr;

        await new Price({ price: ethPrice }).save();

        console.log(`Ethereum price fetched and stored: ${ethPrice}`);
    } catch (error) {
        console.error('Error fetching Ethereum price:', (error as any).message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
