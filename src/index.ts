import express, { Request, Response } from 'express';
import { Transaction } from './models/transactions';
import { Price } from './models/price';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();
const connectionString = process.env.MONGO_URI || "";

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(connectionString, {
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));


app.get('/api/transactions/:address', async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const response = await axios.get(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`
        );

        const transactions = response.data.result;

        const existingEntry = await Transaction.findOne({ address });
        if (existingEntry) {
            existingEntry.transactions = transactions;
            await existingEntry.save();
        } else {
            await new Transaction({ address, transactions }).save();
        }

        res.json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching transactions');
    }
});

cron.schedule('*/10 * * * *', async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
        const ethPrice = response.data.ethereum.inr;

        await new Price({ price: ethPrice }).save();

        console.log(`Ethereum price fetched and stored: ${ethPrice}`);
    } catch (error) {
        console.log('Error fetching Ethereum price', error);
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
