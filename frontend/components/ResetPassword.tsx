import { useSearchParams } from "react-router-dom";
import { useState } from "react";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await fetch("http://localhost:8000/api/v1/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, new_password: password }),
        });

        if (response.ok) {
            alert("Password reset successful!");
            window.location.href = "/login";
        } else {
            alert("Invalid or expired link");
        }
    };

    return (
        <div className="reset-container">
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
}
