import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-dvh bg-slate-100"
      style={
        {
          "--sidebar-w": collapsed ? "92px" : "320px",
        } as React.CSSProperties
      }
    >
      {/* DESKTOP */}
      <div className="hidden min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]">
        <Sidebar
          collapsed={collapsed}
          onBackgroundToggle={() => setCollapsed((value) => !value)}
        />

        <div className="flex min-w-0 flex-col">
          <div className="p-4 pb-0 lg:p-6 lg:pb-0">
            <Header onMenuClick={() => setCollapsed((value) => !value)} />
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* MOBILE */}
      <div className="min-h-dvh lg:hidden">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 h-dvh w-[min(86vw,320px)] transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col">
          <div className="sticky top-0 z-30 p-3 pb-0">
            <Header onMenuClick={() => setMobileOpen(true)} />
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}