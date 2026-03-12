import { Header } from "../ui/header";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../ui/sidebar";

export function Layout() {
  return (
    <div className="flex h-screen flex-col">

      {/* Header */}
      <Header alarmsCount={0} />

      {/* Conteúdo abaixo */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}