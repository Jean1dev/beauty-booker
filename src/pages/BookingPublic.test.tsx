import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const { mockUseSearchParams, mockUseParams, mockUseBookingData, mockGetExcludedDays } =
  vi.hoisted(() => ({
    mockUseSearchParams: vi.fn(),
    mockUseParams: vi.fn(),
    mockUseBookingData: vi.fn(),
    mockGetExcludedDays: vi.fn(),
  }));

vi.mock("react-router-dom", () => ({
  useParams: mockUseParams,
  useSearchParams: mockUseSearchParams,
}));

vi.mock("@/hooks/use-booking-data", () => ({
  useBookingData: mockUseBookingData,
}));

vi.mock("@/services/excluded-days", () => ({
  getExcludedDays: mockGetExcludedDays,
}));

vi.mock("@/services/appointments", () => ({
  createAppointment: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("firebase/firestore", () => ({
  Timestamp: { fromDate: vi.fn(() => ({})) },
}));

// Layout components — not under test
vi.mock("@/components/booking/BookingHeader", () => ({
  BookingHeader: () => <div />,
}));

vi.mock("@/components/booking/ProgressIndicator", () => ({
  ProgressIndicator: () => <div />,
}));

vi.mock("@/components/booking/SuccessStep", () => ({
  SuccessStep: () => <div />,
}));

// Step 1 — clicking the button calls onSelect with the first service
vi.mock("@/components/booking/ServiceSelectionStep", () => ({
  ServiceSelectionStep: ({ onSelect, services }: any) => (
    <button onClick={() => onSelect(services[0])}>select-service</button>
  ),
}));

// Step 2 — clicking the button calls onTimeSelect with a fixed date/time
vi.mock("@/components/booking/DateTimeSelectionStep", () => ({
  DateTimeSelectionStep: ({ onTimeSelect }: any) => (
    <button onClick={() => onTimeSelect("2024-05-01", "10:00")}>select-time</button>
  ),
}));

// ConfirmationStep is NOT mocked — we verify the real phone input value

import BookingPublic from "./BookingPublic";

const MOCK_SERVICES = [
  { id: "s1", name: "Corte de Cabelo", duration: 30, durationUnit: "min" as const, price: 50 },
];

const DEFAULT_BOOKING_DATA = {
  services: MOCK_SERVICES,
  availability: null,
  userId: "user-123",
  logoUrl: null,
  bookedSlots: [],
  isLoading: false,
  error: null,
};

async function renderAndGoToStep3() {
  await act(async () => {
    render(<BookingPublic />);
  });
  fireEvent.click(screen.getByText("select-service"));
  fireEvent.click(screen.getByText("select-time"));
}

describe("BookingPublic – parâmetro phoneNumber na URL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ userLink: "meu-link" });
    mockUseBookingData.mockReturnValue(DEFAULT_BOOKING_DATA);
    mockGetExcludedDays.mockResolvedValue([]);
  });

  it("pré-preenche o campo telefone quando phoneNumber está na URL", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("phoneNumber=11999998888")]);

    await renderAndGoToStep3();

    const phoneInput = screen.getByPlaceholderText("(00) 00000-0000") as HTMLInputElement;
    expect(phoneInput.value).toBe("11999998888");
  });

  it("deixa o campo telefone vazio quando o parâmetro phoneNumber não está presente", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("")]);

    await renderAndGoToStep3();

    const phoneInput = screen.getByPlaceholderText("(00) 00000-0000") as HTMLInputElement;
    expect(phoneInput.value).toBe("");
  });

  it("permite o usuário editar o telefone pré-preenchido", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("phoneNumber=11999998888")]);

    await renderAndGoToStep3();

    const phoneInput = screen.getByPlaceholderText("(00) 00000-0000") as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "21988887777" } });
    expect(phoneInput.value).toBe("21988887777");
  });
});
