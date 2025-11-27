
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
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login();
      // The useEffect above will handle the redirect on successful login.
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
  // We also handle the case where the user is already logged in and we are just waiting for redirect.
  if (isLoading || isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-sidebar-background">
      <Card className="w-full max-w-md shadow-2xl bg-card text-card-foreground rounded-xl">
        <CardHeader className="flex items-center justify-center p-8 pb-4">
           <Image 
            src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Flogo%20oficial%20preta.png?alt=media&token=ce88dc80-01cd-4295-b443-951e6c0210aa"
            alt="3A Riva Investimentos Logo"
            width={200}
            height={80}
            className="h-auto"
            priority
           />
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Acesso</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} variant="outline" className="w-full h-12 text-base bg-white hover:bg-white border-gray-300" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Image
                  src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
                  alt="Google G icon"
                  width={20}
                  height={20}
                  className="mr-3 h-5 w-5"
                />
              )}
              Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
