import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../utils/activity";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean; // TRUE until Supabase finishes restoring the session
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Listen for login/logout changes (fires immediately with current session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
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
