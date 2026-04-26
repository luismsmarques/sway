import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicSlot } from "./public-booking-types";
import { uiButton } from "./ui-tokens";

type BookingDrawerFormProps = {
  selectedSlot: PublicSlot | null;
  open: boolean;
  studentName: string;
  studentPhone: string;
  errorMessage: string | null;
  isPending: boolean;
  formatTime: (date: Date) => string;
  onOpenChange: (open: boolean) => void;
  onStudentNameChange: (value: string) => void;
  onStudentPhoneChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BookingDrawerForm({
  selectedSlot,
  open,
  studentName,
  studentPhone,
  errorMessage,
  isPending,
  formatTime,
  onOpenChange,
  onStudentNameChange,
  onStudentPhoneChange,
  onConfirm,
  onCancel,
}: BookingDrawerFormProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {selectedSlot ? (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-2xl font-semibold tracking-tight">
                Finalizar reserva
              </DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                {selectedSlot.title} - {formatTime(new Date(selectedSlot.startTime))}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 px-4 pb-2">
              <div className="space-y-2">
                <label htmlFor="student_name" className="text-sm font-medium text-slate-700">
                  Nome
                </label>
                <Input
                  id="student_name"
                  value={studentName}
                  onChange={(event) => onStudentNameChange(event.target.value)}
                  placeholder="O teu nome"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="student_phone" className="text-sm font-medium text-slate-700">
                  Telemovel
                </label>
                <Input
                  id="student_phone"
                  value={studentPhone}
                  onChange={(event) => onStudentPhoneChange(event.target.value)}
                  placeholder="+351 9xx xxx xxx"
                  inputMode="numeric"
                  pattern="[0-9+ ]*"
                  className="h-10"
                />
              </div>
              {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
            </div>
            <DrawerFooter>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={uiButton.primary}
              >
                {isPending ? "A confirmar..." : "Confirmar Reserva"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
