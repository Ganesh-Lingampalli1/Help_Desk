import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  BarChart3,
  Settings,
  UserCheck,
  Inbox,
  User,
  ShieldCheck,
  Headphones,
  Briefcase,
  Activity,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || "employee";

  const getNavItems = () => {
    switch (role) {
      case "admin":
        return [
          {
            section: "Analytics & Monitoring",
            items: [
              { name: "Overview Dashboard", path: "/", icon: LayoutDashboard },
              { name: "Analytics & SLA Reports", path: "/admin/analytics", icon: BarChart3 },
            ],
          },
          {
            section: "Management",
            items: [
              { name: "All System Tickets", path: "/admin/tickets", icon: Ticket },
              { name: "User Directory", path: "/admin/users", icon: Users },
              { name: "System Settings", path: "/admin/settings", icon: Settings },
            ],
          },
          {
            section: "Account",
            items: [{ name: "My Profile", path: "/profile", icon: User }],
          },
        ];

      case "agent":
        return [
          {
            section: "Agent Workspace",
            items: [
              { name: "Agent Dashboard", path: "/", icon: LayoutDashboard },
              { name: "Assigned to Me", path: "/agent/assigned", icon: UserCheck },
              { name: "Unassigned Queue", path: "/agent/queue", icon: Inbox },
            ],
          },
          {
            section: "Account",
            items: [{ name: "My Profile", path: "/profile", icon: User }],
          },
        ];

      case "employee":
      default:
        return [
          {
            section: "Support Portal",
            items: [
              { name: "Employee Dashboard", path: "/", icon: LayoutDashboard },
              { name: "Submit New Ticket", path: "/tickets/new", icon: PlusCircle },
              { name: "My Tickets", path: "/my-tickets", icon: Ticket },
            ],
          },
          {
            section: "Account",
            items: [{ name: "My Profile", path: "/profile", icon: User }],
          },
        ];
    }
  };

  const navSections = getNavItems();

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return {
          label: "Administrator",
          icon: ShieldCheck,
          color: "text-purple-700 bg-purple-50/80 border-purple-200",
          desc: "Full System Control",
        };
      case "agent":
        return {
          label: "Support Agent",
          icon: Headphones,
          color: "text-blue-700 bg-blue-50/80 border-blue-200",
          desc: "Queue & Resolution",
        };
      case "employee":
      default:
        return {
          label: "Employee Portal",
          icon: Briefcase,
          color: "text-slate-700 bg-slate-100/80 border-slate-200",
          desc: "Self-Service Support",
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Role identification strip */}
        <div className="p-4 border-b border-slate-100">
          <div className={`p-3 rounded-xl border ${roleInfo.color} flex items-center gap-3`}>
            <div className="p-2 rounded-lg bg-white/80 shadow-xs">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">{roleInfo.label}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{roleInfo.desc}</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.section}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <ItemIcon
                            className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-auto" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info & live SLA indicator */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SLA Engine
            </span>
            <span className="font-semibold text-emerald-700">Active</span>
          </div>
          <div className="text-center text-[10px] text-slate-400">
            HelpDesk Enterprise • v1.0 Production
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
