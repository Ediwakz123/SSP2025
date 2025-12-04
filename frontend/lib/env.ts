// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// Ensures all required environment variables are present at runtime
// =============================================================================

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL: string;
  VITE_SUPABASE_FUNCTION_URL?: string;
}

function validateEnv(): EnvConfig {
  const requiredVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}`;
    console.error(`❌ ${errorMessage}`);
    
    // In development, show a helpful message
    if (import.meta.env.DEV) {
      console.error(
        "💡 Create a .env file in the frontend directory with:\n" +
        missing.map((v) => `${v}=your_value_here`).join("\n")
      );
    }
    
    throw new Error(errorMessage);
  }

  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    VITE_API_URL: (import.meta.env.VITE_API_URL as string) || "",
    VITE_SUPABASE_FUNCTION_URL: import.meta.env.VITE_SUPABASE_FUNCTION_URL as string | undefined,
  };
}

// Export validated environment configuration
export const env = validateEnv();

// Type-safe environment accessors
export const getSupabaseUrl = (): string => env.VITE_SUPABASE_URL;
export const getSupabaseAnonKey = (): string => env.VITE_SUPABASE_ANON_KEY;
export const getApiUrl = (): string => env.VITE_API_URL;
export const getEdgeFunctionUrl = (): string | undefined => env.VITE_SUPABASE_FUNCTION_URL;
