import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// IMPORTANT: Use SERVICE ROLE KEY for updating user data
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getUserFromToken(req) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const token = auth.replace("Bearer ", "");

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// -------------------------
// GET /api/user/profile
// -------------------------
export async function GET(req) {
  try {
    const user = getUserFromToken(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, age, gender, phone, address, email, created_at"
      )
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// -------------------------
// PUT /api/user/profile
// -------------------------
export async function PUT(req) {
  try {
    const user = getUserFromToken(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { first_name, last_name, age, gender, phone, address } = body;

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        age,
        gender,
        phone,
        address,
        updated_at: new Date(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "Updated profile",
      metadata: { fields_changed: Object.keys(body) },
    });

    return new Response(
      JSON.stringify({ message: "Profile updated", data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
