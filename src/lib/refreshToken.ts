// Client-side auto-refresh mechanism
// This script runs in the browser and automatically refreshes the access token

let refreshInterval: number | null = null;

// Refresh token 1 minute before expiration (access token expires in 15 minutes)
const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes

export async function refreshAccessToken(): Promise<boolean> {
	try {
		const response = await fetch('/api/auth/refresh', {
			method: 'POST',
			credentials: 'include',
		});

		if (!response.ok) {
			console.error('Failed to refresh token');
			return false;
		}

		console.log('✅ Token refreshed successfully');
		return true;
	} catch (error) {
		console.error('Error refreshing token:', error);
		return false;
	}
}

export function startAutoRefresh() {
	// Clear any existing interval
	if (refreshInterval) {
		clearInterval(refreshInterval);
	}

	// Refresh immediately on start (in case page was loaded after token expired)
	refreshAccessToken();

	// Set up periodic refresh
	refreshInterval = window.setInterval(async () => {
		const success = await refreshAccessToken();
		if (!success) {
			// If refresh fails, redirect to login
			console.error('Token refresh failed, redirecting to login...');
			window.location.href = '/login';
		}
	}, REFRESH_INTERVAL);

	console.log('🔄 Auto-refresh started (every 14 minutes)');
}

export function stopAutoRefresh() {
	if (refreshInterval) {
		clearInterval(refreshInterval);
		refreshInterval = null;
		console.log('⏹️ Auto-refresh stopped');
	}
}

// Auto-start on import (for authenticated pages)
if (typeof window !== 'undefined') {
	// Check if we're on an authenticated page (not login/register)
	const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
	if (!isAuthPage) {
		startAutoRefresh();
	}
}
