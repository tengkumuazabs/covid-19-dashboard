import { SidebarProvider } from "../context/SidebarContext";
import { Outlet } from "react-router";

const LayoutContent: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <Outlet />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
