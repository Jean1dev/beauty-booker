interface BookingHeaderProps {
  logoUrl?: string;
}

export const BookingHeader = ({ logoUrl }: BookingHeaderProps) => {
  return (
    <div className="text-center space-y-3 py-4">
      {logoUrl ? (
        <div className="inline-flex items-center justify-center mb-2">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-20 w-auto max-w-[200px] object-contain rounded-xl"
          />
        </div>
      ) : (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <span className="font-display italic text-primary text-lg font-light">B</span>
        </div>
      )}
      <h1 className="font-display text-4xl font-light text-foreground tracking-tight">
        Agende seu <em className="italic text-primary">Horário</em>
      </h1>
      <p className="text-sm text-muted-foreground">
        Escolha o serviço e o melhor horário para você
      </p>
    </div>
  );
};
