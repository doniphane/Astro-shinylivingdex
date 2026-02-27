import mongoose from 'mongoose';

const MONGODB_URI = import.meta.env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kurozandex';

let isConnected = false;

export async function connectDB() {
	if (isConnected) {
		return;
	}

	try {
		const db = await mongoose.connect(MONGODB_URI);
		isConnected = db.connections[0].readyState === 1;
		console.log('✅ MongoDB connected');
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		throw error;
	}
}
