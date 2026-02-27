import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { User } from '../../../models/User';
import {
	comparePassword,
	generateAccessToken,
	setAccessTokenCookie
} from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		// Validation
		if (!email || !password) {
			return new Response(JSON.stringify({ error: 'Email et mot de passe requis' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Find user
		const user = await User.findOne({ email });
		if (!user) {
			return new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Verify password
		const isValidPassword = await comparePassword(password, user.password);
		if (!isValidPassword) {
			return new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Generate Access Token (15 minutes)
		const accessToken = generateAccessToken({
			userId: user._id.toString(),
			email: user.email,
		});

		// Set cookie
		setAccessTokenCookie(cookies, accessToken);

		return new Response(
			JSON.stringify({
				success: true,
				user: {
					id: user._id,
					email: user.email,
				},
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de la connexion' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
