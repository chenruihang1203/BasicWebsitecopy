import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strategic Turing Test Game",
  description: "A research platform to test human ability to detect AI in conversation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
