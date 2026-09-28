import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sambungla — AI Personal Branding for Malaysian LinkedIn",
  description:
    "Generate and auto-publish LinkedIn posts in corporate English, humble local English, or authentic Manglish.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
