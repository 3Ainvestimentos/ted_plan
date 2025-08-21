
import { HardHat } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <HardHat className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold text-foreground mb-2">Sistema em Manutenção</h1>
        <p className="text-lg text-muted-foreground max-w-md">
            Estamos realizando algumas melhorias na plataforma. Voltaremos em breve. Agradecemos a sua paciência.
        </p>
    </div>
  );
}
