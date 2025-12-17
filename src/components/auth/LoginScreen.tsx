import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Sparkles, Zap, Shield, TrendingUp, Users } from 'lucide-react';

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
      toast({
        title: "Welcome!",
        description: "You've successfully signed in to Finance Coach.",
      });
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "An error occurred during sign in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(to bottom right, #1a1a1a, #0f0f0f, #1e1e1e)`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-50" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-6"
      >
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <CardHeader className="text-center pb-6">
            {/* Logo Section */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-emerald-400/20 via-emerald-500/30 to-cyan-400/10 border border-white/10 shadow-[0_0_40px_rgba(0,255,163,0.2)]">
                  <DollarSign className="h-10 w-10 text-emerald-300 drop-shadow-[0_0_15px_rgba(0,255,163,0.6)]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full border-2 border-[#0f0f0f] shadow-[0_0_15px_rgba(0,255,200,0.6)]">
                  <Sparkles className="w-3 h-3 text-white m-1" />
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-black bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,255,163,0.3)] mb-2">
              Finance Coach
            </CardTitle>
            
            <CardDescription className="text-lg text-neutral-300 font-medium flex items-center justify-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              Your AI-Powered Financial Advisor
            </CardDescription>

            <CardDescription className="text-base text-neutral-400 leading-relaxed">
              Sign in with Google to access your personal financial dashboard, AI insights, and secure data storage.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Features Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-emerald-300 text-center">Why Finance Coach?</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>Secure & private financial data</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>AI-powered insights & recommendations</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>Personal financial coaching</span>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <p className="text-xs text-neutral-500 text-center leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              Your financial data is encrypted and never shared with third parties.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}