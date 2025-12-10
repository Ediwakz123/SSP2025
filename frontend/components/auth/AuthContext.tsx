import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../utils/activity";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // TRUE until Supabase finishes restoring the session
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ Track errors to prevent refresh loops
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    // 🔥 First, restore any existing session from storage
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (!isMounted) return;

      // 🛡️ Handle session restoration errors
      if (error) {
        console.warn("Session restoration failed:", error.message);
        // Clear corrupted session data
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      console.error("Critical auth error:", err);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // 🔥 Then listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // 🛡️ Handle TOKEN_REFRESHED failures to prevent loops
        if (event === "TOKEN_REFRESHED" && !newSession) {
          const now = Date.now();
          // Reset error count if last error was more than 30 seconds ago
          if (now - lastErrorTimeRef.current > 30000) {
            errorCountRef.current = 0;
          }

          errorCountRef.current++;
          lastErrorTimeRef.current = now;

          // If we've had 3+ refresh failures, sign out to break the loop
          if (errorCountRef.current >= 3) {
            console.warn("Too many token refresh failures, signing out to prevent loop");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }
        }

        // Reset error count on successful events
        if (newSession) {
          errorCountRef.current = 0;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // ⭐ Record login activity
        if (event === "SIGNED_IN" && newSession?.user) {
          logActivity("user_login", {
            user_id: newSession.user.id,
            email: newSession.user.email,
          });
        }

        // Optional: log logout
        if (event === "SIGNED_OUT") {
          logActivity("user_logout");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
