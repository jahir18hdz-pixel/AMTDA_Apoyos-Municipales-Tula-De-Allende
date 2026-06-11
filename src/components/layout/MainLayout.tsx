import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-slate-100"
      style={
        {
          "--sidebar-w": collapsed ? "92px" : "320px",
        } as React.CSSProperties
      }
    >
      <div className="hidden min-h-screen lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]">
        <Sidebar
          collapsed={collapsed}
          onBackgroundToggle={() => setCollapsed((value) => !value)}
        />

        <div className="flex min-w-0 flex-col">
          <div className="p-4 pb-0 lg:p-6 lg:pb-0">
            <Header onMenuClick={() => setCollapsed((value) => !value)} />
          </div>

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <div className="min-h-screen lg:hidden">
        <div className="fixed left-0 top-0 z-50 h-screen w-[320px] transition-transform duration-300">
          {mobileOpen && <Sidebar onNavigate={() => setMobileOpen(false)} />}
        </div>

        {mobileOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white"
              onClick={() => setMobileOpen(true)}
            >
              <FiMenu />
            </button>

            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Presi 2.0
              </p>

              <h2 className="text-sm font-semibold text-slate-900">
                Apoyos Municipales
              </h2>
            </div>
          </header>

          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
