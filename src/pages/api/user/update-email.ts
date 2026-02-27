import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { User } from '../../../models/User';
import { getUserFromCookies, clearAuthCookies } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		// Check authentication
		const user = getUserFromCookies(cookies);
		if (!user) {
			return new Response(JSON.stringify({ error: 'Non authentifié' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { newEmail } = await request.json();

		// Validation
		if (!newEmail) {
			return new Response(JSON.stringify({ error: 'Nouvel email requis' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return new Response(JSON.stringify({ error: 'Format d\'email invalide' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Check if email is already taken
		const existingUser = await User.findOne({ email: newEmail });
		if (existingUser) {
			return new Response(JSON.stringify({ error: 'Cet email est déjà utilisé' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Update user email
		await User.findByIdAndUpdate(user.userId, { email: newEmail });

		// Clear cookies to force re-login with new email
		clearAuthCookies(cookies);

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Email mis à jour avec succès',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour de l\'email' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
