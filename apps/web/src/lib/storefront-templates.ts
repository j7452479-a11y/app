export type StorefrontTypography = string;
export type StorefrontMotionProfile = {
  character: string;
  durationMs: number;
  ambient: boolean;
};

export type StorefrontDesignProfile = {
  typography: StorefrontTypography;
  rhythm: string;
  density: string;
  imagery: string;
  motion: StorefrontMotionProfile;
};

type StorefrontTemplate = {
  id: string;
  name: string;
  tone: string;
  eyebrow: string;
  headline: string;
  collection: string;
  search?: boolean;
  image: string;
  design: StorefrontDesignProfile;
};

export const storefrontTemplates = [
  { id: "essential", name: "Essential commerce", tone: "Clear, balanced everyday retail", eyebrow: "A better kind of everyday", headline: "Good things,\nwell chosen.", collection: "Shop the collection", search: true, image: "/templates/sector-essential-commerce.jpg", design: { typography: "balanced-grotesk", rhythm: "centered-balance", density: "steady-grid", imagery: "natural-crop", motion: { character: "soft-arrival", durationMs: 420, ambient: false } } },
  { id: "fashion", name: "Fashion atelier", tone: "Editorial, collection-led fashion", eyebrow: "The new season", headline: "Pieces with\na point of view.", collection: "The latest collection", image: "/templates/sector-fashion-atelier.jpg", design: { typography: "editorial-serif", rhythm: "asymmetric-editorial", density: "runway-edit", imagery: "portrait-editorial", motion: { character: "editorial-reveal", durationMs: 560, ambient: false } } },
  { id: "beauty", name: "Beauty studio", tone: "Calm routines and ingredient clarity", eyebrow: "A considered ritual", headline: "Care that\nfeels like you.", collection: "Build your routine", image: "/templates/sector-beauty-studio.jpg", design: { typography: "soft-humanist", rhythm: "ritual-steps", density: "routine-pairing", imagery: "soft-focus-frame", motion: { character: "slow-breath", durationMs: 720, ambient: true } } },
  { id: "electronics", name: "Electronics grid", tone: "Precise specs and confident comparison", eyebrow: "Designed to work harder", headline: "Tools for a\nconnected life.", collection: "Explore the range", search: true, image: "/templates/sector-electronics-grid.jpg", design: { typography: "technical-sans", rhythm: "precision-rails", density: "spec-compare", imagery: "orthographic-product", motion: { character: "precise-snap", durationMs: 260, ambient: false } } },
  { id: "home", name: "Home & furniture", tone: "Room-led imagery and tactile materials", eyebrow: "Make room for living", headline: "A home,\nmore your own.", collection: "Shop by room", image: "/templates/sector-home-and-furniture.jpg", design: { typography: "warm-transitional", rhythm: "room-to-object", density: "spacious-furnishing", imagery: "room-scale", motion: { character: "settled-drift", durationMs: 640, ambient: false } } },
  { id: "grocery", name: "Grocery & daily needs", tone: "Fast browsing and basket-first shopping", eyebrow: "From your neighbourhood", headline: "The everyday\nessentials.", collection: "Fill your basket", search: true, image: "/templates/sector-grocery-and-daily-needs.jpg", design: { typography: "compact-grotesk", rhythm: "quick-pick-lanes", density: "high-turnover", imagery: "compact-packshot", motion: { character: "quick-feedback", durationMs: 180, ambient: false } } },
  { id: "food", name: "Food & restaurant", tone: "Appetising menu and straightforward ordering", eyebrow: "Made fresh, served your way", headline: "Something\ngood is cooking.", collection: "Order from the menu", image: "/templates/sector-food-and-restaurant.jpg", design: { typography: "menu-serif", rhythm: "menu-sections", density: "dish-led-list", imagery: "tabletop-closeup", motion: { character: "warm-steam", durationMs: 480, ambient: true } } },
  { id: "artisan", name: "Artisan market", tone: "Maker stories, material and provenance", eyebrow: "Made slowly, made to last", headline: "The hand\nbehind it.", collection: "Discover the makers", image: "/templates/sector-artisan-market.jpg", design: { typography: "crafted-serif", rhythm: "maker-story-pairing", density: "curated-makers", imagery: "material-texture", motion: { character: "handmade-settle", durationMs: 620, ambient: false } } },
  { id: "luxury", name: "Premium luxury", tone: "Quiet space and discreet service", eyebrow: "A study in detail", headline: "Worth keeping\nfor a lifetime.", collection: "View the collection", image: "/templates/sector-premium-luxury.jpg", design: { typography: "quiet-display", rhythm: "gallery-pause", density: "selective-gallery", imagery: "full-bleed-stilllife", motion: { character: "near-still", durationMs: 840, ambient: false } } },
  { id: "local", name: "Local business", tone: "Place-first, warm and easy to contact", eyebrow: "Around the corner", headline: "Your local\nfavourites.", collection: "Shop nearby", image: "/templates/sector-local-business.jpg", design: { typography: "friendly-rounded", rhythm: "place-first-board", density: "neighbourhood-mix", imagery: "documentary-place", motion: { character: "friendly-nudge", durationMs: 340, ambient: false } } },
  { id: "b2b", name: "B2B catalogue", tone: "Specification-led ordering for businesses", eyebrow: "Supply, made straightforward", headline: "Built for\nthe way you work.", collection: "Browse the catalogue", search: true, image: "/templates/sector-b2b-catalogue.jpg", design: { typography: "industrial-sans", rhythm: "specification-table", density: "procurement-dense", imagery: "clean-reference", motion: { character: "utility-state", durationMs: 200, ambient: false } } },
  { id: "subscription", name: "Subscription goods", tone: "Recurring essentials with clear terms", eyebrow: "A little more regular", headline: "Good things,\non repeat.", collection: "Choose your first box", image: "/templates/sector-subscription-goods.jpg", design: { typography: "regularity-humanist", rhythm: "cadence-cycle", density: "plan-and-product", imagery: "monthly-unboxing", motion: { character: "measured-cycle", durationMs: 540, ambient: true } } },
  { id: "services", name: "Professional services", tone: "Expertise, outcomes and an easy inquiry", eyebrow: "Good work starts here", headline: "A clearer way\nforward.", collection: "Explore our services", image: "/templates/sector-professional-services.jpg", design: { typography: "expert-editorial", rhythm: "expertise-to-inquiry", density: "service-path", imagery: "human-context", motion: { character: "confident-focus", durationMs: 380, ambient: false } } },
  { id: "marketplace", name: "Modern marketplace", tone: "Search-led discovery across a wider range", eyebrow: "Find your next favourite", headline: "More to find.\nMore to love.", collection: "Browse everything", search: true, image: "/templates/sector-modern-marketplace.jpg", design: { typography: "discovery-grotesk", rhythm: "search-first-discovery", density: "broad-assortment", imagery: "mixed-assortment", motion: { character: "discovery-glide", durationMs: 460, ambient: false } } },
] as const satisfies readonly StorefrontTemplate[];

export type StorefrontTemplateId = (typeof storefrontTemplates)[number]["id"];

export function getStorefrontTemplate(id: string) {
  return storefrontTemplates.find((template) => template.id === id) ?? storefrontTemplates[0];
}

export function resolveStorefrontMotion(
  motion: StorefrontMotionProfile,
  reducedMotion: boolean,
) {
  return {
    character: motion.character,
    enabled: !reducedMotion,
    durationMs: reducedMotion ? 0 : motion.durationMs,
    ambient: reducedMotion ? false : motion.ambient,
  };
}
