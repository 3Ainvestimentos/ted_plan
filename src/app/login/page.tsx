
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HardHat, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function LoginPage() {
  const { login, isAuthenticated, isLoading, isUnderMaintenance } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!isLoading && isAuthenticated) {
        router.replace('/strategic-initiatives'); // Redirect to a default page after login
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Do not allow login if under maintenance for non-admins
    if (isUnderMaintenance) {
        setError("A plataforma está em manutenção. Tente novamente mais tarde.");
        return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      // The useEffect above will handle the redirect once isAuthenticated is true.
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Erro de Login",
        description: err.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };


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
          <CardDescription>Insira suas credenciais para acessar a plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || isUnderMaintenance}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting || isUnderMaintenance}
              />
            </div>
             {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Acesso</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || isUnderMaintenance}>
              {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Entrar
            </Button>
          </form>

          {isUnderMaintenance && (
             <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
                <HardHat className="h-4 w-4 !text-orange-600" />
                <AlertTitle className="font-semibold">Plataforma em Manutenção</AlertTitle>
                <AlertDescription className="text-orange-700">
                    A plataforma está temporariamente indisponível para manutenção. Voltaremos em breve!
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
