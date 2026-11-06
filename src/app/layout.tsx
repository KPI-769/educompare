import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "EduCompare — Plateforme d'Analyse Pédagogique",
  description: "Plateforme intelligente de suivi et d'analyse des performances pédagogiques",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

