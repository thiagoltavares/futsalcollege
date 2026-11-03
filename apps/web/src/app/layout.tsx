import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Endereço base das URLs absolutas dos metadados (a imagem de
  // compartilhamento precisa de URL completa para o WhatsApp buscar).
  metadataBase: new URL("https://revela10.com.br"),
  title: {
    default: "Revela 10",
    template: "%s",
  },
  description:
    "Vitrine do atleta de base de futsal e fut7: vídeo, foto e ficha, publicados com autorização do responsável.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
