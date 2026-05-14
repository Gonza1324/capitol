"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema, updateUserSchema, type CreateUserValues, type UpdateUserValues } from "@/lib/validators/settings";
import { getCurrentProfile, logActivity } from "./helpers";

function assertAdmin(role?: string | null) {
  if (role !== "admin") {
    throw new Error("Solo usuarios admin pueden administrar usuarios.");
  }
}

export async function createUserRecord(payload: CreateUserValues) {
  const values = createUserSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertAdmin(profile?.role);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.full_name,
      role: values.role
    }
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No pudimos crear el usuario en Supabase Auth.");

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email: values.email,
    full_name: values.full_name,
    role: values.role
  });

  if (profileError) throw new Error(profileError.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "user_created",
    entityType: "profile",
    entityId: data.user.id,
    metadata: { email: values.email, role: values.role }
  });

  revalidatePath("/settings");
  redirect("/settings?toast=user_created");
}

export async function updateUserRecord(id: string, payload: UpdateUserValues) {
  const values = updateUserSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertAdmin(profile?.role);

  if (id === user.id && values.role !== "admin") {
    throw new Error("No podés quitarte el rol admin desde tu propio usuario.");
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.full_name,
      role: values.role
    }
  });

  if (authError) throw new Error(authError.message);

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      email: values.email,
      full_name: values.full_name,
      role: values.role
    })
    .eq("id", id);

  if (profileError) throw new Error(profileError.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "user_updated",
    entityType: "profile",
    entityId: id,
    metadata: { email: values.email, role: values.role }
  });

  revalidatePath("/settings");
  redirect("/settings?toast=user_updated");
}
