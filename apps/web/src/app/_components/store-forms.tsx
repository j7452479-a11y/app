"use client";
import { useActionState } from "react";
import type { ActionState } from "@/app/actions";
import { storefrontTemplates } from "@/lib/storefront-templates";

export function StoreSettingsForm({
  action,
  store,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  store: { display_name: string; description: string; template: string };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <div className="field">
        <label>Store name</label>
        <input
          name="display_name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={store.display_name}
        />
      </div>
      <div className="field">
        <label>Store description</label>
        <textarea
          name="description"
          maxLength={2000}
          defaultValue={store.description}
          placeholder="What makes your shop special?"
        />
      </div>
      <div className="field">
        <label>Store design</label>
        <select name="template" defaultValue={store.template}>
          {storefrontTemplates.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name} — {item.tone}
            </option>
          ))}
        </select>
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice">
          {state.message}
        </div>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Save store settings"}
      </button>
    </form>
  );
}
export function DomainForm({
  action,
  domainId,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  domainId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      {domainId && <input type="hidden" name="domain_id" value={domainId} />}
      <div className="inline-form">
        {!domainId && (
          <input
            aria-label="Custom domain"
            name="hostname"
            required
            placeholder="shop.example.com"
            style={{ flex: 1 }}
          />
        )}
        <button className="button small" disabled={pending}>
          {pending
            ? domainId
              ? "Checking…"
              : "Adding…"
            : domainId
              ? "Verify domain"
              : "Add domain"}
        </button>
      </div>
      {state.error && (
        <div role="alert" className="notice error" style={{ marginTop: 10 }}>
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice" style={{ marginTop: 10 }}>
          {state.message}
        </div>
      )}
    </form>
  );
}
export function ChatForm({
  action,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="message">What can I help with?</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={2}
          maxLength={2000}
          placeholder="Ask about managing your products, stock or orders…"
        />
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="answer">
          {state.message}
        </div>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Thinking…" : "Ask assistant"}
      </button>
    </form>
  );
}
export function AdRequestForm({
  action,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <div className="field">
        <label>Campaign title</label>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="October collection launch"
        />
      </div>
      <div className="field">
        <label>Channel</label>
        <select name="channel">
          <option value="social">Social media</option>
          <option value="search">Search</option>
          <option value="display">Display</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="field">
        <label>Creative brief</label>
        <textarea
          name="brief"
          required
          minLength={10}
          maxLength={4000}
          placeholder="Audience, products, message and timing…"
        />
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice">
          {state.message}
        </div>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Submitting…" : "Request ad creative"}
      </button>
    </form>
  );
}
export function RevisionForm({
  action,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <div className="field">
        <label>What should change?</label>
        <input
          name="summary"
          required
          minLength={5}
          maxLength={140}
          placeholder="Update the home page hero"
        />
      </div>
      <div className="field">
        <label>Details</label>
        <textarea
          name="details"
          required
          minLength={10}
          maxLength={3000}
          placeholder="Describe the change and the result you want…"
        />
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice">
          {state.message}
        </div>
      )}
      <button className="button secondary" disabled={pending}>
        {pending ? "Submitting…" : "Request a design revision"}
      </button>
    </form>
  );
}
export function PaymentProfileForm({
  action,
  keyId,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  keyId: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <div className="notice">
        Use your own Razorpay merchant account. API and webhook secrets are
        encrypted before storage and never sent to a customer browser.
      </div>
      {keyId && (
        <p className="subhead" style={{ fontSize: 12, marginBottom: 14 }}>
          Connected key: {keyId.slice(0, 12)}…
        </p>
      )}
      <div className="field">
        <label>Razorpay Key ID</label>
        <input
          name="key_id"
          required
          placeholder="rzp_test_…"
          defaultValue={keyId || ""}
        />
      </div>
      <div className="field">
        <label>Razorpay Key Secret</label>
        <input
          name="key_secret"
          type="password"
          required
          minLength={16}
          autoComplete="new-password"
          placeholder="Enter the API secret"
        />
      </div>
      <div className="field">
        <label>Razorpay Webhook Secret</label>
        <input
          name="webhook_secret"
          type="password"
          required
          minLength={16}
          autoComplete="new-password"
          placeholder="Create a webhook secret for this store"
        />
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice">
          {state.message}
        </div>
      )}
      <button className="button secondary" disabled={pending}>
        {pending ? "Saving securely…" : "Save payment account"}
      </button>
    </form>
  );
}
export function PlanCheckoutForm({
  action,
  plan,
  current,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  plan: string;
  current: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="plan" value={plan} />
      {state.error && (
        <div role="alert" className="notice error">
          {state.error}
        </div>
      )}
      {state.message && (
        <div role="status" className="notice">
          {state.message}
        </div>
      )}
      <button
        disabled={pending}
        className={`button ${current ? "secondary" : ""}`}
        style={{ width: "100%" }}
      >
        {pending ? "Connecting…" : current ? "Current plan" : "Choose " + plan}
      </button>
    </form>
  );
}
