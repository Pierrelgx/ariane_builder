"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface DeleteAccountModalProps {
  onClose: () => void;
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== "SUPPRIMER") return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-dark-200 rounded-xl shadow-xl w-full max-w-md p-6 border border-dark-400"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-red-400 mb-4">
          Supprimer mon compte
        </h2>

        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          Cette action est irréversible. Toutes vos données (projets, événements) seront définitivement supprimées.
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Pour confirmer, tapez <strong className="text-white">SUPPRIMER</strong> ci-dessous :
        </p>

        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-dark-500 rounded-lg mb-4 bg-dark-300 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
          placeholder="SUPPRIMER"
        />

        {error && (
          <div className="mb-4 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-dark-500 rounded-lg text-gray-300 hover:bg-dark-400 transition"
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== "SUPPRIMER" || isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Suppression..." : "Supprimer mon compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
