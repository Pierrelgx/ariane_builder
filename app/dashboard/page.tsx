"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TimelineCanvas from "@components/timeline/TimelineCanvas";
import EventFormModal from "@components/timeline/EventFormModal";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
  positionX: number;
  positionY: number;
  nexts?: Array<{
    id: string;
    nextId: string | null;
    type: string;
    order: number;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Import local data if requested
  useEffect(() => {
    if (status === "authenticated" && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("import") === "local") {
        importLocalData();
      }
    }
  }, [status]);

  const importLocalData = async () => {
    setImporting(true);
    try {
      const localData = localStorage.getItem("ariane-timeline-guest");
      if (localData) {
        const parsed = JSON.parse(localData);
        const localEvents = parsed.events || [];

        // Save each event to the server
        for (const event of localEvents) {
          await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: event.title,
              description: event.description,
              date: event.date,
              positionX: event.positionX,
              positionY: event.positionY,
            }),
          });
        }

        // Clear local storage
        localStorage.removeItem("ariane-timeline-guest");

        // Reload events
        await fetchEvents();

        alert("✅ Timeline importée avec succès !");
      }
    } catch (error) {
      console.error("Error importing local data:", error);
      alert("❌ Erreur lors de l'import de la timeline");
    } finally {
      setImporting(false);
      // Remove import param from URL
      router.replace("/dashboard");
    }
  };

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !importing) {
      fetchEvents();
    }
  }, [status, importing, fetchEvents]);

  // Handle event creation
  const handleEventCreate = useCallback((position: { x: number; y: number }) => {
    setPendingPosition(position);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  // Handle event position update
  const handleEventUpdate = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? { ...event, positionX: position.x, positionY: position.y }
            : event
        )
      );
    },
    []
  );

  // Handle event edit
  const handleEventEdit = useCallback(
    (id: string) => {
      const event = events.find((e) => e.id === id);
      if (event) {
        setSelectedEvent(event);
        setIsModalOpen(true);
      }
    },
    [events]
  );

  // Handle event delete
  const handleEventDelete = useCallback(async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Erreur lors de la suppression de l'événement");
    }
  }, []);

  // Handle connection creation
  const handleConnectionCreate = useCallback(
    async (source: string, target: string, type: string) => {
      try {
        const response = await fetch(`/api/events/${source}/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetEventId: target,
            connectionType: type,
          }),
        });

        if (!response.ok) throw new Error("Failed to create connection");

        // Refresh events to get updated connections
        await fetchEvents();
      } catch (error) {
        console.error("Error creating connection:", error);
        alert("Erreur lors de la création de la connexion");
      }
    },
    [fetchEvents]
  );

  // Handle connection deletion
  const handleConnectionDelete = useCallback(
    async (source: string, target: string) => {
      try {
        const response = await fetch(`/api/events/${source}/connect`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetEventId: target }),
        });

        if (!response.ok) throw new Error("Failed to delete connection");

        await fetchEvents();
      } catch (error) {
        console.error("Error deleting connection:", error);
      }
    },
    [fetchEvents]
  );

  // Handle form save
  const handleFormSave = async (data: {
    title: string;
    description?: string;
    date?: string;
  }) => {
    try {
      if (selectedEvent) {
        // Update existing event
        const response = await fetch(`/api/events/${selectedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update event");

        await fetchEvents();
      } else {
        // Create new event
        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            positionX: pendingPosition?.x || 0,
            positionY: pendingPosition?.y || 0,
          }),
        });

        if (!response.ok) throw new Error("Failed to create event");

        await fetchEvents();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      throw error;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Ariane World Builder
            </h1>
            <p className="text-sm text-gray-600">
              Créez votre timeline avec des branches narratives et des voyages dans le
              temps
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.email}
            </span>
            <button
              onClick={() => {
                setPendingPosition({ x: 100, y: 100 });
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Nouvel événement
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        <TimelineCanvas
          events={events}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventEdit={handleEventEdit}
          onEventDelete={handleEventDelete}
          onConnectionCreate={handleConnectionCreate}
          onConnectionDelete={handleConnectionDelete}
        />
      </main>

      <EventFormModal
        isOpen={isModalOpen}
        eventId={selectedEvent?.id}
        initialData={
          selectedEvent
            ? {
                title: selectedEvent.title,
                description: selectedEvent.description || undefined,
                date: selectedEvent.date
                  ? new Date(selectedEvent.date)
                      .toISOString()
                      .slice(0, 16)
                  : undefined,
              }
            : undefined
        }
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setPendingPosition(null);
        }}
        onSave={handleFormSave}
      />
    </div>
  );
}
