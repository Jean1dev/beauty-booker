import { ChevronRight } from "lucide-react";
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
    <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden animate-slide-up">
      <div className="px-6 py-5 border-b border-border">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
          Passo 1
        </p>
        <h2 className="font-display text-2xl font-normal text-foreground">
          Escolha um Serviço
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o serviço que deseja agendar
        </p>
      </div>
      <div className="p-4 space-y-2">
        {services.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Nenhum serviço disponível no momento
          </p>
        ) : (
          services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-secondary/30 transition-all text-left group hover:shadow-soft hover:-translate-y-px duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: service.color }}
                  />
                  <div>
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duração: {getDurationText(service.duration, service.durationUnit)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
