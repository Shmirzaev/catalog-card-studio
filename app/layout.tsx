import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Milana Card Generator",
  description: "Create premium Milana product cards from product photos."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
