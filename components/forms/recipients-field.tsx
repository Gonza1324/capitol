"use client";

import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Contact = { id: string; full_name: string; email: string | null };

export function RecipientsField<T extends { recipients: Array<{ contact_id?: string | null; name?: string | null; email?: string | null }> }>({
  control,
  register,
  contacts
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  contacts: Contact[];
}) {
  const fields = useFieldArray({ control, name: "recipients" as never });
  return (
    <div className="space-y-3">
      {fields.fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select {...register(`recipients.${index}.contact_id` as never)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Contacto</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}
          </select>
          <Input placeholder="Nombre libre" {...register(`recipients.${index}.name` as never)} />
          <Input placeholder="Email" {...register(`recipients.${index}.email` as never)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => fields.remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => fields.append({ contact_id: null, name: "", email: "" } as never)}>
        <Plus className="h-4 w-4" />
        Agregar destinatario
      </Button>
    </div>
  );
}
