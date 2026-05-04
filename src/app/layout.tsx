import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NevUp — Where Trading Meets Psychology",
  description: "Post-session debrief and behavioral dashboard for retail traders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
