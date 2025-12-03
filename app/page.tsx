"use client";

import { useState, useEffect } from "react";
import { RegisterForm } from "@components/forms/RegisterForm";
import { LoginForm } from "@components/forms/LoginForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestTimelineManager from "@components/timeline/GuestTimelineManager";
import ProfileDropdown from "@components/profile/ProfileDropdown";

export default function Home() {
  const [registerFormToggle, setRegisterFormToggle] = useState(false);
  const [loginFormToggle, setLoginFormToggle] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const toggleLoginForm = () => {
    setLoginFormToggle((prev) => !prev);
  };

  const toggleRegisterForm = () => {
    setRegisterFormToggle((prev) => !prev);
  };

  
  // Check if there's local data to save
  useEffect(() => {
    if (status === "authenticated") {
      const localData = localStorage.getItem("ariane-timeline-guest");
      if (localData) {
        setShowSavePrompt(true);
      }
    }
  }, [status]);

  const handleSaveToAccount = () => {
    // Redirect to dashboard which will handle the merge
    router.push("/dashboard?import=local");
  };

  const handleDiscardLocal = () => {
    localStorage.removeItem("ariane-timeline-guest");
    setShowSavePrompt(false);
    router.push("/dashboard");
  };

  return (
    <div className="h-screen flex flex-col bg-dark">
      {/* Header */}
      <header className="bg-dark-100 shadow-lg border-b border-dark-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Ariane World Builder
            </h1>
            <p className="text-sm text-gray-400">
              Créez votre timeline avec des branches narratives et des voyages dans
              le temps
            </p>
          </div>

          <div className="flex items-center gap-4">
            {status === "loading" && (
              <span className="text-sm text-gray-400">Chargement...</span>
            )}

            {status === "unauthenticated" && (
              <>
                <div className="text-sm text-gray-400 mr-2">
                  Créez sans compte, sauvegardez en vous connectant
                </div>
                <button
                  onClick={toggleRegisterForm}
                  className="px-4 py-2 border border-dark-500 rounded-lg text-gray-300 hover:bg-dark-400 transition"
                >
                  S'inscrire
                </button>
                <button
                  onClick={toggleLoginForm}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Se connecter
                </button>
              </>
            )}

            {status === "authenticated" && session && (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Mon Dashboard
                </button>
                <ProfileDropdown session={session} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Save prompt for logged users with local data */}
      {showSavePrompt && (
        <div className="bg-dark-300 border-b border-green-600/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400">
                Vous avez une timeline en cours. Voulez-vous la sauvegarder dans
                votre compte ?
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDiscardLocal}
                className="px-3 py-1 text-sm border border-dark-500 rounded text-gray-300 hover:bg-dark-400"
              >
                Ignorer
              </button>
              <button
                onClick={handleSaveToAccount}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Timeline Canvas */}
      <main className="flex-1 bg-dark-50">
        <GuestTimelineManager />
      </main>

      {/* Modals */}
      {registerFormToggle && <RegisterForm handleClick={toggleRegisterForm} />}
      {loginFormToggle && <LoginForm handleClick={toggleLoginForm} />}
    </div>
  );
}
