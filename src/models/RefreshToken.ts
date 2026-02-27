import mongoose, { Schema, type Document } from 'mongoose';

export interface IRefreshToken extends Document {
	userId: mongoose.Types.ObjectId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	isRevoked: boolean;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	token: {
		type: String,
		required: true,
		unique: true,
	},
	expiresAt: {
		type: Date,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	isRevoked: {
		type: Boolean,
		default: false,
	},
});

// Index pour améliorer les performances
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }); // Pour nettoyer les tokens expirés

export const RefreshToken = mongoose.models.RefreshToken || mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
