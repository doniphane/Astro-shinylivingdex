import type { APIRoute } from 'astro';
import { clearAuthCookies, revokeRefreshToken, getUserFromCookies } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	try {
		// Get user to optionally revoke all their tokens
		const user = getUserFromCookies(cookies);

		// Revoke the current refresh token
		const refreshToken = cookies.get('refresh_token')?.value;
		if (refreshToken) {
			await revokeRefreshToken(refreshToken);
		}

		// Clear all auth cookies
		clearAuthCookies(cookies);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Logout error:', error);
		// Clear cookies anyway
		clearAuthCookies(cookies);
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
