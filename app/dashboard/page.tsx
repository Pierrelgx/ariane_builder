"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TimelineCanvas from "@components/timeline/TimelineCanvas";
import EventFormModal from "@components/timeline/EventFormModal";
import ProfileDropdown from "@components/profile/ProfileDropdown";
import ProjectSelector from "@components/projects/ProjectSelector";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
  positionX: number;
  positionY: number;
  projectId?: string | null;
  nexts?: Array<{
    id: string;
    nextId: string | null;
    type: string;
    order: number;
  }>;
}

interface Project {
  id: string;
  name: string;
  _count?: {
    events: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data.projects);

      // Select first project if none selected
      if (data.projects.length > 0 && !currentProject) {
        setCurrentProject(data.projects[0]);
      }

      return data.projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }, [currentProject]);

  // Fetch events for current project
  const fetchEvents = useCallback(async (projectId?: string) => {
    try {
      const url = projectId
        ? `/api/events?projectId=${projectId}`
        : "/api/events";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: fetch projects then events
  useEffect(() => {
    if (status === "authenticated" && !importing) {
      fetchProjects().then((loadedProjects) => {
        if (loadedProjects.length > 0) {
          fetchEvents(loadedProjects[0].id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [status, importing]);

  // Fetch events when project changes
  useEffect(() => {
    if (currentProject) {
      fetchEvents(currentProject.id);
    }
  }, [currentProject?.id]);

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

        // Create a new project for imported data
        const projectResponse = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Timeline importée" }),
        });

        if (!projectResponse.ok) throw new Error("Failed to create project");
        const projectData = await projectResponse.json();
        const newProject = projectData.project;

        // Save each event to the new project
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
              projectId: newProject.id,
            }),
          });
        }

        // Clear local storage
        localStorage.removeItem("ariane-timeline-guest");

        // Reload projects and select the new one
        await fetchProjects();
        setCurrentProject(newProject);

        alert("Timeline importée avec succès !");
      }
    } catch (error) {
      console.error("Error importing local data:", error);
      alert("Erreur lors de l'import de la timeline");
    } finally {
      setImporting(false);
      router.replace("/dashboard");
    }
  };

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
  };

  // Handle project creation
  const handleCreateProject = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  // Handle project rename
  const handleRenameProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    if (currentProject?.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }
  };

  // Handle project deletion
  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProject?.id === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId);
      setCurrentProject(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length > 0) {
        fetchEvents(remaining[0].id);
      } else {
        setEvents([]);
      }
    }
  };

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

        if (currentProject) {
          await fetchEvents(currentProject.id);
        }
      } catch (error) {
        console.error("Error creating connection:", error);
        alert("Erreur lors de la création de la connexion");
      }
    },
    [currentProject, fetchEvents]
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

        if (currentProject) {
          await fetchEvents(currentProject.id);
        }
      } catch (error) {
        console.error("Error deleting connection:", error);
      }
    },
    [currentProject, fetchEvents]
  );

  // Handle save all events (positions)
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      for (const event of events) {
        await fetch(`/api/events/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: event.positionX,
            positionY: event.positionY,
          }),
        });
      }
      setSaveMessage("Sauvegardé !");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setSaveMessage("Erreur lors de la sauvegarde");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

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

        if (currentProject) {
          await fetchEvents(currentProject.id);
        }
      } else {
        // Create new event
        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            positionX: pendingPosition?.x || 0,
            positionY: pendingPosition?.y || 0,
            projectId: currentProject?.id,
          }),
        });

        if (!response.ok) throw new Error("Failed to create event");

        if (currentProject) {
          await fetchEvents(currentProject.id);
          // Update project count
          setProjects((prev) =>
            prev.map((p) =>
              p.id === currentProject.id
                ? { ...p, _count: { events: (p._count?.events || 0) + 1 } }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error("Error saving event:", error);
      throw error;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <div className="text-xl text-gray-300">Chargement...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-dark">
      <header className="bg-dark-100 shadow-lg border-b border-dark-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Ariane World Builder
              </h1>
              <p className="text-sm text-gray-400">
                Créez votre timeline avec des branches narratives
              </p>
            </div>
            <ProjectSelector
              projects={projects}
              currentProject={currentProject}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onRenameProject={handleRenameProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
          <div className="flex items-center gap-4">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes("Erreur") ? "text-red-400" : "text-green-400"}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSaveAll}
              disabled={saving || events.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button
              onClick={() => {
                if (!currentProject) {
                  alert("Veuillez d'abord créer ou sélectionner un projet");
                  return;
                }
                // Décaler la position en fonction du nombre d'events existants
                const offset = events.length * 50;
                setPendingPosition({ x: 100 + offset, y: 100 + (offset % 200) });
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
              disabled={!currentProject}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Nouvel événement
            </button>
            {session && <ProfileDropdown session={session} />}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-dark-50">
        {!currentProject ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-300 mb-2">
                Aucun projet sélectionné
              </h2>
              <p className="text-gray-500">
                Créez un nouveau projet pour commencer
              </p>
            </div>
          </div>
        ) : (
          <TimelineCanvas
            events={events}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            onConnectionCreate={handleConnectionCreate}
            onConnectionDelete={handleConnectionDelete}
          />
        )}
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
