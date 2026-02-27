import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { CaughtPokemon } from '../../../models/CaughtPokemon';
import { getUserFromCookies } from '../../../lib/auth';

export const prerender = false;

// GET - Fetch all caught Pokémon for the authenticated user
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

		const caughtPokemon = await CaughtPokemon.find({ userId: user.userId }).select('pokemonId');

		// Return array of pokemon IDs
		const pokemonIds = caughtPokemon.map((p) => p.pokemonId);

		return new Response(JSON.stringify({ pokemonIds }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des Pokémon' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

// POST - Mark a Pokémon as caught
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const user = getUserFromCookies(cookies);

		if (!user) {
			return new Response(JSON.stringify({ error: 'Non authentifié' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { pokemonId } = await request.json();

		if (!pokemonId || typeof pokemonId !== 'number') {
			return new Response(JSON.stringify({ error: 'ID Pokémon invalide' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Check if already caught
		const existing = await CaughtPokemon.findOne({
			userId: user.userId,
			pokemonId,
		});

		if (existing) {
			return new Response(JSON.stringify({ error: 'Pokémon déjà capturé' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Create new caught Pokémon
		await CaughtPokemon.create({
			userId: user.userId,
			pokemonId,
		});

		return new Response(JSON.stringify({ success: true }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la capture du Pokémon' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

// DELETE - Uncatch a Pokémon
export const DELETE: APIRoute = async ({ request, cookies }) => {
	try {
		const user = getUserFromCookies(cookies);

		if (!user) {
			return new Response(JSON.stringify({ error: 'Non authentifié' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { pokemonId } = await request.json();

		if (!pokemonId || typeof pokemonId !== 'number') {
			return new Response(JSON.stringify({ error: 'ID Pokémon invalide' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		const result = await CaughtPokemon.deleteOne({
			userId: user.userId,
			pokemonId,
		});

		if (result.deletedCount === 0) {
			return new Response(JSON.stringify({ error: 'Pokémon non trouvé' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la libération du Pokémon' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
