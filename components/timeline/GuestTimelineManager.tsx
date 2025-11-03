"use client";

import { useState, useEffect, useCallback } from "react";
import TimelineCanvas from "./TimelineCanvas";
import EventFormModal from "./EventFormModal";

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

const STORAGE_KEY = "ariane-timeline-guest";

// Generate a unique ID
function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function GuestTimelineManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setEvents(data.events || []);
      } catch (e) {
        console.error("Failed to load timeline from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage whenever events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          events,
          lastSaved: new Date().toISOString(),
        })
      );
    }
  }, [events]);

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
  const handleEventDelete = useCallback((id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    setEvents((prev) => {
      // Remove event and all connections
      const filtered = prev.filter((event) => event.id !== id);
      return filtered.map((event) => ({
        ...event,
        nexts: event.nexts?.filter((conn) => conn.nextId !== id),
      }));
    });
  }, []);

  // Handle connection creation
  const handleConnectionCreate = useCallback(
    (source: string, target: string, type: string) => {
      setEvents((prev) => {
        return prev.map((event) => {
          if (event.id === source) {
            const existingNexts = event.nexts || [];
            // Check if connection already exists
            const exists = existingNexts.some(
              (conn) => conn.nextId === target
            );
            if (exists) return event;

            const newConnection = {
              id: generateId(),
              nextId: target,
              type,
              order: existingNexts.length,
            };

            return {
              ...event,
              nexts: [...existingNexts, newConnection],
            };
          }
          return event;
        });
      });
    },
    []
  );

  // Handle connection deletion
  const handleConnectionDelete = useCallback(
    (source: string, target: string) => {
      setEvents((prev) => {
        return prev.map((event) => {
          if (event.id === source) {
            return {
              ...event,
              nexts: event.nexts?.filter((conn) => conn.nextId !== target),
            };
          }
          return event;
        });
      });
    },
    []
  );

  // Handle form save
  const handleFormSave = async (data: {
    title: string;
    description?: string;
    date?: string;
  }) => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: data.title,
                description: data.description || null,
                date: data.date || null,
              }
            : event
        )
      );
    } else {
      // Create new event
      const newEvent: Event = {
        id: generateId(),
        title: data.title,
        description: data.description || null,
        date: data.date || null,
        positionX: pendingPosition?.x || 0,
        positionY: pendingPosition?.y || 0,
        nexts: [],
      };

      setEvents((prev) => [...prev, newEvent]);
    }

    setIsModalOpen(false);
    setSelectedEvent(null);
    setPendingPosition(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating button to create event */}
      <button
        onClick={() => {
          setPendingPosition({ x: 100, y: 100 });
          setSelectedEvent(null);
          setIsModalOpen(true);
        }}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
      >
        + Nouvel événement
      </button>

      <TimelineCanvas
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventEdit={handleEventEdit}
        onEventDelete={handleEventDelete}
        onConnectionCreate={handleConnectionCreate}
        onConnectionDelete={handleConnectionDelete}
      />

      <EventFormModal
        isOpen={isModalOpen}
        eventId={selectedEvent?.id}
        initialData={
          selectedEvent
            ? {
                title: selectedEvent.title,
                description: selectedEvent.description || undefined,
                date: selectedEvent.date
                  ? new Date(selectedEvent.date).toISOString().slice(0, 16)
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
