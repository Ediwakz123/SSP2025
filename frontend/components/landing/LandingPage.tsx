import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { MapPin, Shield, Users, Target, BarChart3 } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6">
            <MapPin className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl mb-4">Strategic Store Placement</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Optimizing Business Location Using K-Means Clustering
          </p>
          <p className="text-lg text-muted-foreground">
            Brgy. Sta. Cruz, Santa Maria, Bulacan
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            A comprehensive business analytics platform powered by AI and real field survey data
          </p>
        </div>

        {/* Features Grid — AI Recommendations Removed */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Target className="w-12 h-12 text-primary mb-4" />
              <CardTitle>K-Means Clustering</CardTitle>
              <CardDescription>
                Advanced clustering algorithm using Haversine distance formula for accurate geographic analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Comprehensive data visualization with interactive maps, charts, and competitor analysis
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Portals Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* User Portal */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">User Portal</CardTitle>
              <CardDescription>
                Access clustering analysis and business recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>K-Means Clustering Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Interactive Map Visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Business Opportunities</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Personal Profile</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={onNavigateToLogin}
              >
                Access User Portal
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription>
                Manage system, users, and seed data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>System Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>User Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>Activity Logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>Analytics Overview</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>Seed Data Management</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700" 
                onClick={onNavigateToLogin}
              >
                Access Admin Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16">
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">60+</div>
            <div className="text-sm text-muted-foreground">Real Businesses</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">11,364</div>
            <div className="text-sm text-muted-foreground">Population</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Accurate Data</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">AI</div>
            <div className="text-sm text-muted-foreground">Powered</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to find the perfect location for your business?
          </p>
          <Button size="lg" onClick={onNavigateToLogin}>
            Get Started Now
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Thesis Project © 2025</p>
          <p className="mt-2">
            Strategic Store Placement System | Brgy. Sta. Cruz, Santa Maria, Bulacan
          </p>
        </div>
      </div>
    </div>
  );
}
