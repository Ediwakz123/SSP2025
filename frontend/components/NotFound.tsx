import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from './ui/button';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative text-center space-y-8 max-w-lg mx-auto animate-fadeInUp">
                {/* 404 Illustration */}
                <div className="relative">
                    {/* Large 404 Background */}
                    <h1 className="text-[180px] md:text-[220px] font-heading font-bold text-gray-100 select-none leading-none">
                        404
                    </h1>

                    {/* Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-primary to-purple-600 shadow-2xl shadow-primary/30 flex items-center justify-center animate-bounce-gentle">
                                <Search className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -inset-2 bg-linear-to-br from-primary to-purple-600 rounded-3xl blur-xl opacity-30" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3 -mt-8">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
                        Page Not Found
                    </h2>
                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Oops! The page you're looking for seems to have wandered off. 
                        Let's get you back on track.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(-1)}
                        className="group min-w-40"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </Button>

                    <Button
                        variant="gradient"
                        size="lg"
                        onClick={() => navigate('/')}
                        className="group min-w-40"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Button>
                </div>

                {/* Help Link */}
                <p className="text-sm text-gray-400 pt-4">
                    Need help?{' '}
                    <button
                        onClick={() => navigate('/')}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        Contact Support
                    </button>
                </p>
            </div>
        </div>
    );
}
