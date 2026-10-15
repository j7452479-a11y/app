import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./features.css";

export const metadata: Metadata = {
  title: { default: "Commerce OS — Your business, online", template: "%s · Commerce OS" },
  description: "A managed commerce platform for independent businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
