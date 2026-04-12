import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EuroDraft — Euroleague Predictions",
  description: "Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.",
  keywords: ["euroleague", "predictions", "basketball", "eurodraft"],
  openGraph: {
    title: "EuroDraft — Euroleague Predictions",
    description: "Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#080808] text-white min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}