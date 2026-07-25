import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ordia",
  description: "The household operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
