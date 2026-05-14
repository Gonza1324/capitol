"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserRecord, updateUserRecord } from "@/lib/actions/settings";
import { createUserSchema, updateUserSchema, userRoles, type CreateUserValues, type UpdateUserValues } from "@/lib/validators/settings";
import type { UserRole } from "@/lib/supabase/types";

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  partner_director: "Socio/Director",
  analyst: "Analista",
  assistant: "Asistente",
  external_client: "Cliente externo"
};

export function UserManagement({
  profiles,
  canManageUsers
}: {
  profiles: UserProfile[];
  canManageUsers: boolean;
}) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Usuarios y roles</CardTitle>
        <CardDescription>
          {canManageUsers
            ? "Crear usuarios internos y editar nombre, email, rol o contraseña temporal."
            : "Vista de usuarios creados en Supabase Auth. Solo admin puede editar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManageUsers ? <CreateUserForm /> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {profiles.length ? (
            profiles.map((profile) => (
              <UserEditForm key={profile.id} profile={profile} disabled={!canManageUsers} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sin usuarios todavía.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserForm() {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "analyst",
      password: ""
    }
  });

  function onSubmit(values: CreateUserValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await createUserRecord(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos crear el usuario.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-md border p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Nombre">
          <Input {...form.register("full_name")} placeholder="Sofia Martinez" />
          <FieldError message={form.formState.errors.full_name?.message} />
        </Field>
        <Field label="Email">
          <Input type="email" {...form.register("email")} placeholder="nombre@capitol.com" />
          <FieldError message={form.formState.errors.email?.message} />
        </Field>
        <Field label="Rol">
          <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as UserRole, { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {userRoles.map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldError message={form.formState.errors.role?.message} />
        </Field>
        <Field label="Contraseña temporal">
          <Input type="password" {...form.register("password")} placeholder="Mínimo 8 caracteres" />
          <FieldError message={form.formState.errors.password?.message} />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Creando..." : "Crear usuario"}</Button>
        {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      </div>
    </form>
  );
}

function UserEditForm({ profile, disabled }: { profile: UserProfile; disabled: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: profile.email || "",
      full_name: profile.full_name || "",
      role: profile.role,
      password: ""
    }
  });

  function onSubmit(values: UpdateUserValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await updateUserRecord(profile.id, values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos actualizar el usuario.");
      }
    });
  }

  if (!isEditing || disabled) {
    return (
      <div className="rounded-md border p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{profile.full_name || profile.email || "Usuario sin email"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email || "-"}</p>
            <Badge className="mt-2" variant="muted">{roleLabels[profile.role]}</Badge>
          </div>
          {!disabled ? <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar</Button> : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-md border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre">
          <Input {...form.register("full_name")} />
          <FieldError message={form.formState.errors.full_name?.message} />
        </Field>
        <Field label="Email">
          <Input type="email" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </Field>
        <Field label="Rol">
          <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as UserRole, { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {userRoles.map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldError message={form.formState.errors.role?.message} />
        </Field>
        <Field label="Nueva contraseña">
          <Input type="password" {...form.register("password")} placeholder="Opcional" />
          <FieldError message={form.formState.errors.password?.message} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar cambios"}</Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={() => setIsEditing(false)}>Cancelar</Button>
        {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}
