import type { APIRoute } from 'astro';
import { getUserFromCookies } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const user = getUserFromCookies(cookies);

	if (!user) {
		return new Response(JSON.stringify({ error: 'Non authentifié' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(
		JSON.stringify({
			user: {
				id: user.userId,
				email: user.email,
			},
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		}
	);
};
