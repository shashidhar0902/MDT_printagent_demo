import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintAgent AI",
  description: "Smart campus print ordering prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
