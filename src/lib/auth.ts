import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AstroCookies } from 'astro';
import crypto from 'crypto';
import { connectDB } from './db';
import { RefreshToken } from '../models/RefreshToken';

const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface JWTPayload {
	userId: string;
	email: string;
	type?: 'access' | 'refresh';
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

// Generate Access Token (short-lived)
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
	return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

// Generate Refresh Token (long-lived, stored in DB)
export async function generateRefreshToken(userId: string): Promise<string> {
	await connectDB();

	// Generate unique token
	const token = crypto.randomBytes(64).toString('hex');
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

	// Store in database
	await RefreshToken.create({
		userId,
		token,
		expiresAt,
	});

	return token;
}

// Legacy function for backward compatibility (now generates access token)
export function generateToken(payload: JWTPayload): string {
	return generateAccessToken(payload);
}

// Verify Access Token
export function verifyAccessToken(token: string): JWTPayload | null {
	try {
		const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
		if (payload.type !== 'access') return null;
		return payload;
	} catch (error) {
		return null;
	}
}

// Verify Refresh Token (check DB)
export async function verifyRefreshToken(token: string): Promise<{ userId: string; email?: string } | null> {
	try {
		await connectDB();

		const refreshToken = await RefreshToken.findOne({
			token,
			isRevoked: false,
			expiresAt: { $gt: new Date() },
		}).populate('userId');

		if (!refreshToken) return null;

		const userDoc = refreshToken.userId as any;

		return {
			userId: userDoc._id.toString(),
			email: userDoc.email,
		};
	} catch (error) {
		return null;
	}
}

// Legacy function for backward compatibility
export function verifyToken(token: string): JWTPayload | null {
	return verifyAccessToken(token);
}

// Set access token cookie (short-lived)
export function setAccessTokenCookie(cookies: AstroCookies, token: string) {
	cookies.set('access_token', token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: import.meta.env.PROD ? 'none' : 'lax',
		path: '/',
		maxAge: 15 * 60, // 15 minutes
	});
}

// Set refresh token cookie (long-lived)
export function setRefreshTokenCookie(cookies: AstroCookies, token: string) {
	cookies.set('refresh_token', token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: import.meta.env.PROD ? 'none' : 'lax',
		path: '/',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	});
}

// Legacy function for backward compatibility
export function setAuthCookie(cookies: AstroCookies, token: string) {
	setAccessTokenCookie(cookies, token);
}

// Get user from cookies
export function getUserFromCookies(cookies: AstroCookies): JWTPayload | null {
	// Try access token first
	const accessToken = cookies.get('access_token')?.value;
	if (accessToken) {
		const payload = verifyAccessToken(accessToken);
		if (payload) return payload;
	}

	// Fallback to legacy auth_token for backward compatibility
	const legacyToken = cookies.get('auth_token')?.value;
	if (legacyToken) {
		return verifyToken(legacyToken);
	}

	return null;
}

// Revoke all refresh tokens for a user
export async function revokeRefreshTokensForUser(userId: string) {
	await connectDB();
	await RefreshToken.updateMany(
		{ userId, isRevoked: false },
		{ isRevoked: true }
	);
}

// Revoke specific refresh token
export async function revokeRefreshToken(token: string) {
	await connectDB();
	await RefreshToken.updateOne(
		{ token },
		{ isRevoked: true }
	);
}

// Clear auth cookies
export function clearAuthCookies(cookies: AstroCookies) {
	const cookieOptions = {
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: (import.meta.env.PROD ? 'none' : 'lax') as const,
	};

	cookies.delete('access_token', cookieOptions);
	cookies.delete('refresh_token', cookieOptions);
	cookies.delete('auth_token', cookieOptions); // Legacy
}

// Legacy function
export function clearAuthCookie(cookies: AstroCookies) {
	clearAuthCookies(cookies);
}
