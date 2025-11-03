
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ClientProviders from '@/components/ClientProviders';
import GoogleAnalytics from '@/components/GoogleAnalytics';



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Jacob’s Nettoor – Custom Priest Vestments & Cassock Tailoring in Kochi since 1995",
  description: "From Orthodox to Jacobite, Mar Thoma & CSI clergy: trust Jacob’s Nettoor in Nettoor (Kochi) for handcrafted, perfect-fit priest vestments and cassocks. Established 1995 – we deliver across India and abroad. Contact us now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/jacobs.svg  " />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <GoogleAnalytics />
        
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
