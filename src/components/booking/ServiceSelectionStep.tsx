import { Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/services/user-services";

interface ServiceSelectionStepProps {
  services: Service[];
  onSelect: (service: Service) => void;
  getDurationText: (duration: number, unit: "min" | "hour") => string;
}

export const ServiceSelectionStep = ({
  services,
  onSelect,
  getDurationText,
}: ServiceSelectionStepProps) => {
  return (
    <Card className="shadow-medium animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Escolha um Serviço
        </CardTitle>
        <CardDescription>
          Selecione o serviço que deseja agendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum serviço disponível no momento
          </p>
        ) : (
          services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-secondary/50 transition-all text-left shadow-soft hover:shadow-medium group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: service.color }}
                  />
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Duração: {getDurationText(service.duration, service.durationUnit)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
};

