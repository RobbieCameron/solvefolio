import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solvefolio",
  description: "A solvefolio workspace for coding drills, recall cards, notes, and readiness tracking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
