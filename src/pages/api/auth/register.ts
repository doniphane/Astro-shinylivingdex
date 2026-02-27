import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { User } from '../../../models/User';
import {
	hashPassword,
	generateAccessToken,
	generateRefreshToken,
	setAccessTokenCookie,
	setRefreshTokenCookie
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

		if (password.length < 6) {
			return new Response(
				JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return new Response(JSON.stringify({ error: 'Email invalide' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await connectDB();

		// Check if user exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return new Response(JSON.stringify({ error: 'Cet email est déjà utilisé' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Hash password and create user
		const hashedPassword = await hashPassword(password);
		const user = await User.create({
			email,
			password: hashedPassword,
		});

		// Generate Access Token (15 minutes)
		const accessToken = generateAccessToken({
			userId: user._id.toString(),
			email: user.email,
		});

		// Generate Refresh Token (30 days)
		const refreshToken = await generateRefreshToken(user._id.toString());

		// Set cookies
		setAccessTokenCookie(cookies, accessToken);
		setRefreshTokenCookie(cookies, refreshToken);

		return new Response(
			JSON.stringify({
				success: true,
				user: {
					id: user._id,
					email: user.email,
				},
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Erreur lors de l\'inscription' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
