import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, request }) => {
	const allCookies = {
		access_token: cookies.get('access_token')?.value ? 'present' : 'missing',
		refresh_token: cookies.get('refresh_token')?.value ? 'present' : 'missing',
	};

	const headers = {
		cookie: request.headers.get('cookie') || 'no cookie header',
		origin: request.headers.get('origin') || 'no origin',
		referer: request.headers.get('referer') || 'no referer',
	};

	const env = {
		NODE_ENV: process.env.NODE_ENV,
		PROD: import.meta.env.PROD,
	};

	return new Response(
		JSON.stringify({
			cookies: allCookies,
			headers,
			env,
			timestamp: new Date().toISOString(),
		}, null, 2),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		}
	);
};
