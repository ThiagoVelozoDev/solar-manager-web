import { useState } from "react";
import { Header } from "../ui/header";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../ui/sidebar";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">

      {/* Header */}
      <Header alarmsCount={0} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Conteúdo abaixo */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-6 md:px-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}