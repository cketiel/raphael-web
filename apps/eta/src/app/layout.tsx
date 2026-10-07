import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raphael - Trip Tracking",
  description: "Check the estimated arrival time of your Raphael trip.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
