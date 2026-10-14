"use client";

import { useState, useTransition } from "react";
import { Check, Circle, Monitor, Smartphone } from "lucide-react";
import { saveStorePage, setStorePagePublished, type ActionState } from "@/app/store/pages/actions";
import { isStorePageReady, parseStorePageContent, type StorePageType } from "@/lib/store-pages";
import { getStorefrontTemplate } from "@/lib/storefront-templates";

type PageRow = {
  page_type: StorePageType;
  content: Record<string, unknown>;
  published_content: Record<string, unknown> | null;
  published_at: string | null;
};

type FaqItem = { question: string; answer: string };
type Draft = Record<string, string | FaqItem[]>;

const pageOptions: { type: StorePageType; label: string; purpose: string }[] = [
  { type: "about", label: "About", purpose: "Give customers context about the business, in your own words." },
  { type: "contact", label: "Contact", purpose: "Choose the contact details customers can use to reach you." },
  { type: "faq", label: "FAQ", purpose: "Answer common questions using the policies and details you provide." },
  { type: "shipping_returns", label: "Shipping & Returns", purpose: "Set out your delivery and return terms clearly." },
];

const emptyDraft: Record<StorePageType, Draft> = {
  about: { story: "", headline: "", mediaUrl: "", mediaAlt: "" },
  contact: { email: "", phone: "", websiteUrl: "", address: "", serviceArea: "", hours: "" },
  faq: { items: [] },
  shipping_returns: {
    deliveryAreas: "", deliveryTime: "", shippingCharges: "", returnWindow: "",
    returnEligibility: "", returnSteps: "", returnContact: "",
  },
};

const fieldLabels: Record<string, string> = {
  story: "Your story",
  headline: "Short heading",
  mediaUrl: "Supporting image URL",
  mediaAlt: "Image alternative text",
  email: "Email address",
  phone: "Phone number",
  websiteUrl: "Website URL",
  address: "Address",
  serviceArea: "Service area",
  hours: "Business hours",
  deliveryAreas: "Where you deliver",
  deliveryTime: "Delivery timing",
  shippingCharges: "Shipping charges",
  returnWindow: "Return window",
  returnEligibility: "Return eligibility",
  returnSteps: "How to request a return",
  returnContact: "Return contact",
};

function textValue(draft: Draft, key: string) {
  return typeof draft[key] === "string" ? draft[key] as string : "";
}

function faqItems(draft: Draft): FaqItem[] {
  return Array.isArray(draft.items)
    ? draft.items.filter((item): item is FaqItem => Boolean(item && typeof item.question === "string" && typeof item.answer === "string"))
    : [];
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortJsonKeys(item)]),
    );
  }
  return value;
}

function canonicalPageContent(pageType: StorePageType, content: unknown): string | null {
  const parsed = parseStorePageContent(pageType, content);
  if (!parsed.success) return null;
  const { pageType: _pageType, ...fields } = parsed.data;
  return JSON.stringify(sortJsonKeys(fields));
}

export function hasUnsavedStorePageChanges(
  pageType: StorePageType,
  draft: unknown,
  savedContent: Record<string, unknown> | null | undefined,
): boolean {
  if (!savedContent) return true;
  const current = canonicalPageContent(pageType, draft);
  const saved = canonicalPageContent(pageType, savedContent);
  return current === null || saved === null || current !== saved;
}

function initialDrafts(rows: PageRow[]): Record<StorePageType, Draft> {
  const drafts = structuredClone(emptyDraft);
  for (const row of rows) {
    const existing = row.content as Draft;
    drafts[row.page_type] = {
      ...drafts[row.page_type],
      ...existing,
      ...(row.page_type === "faq" && !Array.isArray(existing.items) ? { items: [] } : {}),
    };
  }
  return drafts;
}

function readinessItems(pageType: StorePageType, draft: Draft) {
  const fields: { label: string; ready: boolean }[] = [];
  if (pageType === "about") {
    fields.push({ label: "Add a story of at least 10 characters", ready: textValue(draft, "story").trim().length >= 10 });
    if (textValue(draft, "mediaUrl").trim()) {
      fields.push({ label: "Describe the supporting image with meaningful alt text", ready: textValue(draft, "mediaAlt").trim().length >= 3 });
    }
  } else if (pageType === "contact") {
    fields.push({
      label: "Add at least one way for customers to reach you",
      ready: ["email", "phone", "websiteUrl", "address", "serviceArea"].some((key) => textValue(draft, key).trim().length > 0),
    });
  } else if (pageType === "faq") {
    const items = faqItems(draft);
    fields.push({ label: "Add at least one complete question and answer", ready: items.some((item) => item.question.trim().length >= 3 && item.answer.trim().length >= 3) });
  } else {
    for (const [key, label] of [
      ["deliveryAreas", "Delivery area"],
      ["deliveryTime", "Delivery timing"],
      ["shippingCharges", "Shipping charges"],
      ["returnWindow", "Return window"],
      ["returnEligibility", "Return eligibility"],
      ["returnSteps", "Return steps"],
    ]) fields.push({ label, ready: textValue(draft, key).trim().length >= 3 });
  }
  return fields;
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: string;
  value: string;
  error?: string[];
  onChange: (value: string) => void;
}) {
  const id = `store-page-${field}`;
  const isLong = ["story", "address", "serviceArea", "hours", "deliveryAreas", "deliveryTime", "shippingCharges", "returnWindow", "returnEligibility", "returnSteps"].includes(field);
  const maxLength = field === "story" ? 5000 : field === "headline" ? 100 : field.endsWith(".question") ? 180 : field === "phone" ? 30 : field === "address" || field === "serviceArea" || field === "hours" ? 500 : field === "returnContact" || field === "email" ? 254 : field === "mediaAlt" ? 250 : field === "mediaUrl" || field === "websiteUrl" ? 2048 : 2000;
  const optional = ["headline", "mediaUrl", "mediaAlt", "email", "phone", "websiteUrl", "address", "serviceArea", "hours", "returnContact"].includes(field);
  return (
    <div className={`field store-page-field${isLong ? " span-two" : ""}`}>
      <label htmlFor={id}>{fieldLabels[field] ?? (field.endsWith(".question") ? "Question" : "Answer")}{optional && <span className="store-pages-optional">Optional</span>}</label>
      {isLong ? (
        <textarea id={id} name={field} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error?.length)} aria-describedby={error?.length ? `${id}-error` : undefined} />
      ) : (
        <input id={id} name={field} type={field === "email" ? "email" : field === "mediaUrl" || field === "websiteUrl" ? "url" : "text"} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error?.length)} aria-describedby={error?.length ? `${id}-error` : undefined} />
      )}
      <div className="store-pages-field-meta"><span>{error?.length ? <span id={`${id}-error`} className="store-pages-field-error">{error.join(" ")}</span> : null}</span><span>{value.length}/{maxLength}</span></div>
    </div>
  );
}

function PageFields({
  pageType,
  draft,
  errors,
  updateField,
}: {
  pageType: StorePageType;
  draft: Draft;
  errors: Record<string, string[]>;
  updateField: (field: string, value: string | FaqItem[]) => void;
}) {
  const fields = pageType === "about"
    ? ["headline", "story", "mediaUrl", "mediaAlt"]
    : pageType === "contact"
      ? ["email", "phone", "websiteUrl", "address", "serviceArea", "hours"]
      : pageType === "shipping_returns"
        ? ["deliveryAreas", "deliveryTime", "shippingCharges", "returnWindow", "returnEligibility", "returnSteps", "returnContact"]
        : [];

  if (pageType === "faq") {
    const items = faqItems(draft);
    return (
      <div className="store-pages-faq-list">
        {items.map((item, index) => (
          <fieldset className="store-pages-faq-item" key={index}>
            <legend>Question {index + 1}</legend>
            <Field field={`items.${index}.question`} value={item.question} error={errors[`items.${index}.question`]} onChange={(value) => updateField("items", items.map((current, i) => i === index ? { ...current, question: value } : current))} />
            <Field field={`items.${index}.answer`} value={item.answer} error={errors[`items.${index}.answer`]} onChange={(value) => updateField("items", items.map((current, i) => i === index ? { ...current, answer: value } : current))} />
            <button type="button" className="button secondary small" onClick={() => updateField("items", items.filter((_, i) => i !== index))}>Remove question</button>
          </fieldset>
        ))}
        {errors.items && <p className="store-pages-field-error" role="alert">{errors.items.join(" ")}</p>}
        <button type="button" className="button secondary small" disabled={items.length >= 30} onClick={() => updateField("items", [...items, { question: "", answer: "" }])}>Add a question</button>
      </div>
    );
  }

  return <div className="store-pages-fields">{fields.map((field) => <Field key={field} field={field} value={textValue(draft, field)} error={errors[field]} onChange={(value) => updateField(field, value)} />)}</div>;
}

function PreviewContent({ pageType, draft }: { pageType: StorePageType; draft: Draft }) {
  if (pageType === "about") {
    return <>{textValue(draft, "headline") && <h3>{textValue(draft, "headline")}</h3>}{textValue(draft, "story") && <p>{textValue(draft, "story")}</p>}{textValue(draft, "mediaUrl") && <img className="store-pages-preview-image" src={textValue(draft, "mediaUrl")} alt={textValue(draft, "mediaAlt")} />}</>;
  }
  if (pageType === "contact") {
    const items = ["email", "phone", "websiteUrl", "address", "serviceArea", "hours"].filter((field) => textValue(draft, field));
    return items.length ? <dl className="store-pages-preview-details">{items.map((field) => <div key={field}><dt>{fieldLabels[field]}</dt><dd>{textValue(draft, field)}</dd></div>)}</dl> : null;
  }
  if (pageType === "faq") {
    const items = faqItems(draft).filter((item) => item.question || item.answer);
    return items.length ? <div className="store-pages-preview-faq">{items.map((item, index) => <div key={index}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div> : null;
  }
  const items = ["deliveryAreas", "deliveryTime", "shippingCharges", "returnWindow", "returnEligibility", "returnSteps", "returnContact"].filter((field) => textValue(draft, field));
  return items.length ? <div className="store-pages-preview-faq">{items.map((field) => <div key={field}><h3>{fieldLabels[field]}</h3><p>{textValue(draft, field)}</p></div>)}</div> : null;
}

export function StorePagesEditor({
  pages,
  storeName,
  templateId,
  canEdit,
}: {
  pages: PageRow[];
  storeName: string;
  templateId: string;
  canEdit: boolean;
}) {
  const [selectedPage, setSelectedPage] = useState<StorePageType>("about");
  const [drafts, setDrafts] = useState(() => initialDrafts(pages));
  const [pageRows, setPageRows] = useState(pages);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [feedback, setFeedback] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const draft = drafts[selectedPage];
  const row = pageRows.find((page) => page.page_type === selectedPage);
  const hasUnsavedChanges = hasUnsavedStorePageChanges(selectedPage, draft, row?.content);
  const template = getStorefrontTemplate(templateId);
  const readiness = readinessItems(selectedPage, draft);
  const isReady = isStorePageReady(selectedPage, draft);
  const parsedDraft = parseStorePageContent(selectedPage, draft);
  const fieldErrors = feedback.errors ?? {};

  function updateField(field: string, value: string | FaqItem[]) {
    setDrafts((current) => ({ ...current, [selectedPage]: { ...current[selectedPage], [field]: value } }));
    setFeedback({});
  }

  function submitSave(formData: FormData) {
    formData.set("content", JSON.stringify(draft));
    setFeedback({});
    startTransition(async () => {
      const result = await saveStorePage(formData);
      setFeedback(result);
      if (result.message) {
        const parsed = parseStorePageContent(selectedPage, draft);
        const savedContent = parsed.success
          ? Object.fromEntries(Object.entries(parsed.data).filter(([key]) => key !== "pageType"))
          : { ...draft };
        setPageRows((current) => {
          const existing = current.find((page) => page.page_type === selectedPage);
          const saved: PageRow = {
            page_type: selectedPage,
            content: savedContent,
            published_content: existing?.published_content ?? null,
            published_at: existing?.published_at ?? null,
          };
          return existing ? current.map((page) => page.page_type === selectedPage ? saved : page) : [...current, saved];
        });
      }
    });
  }

  function submitPublication(action: "publish" | "unpublish") {
    const formData = new FormData();
    formData.set("page_type", selectedPage);
    formData.set("action", action);
    if (action === "publish") formData.set("expected_content", JSON.stringify(draft));
    setFeedback({});
    startTransition(async () => {
      const result = await setStorePagePublished(formData);
      setFeedback(result);
      if (result.message) {
        setPageRows((current) => current.map((page) => page.page_type === selectedPage
          ? { ...page, published_content: action === "publish" ? { ...page.content } : page.published_content, published_at: action === "publish" ? new Date().toISOString() : null }
          : page));
      }
    });
  }

  return (
    <div className="page store-pages-page">
      <div className="page-head store-pages-heading">
        <div><div className="eyebrow">Store content</div><h1>Store pages</h1><p className="subhead">Write the details customers need, preview each page, and publish when it is ready.</p></div>
        <div className="store-pages-store-tag"><span className="store-pages-store-mark">{storeName.slice(0, 1).toUpperCase()}</span><span><small>Editing pages for</small><strong>{storeName}</strong></span></div>
      </div>

      <nav className="store-pages-step-nav" aria-label="Store pages">
        {pageOptions.map((option, index) => {
          const page = pageRows.find((item) => item.page_type === option.type);
          return <button key={option.type} type="button" aria-pressed={selectedPage === option.type} className={`store-pages-step${selectedPage === option.type ? " active" : ""}`} onClick={() => { setSelectedPage(option.type); setFeedback({}); }}><span className="store-pages-step-index">0{index + 1}</span><span>{option.label}</span><span className={`badge${page?.published_at ? "" : " muted"}`}>{page?.published_at ? "Live" : page ? "Draft" : "Not started"}</span></button>;
        })}
      </nav>

      <div className="store-pages-workspace">
        <section className="store-pages-editor card" aria-labelledby="store-pages-editor-title">
          <div className="store-pages-section-head"><div><div className="eyebrow">Page {String(pageOptions.findIndex((item) => item.type === selectedPage) + 1).padStart(2, "0")}</div><h2 id="store-pages-editor-title">{pageOptions.find((item) => item.type === selectedPage)?.label}</h2><p>{pageOptions.find((item) => item.type === selectedPage)?.purpose}</p></div><span className={`badge ${row?.published_at ? "" : "muted"}`}>{row?.published_at ? "Published" : row ? "Draft" : "Not started"}</span></div>

          {!canEdit && <p className="notice warn" role="status">Your workspace role can view this content but cannot edit or publish store pages.</p>}
          <form action={submitSave} className="store-pages-form">
            <input type="hidden" name="page_type" value={selectedPage} />
            <input type="hidden" name="content" value={JSON.stringify(draft)} />
            <fieldset disabled={!canEdit || isPending} className="store-pages-fieldset"><legend className="visually-hidden">{pageOptions.find((item) => item.type === selectedPage)?.label} page details</legend><PageFields pageType={selectedPage} draft={draft} errors={fieldErrors} updateField={updateField} /></fieldset>
            {fieldErrors._form && <p className="notice error" role="alert">{fieldErrors._form.join(" ")}</p>}
            {feedback.error && <p className="notice error" role="alert">{feedback.error}</p>}
            {feedback.message && <p className="notice" role="status">{feedback.message}</p>}
            {hasUnsavedChanges && <p className="notice warn" role="status">Save draft before publishing these edits.</p>}

            <section className="store-pages-checklist" aria-labelledby="store-pages-checklist-title">
              <div className="store-pages-checklist-head"><div><span className="eyebrow">Before it goes live</span><h3 id="store-pages-checklist-title">Readiness checklist</h3></div><span className={`badge ${isReady ? "" : "warn"}`}>{isReady ? "Ready to publish" : "Needs details"}</span></div>
              <ul>{readiness.map((item) => <li key={item.label} className={item.ready ? "complete" : "incomplete"}>{item.ready ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}<span>{item.label}</span></li>)}</ul>
              {!parsedDraft.success && <p className="store-pages-checklist-note">Some fields need attention. Review the highlighted errors above before publishing.</p>}
            </section>

            <div className="store-pages-actions">
              <button className="button" type="submit" disabled={!canEdit || isPending}>{isPending ? "Saving…" : "Save draft"}</button>
              <button className="button secondary" type="button" disabled={!canEdit || isPending || !isReady || hasUnsavedChanges || !row} onClick={() => submitPublication("publish")}>{row?.published_at ? "Publish changes" : "Publish page"}</button>
              {row?.published_at && <button className="button danger small" type="button" disabled={!canEdit || isPending} onClick={() => submitPublication("unpublish")}>Unpublish</button>}
            </div>
          </form>
        </section>

        <aside className="store-pages-preview-panel" aria-label="Page preview">
          <div className="store-pages-preview-toolbar"><div><span className="eyebrow">Live preview</span><h2>{template.name}</h2></div><div className="store-pages-viewport" role="tablist" aria-label="Preview size"><button type="button" role="tab" aria-selected={viewport === "desktop"} aria-label="Desktop preview" onClick={() => setViewport("desktop")}><Monitor size={16} /></button><button type="button" role="tab" aria-selected={viewport === "mobile"} aria-label="Mobile preview" onClick={() => setViewport("mobile")}><Smartphone size={16} /></button></div></div>
          <div className={`store-pages-preview-frame ${viewport}`}>
            <div className={`store-pages-preview theme-${template.id}`}>
              <div className="store-pages-preview-image-band" style={{ backgroundImage: `linear-gradient(90deg, color-mix(in srgb, var(--sf-ink, #18221d) 79%, transparent), color-mix(in srgb, var(--sf-ink, #18221d) 4%, transparent)), url("${template.image}")` }}>
                <div className="store-pages-preview-topline"><strong>{storeName}</strong><span>{pageOptions.find((item) => item.type === selectedPage)?.label}</span></div>
                <div className="store-pages-preview-title"><small>{template.name}</small><h3>{textValue(draft, "headline") || pageOptions.find((item) => item.type === selectedPage)?.label}</h3></div>
              </div>
              <div className="store-pages-preview-body"><PreviewContent pageType={selectedPage} draft={draft} />{!readiness.some((item) => item.ready) && <p className="store-pages-preview-empty">Your supplied page details will appear here as you add them.</p>}</div>
              <div className="store-pages-preview-footer">{storeName}</div>
            </div>
          </div>
          <p className="store-pages-preview-caption">Preview uses your selected {template.name.toLowerCase()} template. Only the content you enter is shown as store information.</p>
        </aside>
      </div>
    </div>
  );
}
