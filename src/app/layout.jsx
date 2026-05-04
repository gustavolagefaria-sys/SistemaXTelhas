// src/app/layout.jsx
import "./globals.css";
import SidebarShell from "./SidebarShell";

export const metadata = {
  title: "XTelhas — Sistema Financeiro",
  description: "Controle de faturamento, despesas e lucro líquido",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <SidebarShell>{children}</SidebarShell>
      </body>
    </html>
  );
}
