import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "../../web/components/layout/Sidebar";
import Topbar from "../../web/components/layout/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "InvFin",
  description: "Inventory + Finance Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
