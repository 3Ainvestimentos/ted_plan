
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HardHat } from "lucide-react";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.836,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export default function LoginPage() {
  const { login, isAuthenticated, isLoading, isUnderMaintenance, setIsUnderMaintenance } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect only handles redirection *after* auth state is confirmed.
    if (!isLoading && isAuthenticated) {
        router.replace('/strategic-panel');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // This effect ensures the maintenance message is cleared if the user navigates away
  useEffect(() => {
    return () => {
        setIsUnderMaintenance(false);
    }
  }, [setIsUnderMaintenance]);


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
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-2xl font-headline mt-6">Bem-vindo ao Ted 1.0</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUnderMaintenance && (
             <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
                <HardHat className="h-4 w-4 !text-orange-600" />
                <AlertTitle className="font-semibold">Plataforma em Manutenção</AlertTitle>
                <AlertDescription className="text-orange-700">
                    A plataforma está temporariamente indisponível para manutenção. Voltaremos em breve!
                </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center py-4">
            <Button onClick={login} variant="outline" className="w-full max-w-xs h-12 text-base hover:bg-card">
                <GoogleIcon className="mr-3"/>
                Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
