// Real JWT Authentication Utilities (Connected to FastAPI Backend)
import axios from "axios";


export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
}

export interface AuthToken {
    token: string;
    expiresAt: number;
}

// Base API URL — replace with your deployed backend or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1/auth";

/**
 * Decode a JWT token (without verification)
 */
function decodeToken(token: string): { exp: number;[key: string]: any } | null {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

/**
 * Save auth info in localStorage
 */
function storeAuth(token: string, user: User) {
    const decoded = decodeToken(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { token, expiresAt };
}

/**
 * Login user via backend
 */
export async function login(email: string, password: string): Promise<{ user: User; token: AuthToken }> {
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI expects 'username'
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed");
    }

    const data = await response.json();
    const { access_token, user } = data;
    const tokenData = storeAuth(access_token, user);

    return { user, token: { token: access_token, expiresAt: tokenData.expiresAt } };
}

/**
 * Register new user via backend
 */
export async function register(email: string, password: string, name: string): Promise<{ user: User; token: AuthToken }> {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
    }

    const data = await response.json();
    const { access_token, user } = data;
    const tokenData = storeAuth(access_token, user);

    return { user, token: { token: access_token, expiresAt: tokenData.expiresAt } };
}

/**
 * Logout user
 */
export function logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
    const userJson = localStorage.getItem("user");
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
        logout();
        return false;
    }
    return true;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error("Failed to send password reset request");
    }
}

/**
 * Verify token validity
 */
export function verifyToken(): boolean {
    return isAuthenticated();
}
