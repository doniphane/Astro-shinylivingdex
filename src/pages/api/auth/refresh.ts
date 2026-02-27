import type { APIRoute } from 'astro';
import {
	verifyRefreshToken,
	generateAccessToken,
	generateRefreshToken,
	setAccessTokenCookie,
	setRefreshTokenCookie,
	revokeRefreshToken
} from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	try {
		const refreshToken = cookies.get('refresh_token')?.value;

		if (!refreshToken) {
			return new Response(JSON.stringify({ error: 'Refresh token manquant' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Verify refresh token
		const userData = await verifyRefreshToken(refreshToken);

		if (!userData) {
			return new Response(JSON.stringify({ error: 'Refresh token invalide ou expiré' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Revoke old refresh token (token rotation)
		await revokeRefreshToken(refreshToken);

		// Generate new tokens
		const newAccessToken = generateAccessToken({
			userId: userData.userId,
			email: userData.email || '',
		});

		const newRefreshToken = await generateRefreshToken(userData.userId);

		// Set new cookies
		setAccessTokenCookie(cookies, newAccessToken);
		setRefreshTokenCookie(cookies, newRefreshToken);

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Tokens rafraîchis avec succès',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Refresh token error:', error);
		return new Response(JSON.stringify({ error: 'Erreur lors du rafraîchissement du token' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
