"use client";

import { useState, useEffect } from "react";

interface EventFormModalProps {
  isOpen: boolean;
  eventId?: string | null;
  initialData?: {
    title: string;
    description?: string;
    date?: string;
  };
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    date?: string;
  }) => Promise<void>;
}

export default function EventFormModal({
  isOpen,
  eventId,
  initialData,
  onClose,
  onSave,
}: EventFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDate(initialData.date || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        title,
        description: description || undefined,
        date: date || undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDate("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-black rounded-lg shadow-xl w-full max-w-md p-6 border border-dark-400">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {eventId ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300"
            disabled={isSubmitting}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-dark-500 rounded-md bg-dark-300 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-500"
              placeholder="Ex: Découverte de la machine à voyager dans le temps"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-dark-500 rounded-md bg-dark-300 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-500"
              placeholder="Décrivez l'événement..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Date
            </label>
            <input
              type="datetime-local"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-dark-500 rounded-md bg-dark-300 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 [color-scheme:dark]"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-dark-500 rounded-md text-gray-300 hover:bg-dark-400 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enregistrement..."
                : eventId
                ? "Mettre à jour"
                : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
