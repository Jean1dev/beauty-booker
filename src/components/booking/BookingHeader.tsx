import { Sparkles } from "lucide-react";

interface BookingHeaderProps {
  logoUrl?: string;
}

export const BookingHeader = ({ logoUrl }: BookingHeaderProps) => {
  return (
    <div className="text-center space-y-2">
      {logoUrl ? (
        <div className="inline-flex items-center justify-center mb-2">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-20 w-auto max-w-[200px] object-contain rounded-lg"
          />
        </div>
      ) : (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-medium mb-2">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Agende seu Horário
      </h1>
      <p className="text-muted-foreground">
        Escolha o serviço e o melhor horário para você
      </p>
    </div>
  );
};

