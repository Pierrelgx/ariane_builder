"use client";

import { useState } from "react";
import { ZodError } from "zod";
import { changePasswordSchema } from "@schemas/userSchema";
import { parseZodErrors } from "@utils/parseZodErrors";
import { button } from "@tv/button";
import { input } from "@tv/input";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const parsed = changePasswordSchema.parse(formData);

      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ form: data.error || "Erreur lors de la mise à jour" });
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        setErrors(parseZodErrors(error));
      } else {
        setErrors({ form: "Erreur inconnue" });
      }
    } finally {
      setIsSubmitting(false);
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
        <h2 className="text-xl font-bold text-white mb-4">
          Changer le mot de passe
        </h2>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-lg font-medium">
              Mot de passe mis à jour !
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm text-gray-300 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={input()}
                placeholder="••••••••"
              />
              {errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-300 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={input()}
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm text-gray-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                className={input()}
                placeholder="••••••••"
              />
              {errors.confirmNewPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmNewPassword}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-red-400 text-sm">{errors.form}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-dark-500 rounded-lg text-gray-300 hover:bg-dark-400 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={button({ intent: "nature", size: "md" }) + " flex-1"}
              >
                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
