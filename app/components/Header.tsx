"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home, User, ChevronDown, LogOut, LogIn } from "lucide-react";
import { useNotification } from "./Notification";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const { showNotification } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      showNotification("Signed out successfully", "success");
      setIsDropdownOpen(false);
    } catch {
      showNotification("Failed to sign out", "error");
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-[9999] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 text-white hover:text-gray-300 transition-colors duration-200 group"
              prefetch={true}
              onClick={() =>
                showNotification("Welcome to ImageKit ReelsPro", "info")
              }
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Video with AI
              </span>
            </Link>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700 hover:border-gray-600"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {session && (
                <span className="text-white text-sm font-medium hidden sm:block">
                  {session.user?.email?.split("@")[0]}
                </span>
              )}
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={closeDropdown}
                ></div>
                
                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[10000] overflow-hidden">
                  {session ? (
                    <>
                      {/* User Info */}
                      <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className=" w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {session.user?.email?.split("@")[0]}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              {session.user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        

                        <button
                          onClick={handleSignOut}
                          className="cursor-pointer flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors duration-200 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => {
                          showNotification("Please sign in to continue", "info");
                          closeDropdown();
                        }}
                      >
                        <LogIn className="w-4 h-4" />
                        <span className="font-medium">Login</span>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}