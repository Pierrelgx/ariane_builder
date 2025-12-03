"use client";

import { useState } from "react";
import { ZodError } from "zod";
import { createProjectSchema } from "@schemas/projectSchema";
import { parseZodErrors } from "@utils/parseZodErrors";
import { button } from "@tv/button";
import { input } from "@tv/input";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: { id: string; name: string }) => void;
}

export default function CreateProjectModal({
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const parsed = createProjectSchema.parse({ name });

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ form: data.error || "Erreur lors de la création" });
        return;
      }

      const data = await response.json();
      onCreated(data.project);
      onClose();
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
          Nouveau projet
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-300 mb-1">
              Nom du projet
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input()}
              placeholder="Ma nouvelle timeline..."
              autoFocus
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
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
              {isSubmitting ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
