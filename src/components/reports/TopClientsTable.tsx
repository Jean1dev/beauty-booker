import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientSummary } from "@/services/reports";

interface TopClientsTableProps {
  clients: ClientSummary[];
}

export const TopClientsTable = ({ clients }: TopClientsTableProps) => {
  if (clients.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhum cliente no período
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead className="hidden sm:table-cell">Telefone</TableHead>
          <TableHead className="text-center">Agend.</TableHead>
          <TableHead className="text-right">Último</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.clientPhone || client.clientName}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {client.clientName}
                {client.appointmentsCount >= 2 && (
                  <Badge variant="secondary" className="text-[10px]">
                    Recorrente
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-muted-foreground">
              {client.clientPhone}
            </TableCell>
            <TableCell className="text-center">{client.appointmentsCount}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {format(client.lastAppointment, "dd/MM/yyyy", { locale: ptBR })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
