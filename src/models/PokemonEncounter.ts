import mongoose, { Schema, type Document } from 'mongoose';

export interface IPokemonEncounter extends Document {
	userId: mongoose.Types.ObjectId;
	pokemonId: number;
	encounterCount: number;
	masudaCount: number;
	updatedAt: Date;
}

const PokemonEncounterSchema = new Schema<IPokemonEncounter>({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	pokemonId: {
		type: Number,
		required: true,
	},
	encounterCount: {
		type: Number,
		default: 0,
		min: 0,
	},
	masudaCount: {
		type: Number,
		default: 0,
		min: 0,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Create compound index to ensure one encounter record per user per Pokémon
PokemonEncounterSchema.index({ userId: 1, pokemonId: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
PokemonEncounterSchema.pre('save', function() {
	this.updatedAt = new Date();
});

export const PokemonEncounter = mongoose.models.PokemonEncounter || mongoose.model<IPokemonEncounter>('PokemonEncounter', PokemonEncounterSchema);
