import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AstroCookies } from 'astro';

const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes

export interface JWTPayload {
	userId: string;
	email: string;
	type?: 'access';
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

// Legacy function for backward compatibility
export function verifyToken(token: string): JWTPayload | null {
	return verifyAccessToken(token);
}

// Set access token cookie (short-lived)
export function setAccessTokenCookie(cookies: AstroCookies, token: string) {
	cookies.set('access_token', token, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/',
		maxAge: 15 * 60, // 15 minutes
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

// Clear auth cookies
export function clearAuthCookies(cookies: AstroCookies) {
	cookies.delete('access_token', { 
		path: '/',
		secure: true,
		sameSite: 'strict'
	});
	cookies.delete('auth_token', { path: '/' }); // Legacy
}

// Legacy function
export function clearAuthCookie(cookies: AstroCookies) {
	clearAuthCookies(cookies);
}
