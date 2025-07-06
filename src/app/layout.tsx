import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENS Root-Context AI",
  description: "Discover and interact with AI agents through ENS names",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
