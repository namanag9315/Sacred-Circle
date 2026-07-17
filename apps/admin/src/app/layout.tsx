import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sacred Circle",
    template: "%s | Sacred Circle"
  },
  applicationName: "Sacred Circle",
  description: "Sacred Circle sessions, meditation audio, protected recordings, spiritual teachings, and community events."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
