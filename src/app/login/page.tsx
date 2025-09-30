
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login();
      // The AuthProvider's useEffect will handle the redirect on successful login.
    } catch (err: any) {
      const errorMessage = err.message || "Ocorreu um erro durante o login. Tente novamente.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro de Acesso",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // The main layout and auth provider will show a spinner while loading
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#2B2A27' }}>
      <Card className="w-full max-w-md shadow-xl bg-card text-card-foreground">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-headline mt-6">Bem-vindo ao Ted 1.0</CardTitle>
          <CardDescription>Use sua conta Google para acessar a plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Acesso</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.2 0 128.3 109.2 17.1 244 17.1 315.3 17.1 377.3 46.8 423.4 89.8l-65.7 64.2c-20.3-19.1-46.7-30.9-78.7-30.9-61.9 0-112.2 50.8-112.2 113.3s50.3 113.3 112.2 113.3c72.1 0 98.4-48.9 101.9-72.3H244v-85.1h243.9c1.3 12.8 2.1 26.6 2.1 41.8z"></path>
                </svg>
              )}
              Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
