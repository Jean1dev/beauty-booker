import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useBookingData } from "@/hooks/use-booking-data";
import { Service } from "@/services/user-services";
import { processAvailability, AvailableSlot } from "@/services/availability-processor";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createAppointment } from "@/services/appointments";
import { Timestamp } from "firebase/firestore";
import { BookingHeader } from "@/components/booking/BookingHeader";
import { ProgressIndicator } from "@/components/booking/ProgressIndicator";
import { ServiceSelectionStep } from "@/components/booking/ServiceSelectionStep";
import { DateTimeSelectionStep } from "@/components/booking/DateTimeSelectionStep";
import { ConfirmationStep } from "@/components/booking/ConfirmationStep";
import { SuccessStep } from "@/components/booking/SuccessStep";

const BookingPublic = () => {
  const { userLink } = useParams<{ userLink: string }>();
  const { services, availability, userId, bookedSlots, isLoading, error } = useBookingData({ userLink: userLink || null });
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const processedAvailability = useMemo(() => {
    if (!selectedService || !availability) {
      return null;
    }

    const startDate = new Date();
    const endDate = addDays(new Date(), 30);
    
    return processAvailability(availability, selectedService, startDate, endDate, bookedSlots);
  }, [selectedService, availability, bookedSlots]);

  const availableDates = useMemo(() => {
    if (!processedAvailability) {
      return [];
    }

    const datesMap = new Map<string, AvailableSlot[]>();
    
    processedAvailability.availableSlots.forEach((slot) => {
      if (!datesMap.has(slot.date)) {
        datesMap.set(slot.date, []);
      }
      datesMap.get(slot.date)!.push(slot);
    });

    return Array.from(datesMap.entries())
      .map(([date, slots]) => ({
        date,
        label: format(parseISO(date), "EEE, d MMM", { locale: ptBR }),
        slots,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [processedAvailability]);

  const availableTimesForDate = useMemo(() => {
    if (!selectedDate || !processedAvailability) {
      return [];
    }

    const dateSlots = processedAvailability.availableSlots.filter(
      (slot) => slot.date === selectedDate
    );

    return dateSlots.map((slot) => slot.time).sort();
  }, [selectedDate, processedAvailability]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewBooking = () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime || !userId) {
      toast.error("Dados incompletos. Por favor, tente novamente.");
      return;
    }

    try {
      setIsSubmitting(true);

      const dateTime = parseISO(`${selectedDate}T${selectedTime}`);
      const timestamp = Timestamp.fromDate(dateTime);

      const appointmentData: any = {
        userId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        clientName: formData.name.trim(),
        clientPhone: formData.phone.trim(),
        date: selectedDate,
        time: selectedTime,
        dateTime: timestamp,
        duration: selectedService.duration,
        durationUnit: selectedService.durationUnit,
        status: "pending",
      };

      if (formData.notes.trim()) {
        appointmentData.clientNotes = formData.notes.trim();
      }

      await createAppointment(appointmentData);

      setIsSuccess(true);
      toast.success("Agendamento confirmado! Em breve você receberá a confirmação.");
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error.message || "Erro ao confirmar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDurationText = (duration: number, unit: "min" | "hour") => {
    return unit === "min" ? `${duration} min` : `${duration}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-medium mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  if (error || !userLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-medium">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Link não encontrado</h2>
            <p className="text-muted-foreground">
              O link de agendamento não foi encontrado ou não é válido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-medium">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nenhum serviço disponível</h2>
            <p className="text-muted-foreground">
              Este profissional ainda não possui serviços cadastrados.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <BookingHeader />
        <ProgressIndicator currentStep={step} />

        {step === 1 && (
          <ServiceSelectionStep
            services={services}
            onSelect={handleServiceSelect}
            getDurationText={getDurationText}
          />
        )}

        {step === 2 && selectedService && (
          <DateTimeSelectionStep
            selectedService={selectedService}
            availableDates={availableDates}
            selectedDate={selectedDate}
            availableTimesForDate={availableTimesForDate}
            selectedTime={selectedTime}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && !isSuccess && (
          <ConfirmationStep
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            formData={formData}
            isSubmitting={isSubmitting}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}

        {step === 3 && isSuccess && (
          <SuccessStep
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            clientName={formData.name}
            onNewBooking={handleNewBooking}
          />
        )}
      </div>
    </div>
  );
};

export default BookingPublic;
