import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { THEME_COOKIE, resolveTheme } from "@/lib/theme";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// The final design's type (design/DESIGN.md). Served from this origin by next/font: no request to
// Google, so the CSP stays as it is. Screens move to it one at a time; the login is first.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Raphael Booking Portal",
  description: "Trip booking for Raphael NEMT facilities.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading the request headers makes every page dynamic, which the per-request CSP nonce requires.
  await headers();
  const locale = await getLocale();
  // Set on the server so the page never flashes the wrong theme. Absent: the system decides (globals.css).
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} data-theme={theme ?? undefined}
      className={`${geistSans.variable} ${geistMono.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
