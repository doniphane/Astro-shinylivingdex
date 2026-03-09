import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { PokemonEncounter } from '../../../models/PokemonEncounter';
import { getUserFromCookies } from '../../../lib/auth';

export const prerender = false;

// GET - Fetch all encounters for the authenticated user
export const GET: APIRoute = async ({ cookies }) => {
	try {
		const user = getUserFromCookies(cookies);

		if (!user) {
			return new Response(JSON.stringify({ error: 'Non authentifié' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		const encounters = await PokemonEncounter.find({ userId: user.userId });

		// Return encounters as a map for easier lookup
		const encountersMap: Record<number, { encounterCount: number; masudaCount: number }> = {};
		encounters.forEach((enc) => {
			encountersMap[enc.pokemonId] = {
				encounterCount: enc.encounterCount,
				masudaCount: enc.masudaCount,
			};
		});

		return new Response(JSON.stringify({ encounters: encountersMap }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des encounters' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

// POST - Update encounter count
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const user = getUserFromCookies(cookies);

		if (!user) {
			return new Response(JSON.stringify({ error: 'Non authentifié' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { pokemonId, type, action, value } = await request.json();

		if (!pokemonId || typeof pokemonId !== 'number') {
			return new Response(JSON.stringify({ error: 'ID Pokémon invalide' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!type || !['encounter', 'masuda'].includes(type)) {
			return new Response(JSON.stringify({ error: 'Type invalide (encounter ou masuda)' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!action || !['increment', 'decrement', 'set'].includes(action)) {
			return new Response(JSON.stringify({ error: 'Action invalide (increment, decrement ou set)' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (action === 'set' && (typeof value !== 'number' || value < 0)) {
			return new Response(JSON.stringify({ error: 'Valeur invalide pour l\'action set' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Find existing encounter or create new one
		let encounter = await PokemonEncounter.findOne({
			userId: user.userId,
			pokemonId,
		});

		if (!encounter) {
			encounter = new PokemonEncounter({
				userId: user.userId,
				pokemonId,
				encounterCount: 0,
				masudaCount: 0,
			});
		}

		// Update the appropriate counter
		const fieldToUpdate = type === 'encounter' ? 'encounterCount' : 'masudaCount';

		if (action === 'set') {
			encounter[fieldToUpdate] = value;
		} else {
			const increment = action === 'increment' ? 1 : -1;
			encounter[fieldToUpdate] = Math.max(0, encounter[fieldToUpdate] + increment);
		}

		await encounter.save();

		return new Response(JSON.stringify({
			success: true,
			encounterCount: encounter.encounterCount,
			masudaCount: encounter.masudaCount,
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour de l\'encounter' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
