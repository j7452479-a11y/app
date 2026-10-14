import { z } from "zod";

export const storePageTypes = ["about", "contact", "faq", "shipping_returns"] as const;

export type StorePageType = (typeof storePageTypes)[number];

const plainText = z.string().trim().refine(
  (value) => !/<\/?[a-z][^>]*>/i.test(value),
  "HTML markup is not allowed",
);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    plainText.max(max).optional(),
  );

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use HTTPS");

const optionalHttpsUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  httpsUrl.optional(),
);

const aboutContentSchema = z
  .object({
    story: plainText.min(10).max(5000),
    headline: optionalText(100).pipe(z.string().min(1).max(100).optional()),
    mediaUrl: optionalHttpsUrl,
    mediaAlt: optionalText(250).pipe(z.string().min(3).max(250).optional()),
  })
  .strict()
  .superRefine((content, context) => {
    if (content.mediaUrl && !content.mediaAlt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mediaAlt"],
        message: "Add meaningful alternative text for the supporting image",
      });
    }
  });

const contactContentSchema = z
  .object({
    email: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().max(254).email().optional(),
    ),
    phone: optionalText(30).pipe(z.string().min(3).max(30).optional()),
    websiteUrl: optionalHttpsUrl,
    address: optionalText(500).pipe(z.string().min(1).max(500).optional()),
    serviceArea: optionalText(500).pipe(z.string().min(1).max(500).optional()),
    hours: optionalText(500).pipe(z.string().min(1).max(500).optional()),
  })
  .strict();

const faqContentSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            question: plainText.min(3).max(180),
            answer: plainText.min(3).max(2000),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();

const shippingReturnsContentSchema = z
  .object({
    deliveryAreas: plainText.min(3).max(2000),
    deliveryTime: plainText.min(3).max(2000),
    shippingCharges: plainText.min(3).max(2000),
    returnWindow: plainText.min(3).max(2000),
    returnEligibility: plainText.min(3).max(2000),
    returnSteps: plainText.min(3).max(2000),
    returnContact: optionalText(254).pipe(z.string().min(1).max(254).optional()),
  })
  .strict();

export type AboutStorePageContent = z.infer<typeof aboutContentSchema>;
export type ContactStorePageContent = z.infer<typeof contactContentSchema>;
export type FaqStorePageContent = z.infer<typeof faqContentSchema>;
export type ShippingReturnsStorePageContent = z.infer<typeof shippingReturnsContentSchema>;

export type StorePageContent =
  | ({ pageType: "about" } & AboutStorePageContent)
  | ({ pageType: "contact" } & ContactStorePageContent)
  | ({ pageType: "faq" } & FaqStorePageContent)
  | ({ pageType: "shipping_returns" } & ShippingReturnsStorePageContent);

export type StorePageValidationResult =
  | { success: true; data: StorePageContent }
  | { success: false; errors: Record<string, string[]> };

const contentSchemas = {
  about: aboutContentSchema,
  contact: contactContentSchema,
  faq: faqContentSchema,
  shipping_returns: shippingReturnsContentSchema,
} satisfies Record<StorePageType, z.ZodType>;

export function parseStorePageContent(
  pageType: unknown,
  input: unknown,
): StorePageValidationResult {
  if (typeof pageType !== "string" || !storePageTypes.includes(pageType as StorePageType)) {
    return { success: false, errors: { pageType: ["Unsupported store page type"] } };
  }

  const result = contentSchemas[pageType as StorePageType].safeParse(input);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "content";
      (errors[key] ??= []).push(issue.message);
    }
    return { success: false, errors };
  }

  return {
    success: true,
    data: { pageType, ...result.data } as StorePageContent,
  };
}

export function isStorePageReady(pageType: unknown, content: unknown): boolean {
  const result = parseStorePageContent(pageType, content);
  if (!result.success) return false;
  if (result.data.pageType !== "contact") return true;

  return Boolean(
    result.data.email ||
      result.data.phone ||
      result.data.websiteUrl ||
      result.data.address ||
      result.data.serviceArea,
  );
}

export function getPublishedStorePageTypes(
  rows: readonly {
    page_type: unknown;
    published_content: unknown;
    published_at: unknown;
  }[],
): StorePageType[] {
  return rows.flatMap((page) => {
    if (!page.published_content || !page.published_at) return [];
    const parsed = parseStorePageContent(page.page_type, page.published_content);
    return parsed.success ? [parsed.data.pageType] : [];
  });
}
