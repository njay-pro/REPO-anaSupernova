import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ana Style Transfer Machine",
  description: "Agentic Style Assistant for Ana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
