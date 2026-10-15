import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key
    ? createSupabaseClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
}
function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!/^[a-f0-9]{64}$/.test(token))
    return NextResponse.json(
      { error: "Order chat link is invalid." },
      { status: 401 },
    );
  const supabase = adminClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Customer chat is not configured." },
      { status: 503 },
    );
  const { data: order } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,state,customer_chat_token_hash")
    .eq("customer_chat_token_hash", tokenHash(token))
    .maybeSingle();
  if (!order)
    return NextResponse.json(
      { error: "This order chat link could not be verified." },
      { status: 404 },
    );
  const { data: messages } = await supabase
    .from("customer_messages")
    .select("id,sender,body,attachment_path,attachment_kind,created_at")
    .eq("order_id", order.id)
    .order("created_at")
    .limit(200);
  const signed = await Promise.all(
    (messages || []).map(async (message) => {
      if (!message.attachment_path) return { ...message, attachment_url: null };
      const { data } = await supabase.storage
        .from("customer-chat")
        .createSignedUrl(message.attachment_path, 300);
      return { ...message, attachment_url: data?.signedUrl || null };
    }),
  );
  return NextResponse.json({
    order: {
      number: order.order_number,
      name: order.customer_name,
      state: order.state,
    },
    messages: signed,
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const body = String(form.get("body") || "").trim();
  const file = form.get("file");
  if (
    !/^[a-f0-9]{64}$/.test(token) ||
    body.length > 4000 ||
    (!body && !(file instanceof File))
  )
    return NextResponse.json(
      { error: "Write a message or attach an image/voice note." },
      { status: 400 },
    );
  const supabase = adminClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Customer chat is not configured." },
      { status: 503 },
    );
  const { data: order } = await supabase
    .from("orders")
    .select("id,organization_id")
    .eq("customer_chat_token_hash", tokenHash(token))
    .maybeSingle();
  if (!order)
    return NextResponse.json(
      { error: "This order chat link could not be verified." },
      { status: 404 },
    );
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "consume_customer_chat_rate_limit",
    { chat_token_hash: tokenHash(token) },
  );
  if (rateLimitError)
    return NextResponse.json(
      { error: "Customer chat is temporarily unavailable." },
      { status: 503 },
    );
  if (!allowed)
    return NextResponse.json(
      { error: "Please wait a minute before sending more messages." },
      { status: 429 },
    );
  let attachmentPath: string | null = null;
  let attachmentKind: "image" | "audio" | null = null;
  if (file instanceof File && file.size) {
    if (file.size > 8 * 1024 * 1024)
      return NextResponse.json(
        { error: "Attachments must be smaller than 8 MB." },
        { status: 413 },
      );
    const image = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(file.type);
    const audio = [
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
    ].includes(file.type);
    if (!image && !audio)
      return NextResponse.json(
        { error: "Use a supported image or audio file." },
        { status: 415 },
      );
    attachmentKind = image ? "image" : "audio";
    const extension = file.type.split("/")[1]?.replace("+xml", "") || "bin";
    attachmentPath = `${order.organization_id}/${order.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("customer-chat")
      .upload(attachmentPath, file, { contentType: file.type, upsert: false });
    if (uploadError)
      return NextResponse.json(
        { error: "The attachment could not be uploaded." },
        { status: 500 },
      );
  }
  const { error } = await supabase
    .from("customer_messages")
    .insert({
      organization_id: order.organization_id,
      order_id: order.id,
      sender: "customer",
      body,
      attachment_path: attachmentPath,
      attachment_kind: attachmentKind,
    });
  if (error)
    return NextResponse.json(
      { error: "Your message could not be saved." },
      { status: 500 },
    );
  return NextResponse.json({ sent: true }, { status: 201 });
}
