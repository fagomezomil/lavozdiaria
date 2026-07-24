/** Cliente de la nueva GraphQL API de Buffer (api.buffer.com).
 *  La vieja REST API (api.bufferapp.com/1/) está cerrada a nuevas altas desde 2019.
 *  Auth: Bearer token (personal API key desde publish.buffer.com/settings/api). */

import {
  getDailyChannelCounts,
  canPublishToChannel,
  type ChannelTarget,
} from "./daily-limits";

const BUFFER_API = "https://api.buffer.com";

export interface BufferChannel {
  id: string;
  service: string;
  name: string;
}

export interface BufferPublishResult {
  success: boolean;
  /** Por canal: si publicó, postId; si no, error. Incluye los saltados por límite. */
  channelTargets: ChannelTarget[];
  /** Canales saltados por límite diario. */
  skippedByLimit: Array<{ channelId: string; service: string; reason: string }>;
  error?: string;
}

async function gql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(BUFFER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (data.errors && data.errors.length > 0) {
    throw new Error(`buffer gql: ${data.errors.map((e) => e.message).join("; ")}`);
  }
  if (!res.ok) throw new Error(`buffer gql HTTP ${res.status}`);
  return data.data as T;
}

/** Lista las organizaciones de la cuenta. Necesario para obtener channels. */
export async function listOrganizations(accessToken: string): Promise<
  Array<{ id: string; name: string }>
> {
  const query = `query { account { organizations { id name } } }`;
  const data = await gql<{ account: { organizations: Array<{ id: string; name: string }> } }>(
    accessToken,
    query,
  );
  return data.account.organizations;
}

/** Lista los channels (cuentas sociales conectadas) de todas las organizaciones. */
export async function listChannels(accessToken: string): Promise<BufferChannel[]> {
  const orgs = await listOrganizations(accessToken);
  if (orgs.length === 0) return [];

  const query = `query GetChannels($input: ChannelsInput!) {
    channels(input: $input) { id service name displayName }
  }`;

  const all: BufferChannel[] = [];
  for (const org of orgs) {
    try {
      const data = await gql<{
        channels: Array<{ id: string; service: string; name: string; displayName?: string }>;
      }>(accessToken, query, { input: { organizationId: org.id } });
      for (const c of data.channels) {
        all.push({ id: c.id, service: c.service, name: c.displayName ?? c.name });
      }
    } catch (err) {
      console.error(`listChannels org ${org.id}:`, err);
    }
  }
  return all;
}

/** Publica un carrusel a N canales (una mutación createPost por canal).
 *  - text: caption
 *  - mediaUrls: URLs públicas de las PNGs (Buffer las descarga al publicar)
 *  - channelIds: lista de channel IDs destino (si vacío, usa todos los descubiertos)
 *  - scheduled: programa para esa fecha ISO; sino shareNow (publica en el instante)
 *  - Respet DAILY_LIMITS por servicio (saltando canales que ya llegaron al tope). */
export async function bufferPublish(
  accessToken: string,
  channelIds: string[],
  text: string,
  mediaUrls: string[],
  scheduled?: Date,
): Promise<BufferPublishResult> {
  if (!accessToken) return { success: false, channelTargets: [], skippedByLimit: [], error: "BUFFER_API_KEY no configurada" };
  if (mediaUrls.length === 0) return { success: false, channelTargets: [], skippedByLimit: [], error: "Sin slides para publicar" };

  // Descubrir canales (para saber el service de cada uno y armar metadata correcta)
  let channels: BufferChannel[] = [];
  try {
    channels = await listChannels(accessToken);
  } catch (err) {
    return { success: false, channelTargets: [], skippedByLimit: [], error: `listChannels: ${String(err)}` };
  }

  // Si no se especifican channelIds, usar todos los descubiertos
  let targets = channelIds;
  if (targets.length === 0) {
    targets = channels.map((c) => c.id);
  }
  if (targets.length === 0) return { success: false, channelTargets: [], skippedByLimit: [], error: "Sin canales conectados" };

  const channelsById = new Map(channels.map((c) => [c.id, c]));

  // Daily limits: contar posts de hoy y filtrar canales que ya llegaron al tope
  const dailyCounts = await getDailyChannelCounts();
  const skippedByLimit: Array<{ channelId: string; service: string; reason: string }> = [];
  const allowedTargets: string[] = [];
  for (const channelId of targets) {
    const channel = channelsById.get(channelId);
    const service = channel?.service ?? "";
    const check = canPublishToChannel(channelId, service, dailyCounts);
    if (check.allowed) {
      allowedTargets.push(channelId);
    } else {
      skippedByLimit.push({ channelId, service, reason: check.reason ?? "límite alcanzado" });
    }
  }

  if (allowedTargets.length === 0) {
    return {
      success: false,
      channelTargets: [],
      skippedByLimit,
      error: skippedByLimit.length > 0
        ? `Todos los canales alcanzaron el límite diario: ${skippedByLimit.map((s) => s.service).join(", ")}`
        : "Sin canales disponibles",
    };
  }

  const mode = scheduled ? "customScheduled" : "shareNow";
  const dueAt = scheduled ? scheduled.toISOString() : null;

  // assets array: una entrada por imagen del carrusel
  const assetsJson = mediaUrls.map((url) => ({ image: { url } }));

  const mutation = `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    }
  }`;

  const channelTargets: ChannelTarget[] = [];
  let allOk = true;

  for (const channelId of allowedTargets) {
    const channel = channelsById.get(channelId);
    const service = channel?.service ?? "";

    // Metadata service-specific. Instagram + Facebook requieren `type`.
    // Instagram también requiere `shouldShareToFeed` (Boolean!).
    const metadata: Record<string, unknown> = {};
    if (service === "instagram") {
      metadata.instagram = { type: "post", shouldShareToFeed: true };
    } else if (service === "facebook") {
      metadata.facebook = { type: "post" };
    } else if (service === "tiktok") {
      metadata.tiktok = {};
    }

    const input: Record<string, unknown> = {
      text,
      channelId,
      schedulingType: "automatic",
      mode,
      assets: assetsJson,
    };
    if (Object.keys(metadata).length > 0) input.metadata = metadata;
    if (dueAt) input.dueAt = dueAt;

    try {
      const data = await gql<{
        createPost: { post?: { id: string }; message?: string } | null;
      }>(accessToken, mutation, { input });
      const result = data.createPost;
      if (result?.post?.id) {
        channelTargets.push({ channelId, service, postId: result.post.id, error: null });
      } else {
        channelTargets.push({
          channelId,
          service,
          postId: null,
          error: result?.message ?? "error desconocido",
        });
        allOk = false;
      }
    } catch (err) {
      channelTargets.push({ channelId, service, postId: null, error: String(err) });
      allOk = false;
    }
  }

  return {
    success: allOk,
    channelTargets,
    skippedByLimit,
    error: allOk ? undefined : "algunos canales fallaron (ver channelTargets)",
  };
}