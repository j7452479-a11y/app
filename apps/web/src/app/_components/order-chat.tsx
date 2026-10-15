"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, Square } from "lucide-react";

type Message = { id: string; sender: "customer" | "merchant"; body: string; attachment_kind: "image" | "audio" | null; attachment_url: string | null; created_at: string };

export function OrderChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [orderStatus, setOrderStatus] = useState({ state: "", number: 0 });
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    const response = await fetch(`/api/customer-chat?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (response.ok) { const data = await response.json() as { messages: Message[]; order: { state: string; number: number } }; setMessages(data.messages); setOrderStatus(data.order); }
  }, [token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [load]);
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!body.trim() && !file) return;
    setSending(true); setError("");
    const form = new FormData(); form.set("token", token); form.set("body", body); if (file) form.set("file", file);
    const response = await fetch("/api/customer-chat", { method: "POST", body: form });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error || "Message could not be sent."); else { setBody(""); setFile(null); if (inputRef.current) inputRef.current.value = ""; await load(); }
    setSending(false);
  }
  async function toggleRecording() {
    if (recording && mediaRecorder.current) { mediaRecorder.current.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("Voice recording is not supported in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream); const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" }); setFile(new File([audio], "voice-note.webm", { type: audio.type })); stream.getTracks().forEach((track) => track.stop()); };
      mediaRecorder.current = recorder; recorder.start(); setRecording(true); setError("");
    } catch { setError("Allow microphone access to record a voice note."); }
  }
  return <section className="order-chat"><header><div><span className="chat-live-dot"/>Order #{orderStatus.number} · {orderStatus.state.replaceAll("_", " ")}</div><small>Shop replies here</small></header><div className="chat-messages" aria-live="polite">{messages.map((message) => <article key={message.id} className={`chat-message ${message.sender}`}><p>{message.body}</p>{message.attachment_url && (message.attachment_kind === "image" ? <a href={message.attachment_url} target="_blank" rel="noreferrer"><img src={message.attachment_url} alt="Shared attachment"/></a> : <audio controls src={message.attachment_url}/>)}<time>{new Date(message.created_at).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}</time></article>)}{!messages.length && <p className="chat-empty">Ask the shop about your order. You can attach a photo or send a voice note.</p>}</div><form onSubmit={send} className="chat-compose"><div className="chat-attach-row"><label className="chat-icon-button" aria-label="Attach an image"><Paperclip size={17}/><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label><button className={`chat-icon-button ${recording ? "recording" : ""}`} type="button" onClick={toggleRecording} aria-label={recording ? "Stop recording" : "Record voice note"}>{recording ? <Square size={15}/> : <Mic size={17}/>}</button>{file && <span className="chat-file-name">{file.name}</span>}</div><div className="chat-compose-main"><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message…" rows={2} maxLength={4000}/><button disabled={sending || (!body.trim() && !file)} aria-label="Send message"><Send size={17}/></button></div>{error && <p role="alert" className="chat-error">{error}</p>}</form></section>;
}
