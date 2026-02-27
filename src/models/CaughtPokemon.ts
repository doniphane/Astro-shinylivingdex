import mongoose, { Schema, type Document } from 'mongoose';

export interface ICaughtPokemon extends Document {
	userId: mongoose.Types.ObjectId;
	pokemonId: number;
	caughtAt: Date;
}

const CaughtPokemonSchema = new Schema<ICaughtPokemon>({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	pokemonId: {
		type: Number,
		required: true,
	},
	caughtAt: {
		type: Date,
		default: Date.now,
	},
});

// Create compound index to prevent duplicate catches
CaughtPokemonSchema.index({ userId: 1, pokemonId: 1 }, { unique: true });

export const CaughtPokemon = mongoose.models.CaughtPokemon || mongoose.model<ICaughtPokemon>('CaughtPokemon', CaughtPokemonSchema);
