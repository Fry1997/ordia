import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ordia",
  description: "A calmer way to run life together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
