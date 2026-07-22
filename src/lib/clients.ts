import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export async function getClients(): Promise<(Client & { ad_count: number; active_ad_count: number })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, phone_landline, postal_code, billing_address, billing_name, cuit, notes, created_at, updated_at")
    .order("name", { ascending: true });

  if (error || !data) return [];

  // Get ad counts per client
  const { data: ads } = await supabase
    .from("ads")
    .select("client_id, active");

  const clientCounts: Record<string, { total: number; active: number }> = {};
  for (const ad of ads ?? []) {
    if (!ad.client_id) continue;
    if (!clientCounts[ad.client_id]) clientCounts[ad.client_id] = { total: 0, active: 0 };
    clientCounts[ad.client_id].total++;
    if (ad.active) clientCounts[ad.client_id].active++;
  }

  return data.map((client) => ({
    ...client,
    ad_count: clientCounts[client.id]?.total ?? 0,
    active_ad_count: clientCounts[client.id]?.active ?? 0,
  }));
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, phone_landline, postal_code, billing_address, billing_name, cuit, notes, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getClientAds(clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}