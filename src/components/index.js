import { registerSidebar } from "./Sidebar";
import { registerSidebarButton } from "./SidebarButton";
import { registerCanvas } from "./Canvas";

export { Sidebar } from "./Sidebar";
export { SidebarButton } from "./SidebarButton";
export { Canvas } from "./Canvas";

export const registerComponents = (() => {
  let initialized = false;

  return () => {
    if (initialized) {
      console.warn("components are already registered!");

      return;
    }

    initialized = true;

    registerSidebar();
    registerSidebarButton();
    registerCanvas();
  };
})();
