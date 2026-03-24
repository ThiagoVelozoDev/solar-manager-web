import { Sun, Bell, Settings, User, LogOut, Menu } from "lucide-react";
import {Badge} from "../ui/badge";
import { useNavigate } from "react-router";

interface HeaderProps {
  alarmsCount: number;
  onSidebarToggle?: () => void;
}

export function Header({ alarmsCount, onSidebarToggle }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={onSidebarToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
            title="Menu"
          >
            <Menu className="size-5 text-gray-600" />
          </button>
          <div className="bg-amber-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <Sun className="size-5 sm:size-6 text-white" />
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="font-bold text-lg sm:text-xl truncate">Solar Manager</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Sistema de Gestão de Usinas Solares</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="size-5 text-gray-600" />
            {alarmsCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {alarmsCount}
              </Badge>
            )}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
            <Settings className="size-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
            <User className="size-5 text-gray-600" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
            title="Sair"
          >
            <LogOut className="size-5 text-gray-600 group-hover:text-red-600" />
          </button>
        </div>
      </div>
    </header>
  );
}