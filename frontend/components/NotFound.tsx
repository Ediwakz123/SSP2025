import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md mx-auto">
                {/* 404 Graphic or Text */}
                <h1 className="text-9xl font-heading font-bold text-muted/20 select-none">404</h1>

                <div className="relative -mt-16 space-y-2">
                    <h2 className="text-3xl font-heading font-bold text-foreground">Page not found</h2>
                    <p className="text-muted-foreground">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-2.5 text-foreground bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-2.5 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
