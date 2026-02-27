import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { User } from '../../../models/User';
import { getUserFromCookies, comparePassword, hashPassword } from '../../../lib/auth';

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

		const { currentPassword, newPassword } = await request.json();

		// Validation
		if (!currentPassword || !newPassword) {
			return new Response(JSON.stringify({ error: 'Tous les champs sont requis' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (newPassword.length < 6) {
			return new Response(JSON.stringify({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Find user
		const dbUser = await User.findById(user.userId);
		if (!dbUser) {
			return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Verify current password
		const isValidPassword = await comparePassword(currentPassword, dbUser.password);
		if (!isValidPassword) {
			return new Response(JSON.stringify({ error: 'Mot de passe actuel incorrect' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Hash and update new password
		const hashedPassword = await hashPassword(newPassword);
		await User.findByIdAndUpdate(user.userId, { password: hashedPassword });

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Mot de passe mis à jour avec succès',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Update password error:', error);
		return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
