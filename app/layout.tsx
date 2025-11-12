import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AksharA - Learn to Write English Alphabets",
  description: "An interactive web app for children to learn English alphabet writing using AI-powered handwriting recognition",
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
