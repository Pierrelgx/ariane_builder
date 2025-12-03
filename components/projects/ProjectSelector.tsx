"use client";

import { useState, useRef, useEffect } from "react";
import CreateProjectModal from "./CreateProjectModal";
import RenameProjectModal from "./RenameProjectModal";

interface Project {
  id: string;
  name: string;
  _count?: {
    events: number;
  };
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (project: Project) => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectSelector({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Supprimer le projet "${projectName}" et tous ses événements ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleteProject(projectId);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleRenameClick = (project: Project) => {
    setProjectToRename(project);
    setShowRenameModal(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-300 rounded-lg hover:bg-dark-400 transition min-w-[200px] border border-dark-500"
        >
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="flex-1 text-left text-gray-300 truncate">
            {currentProject?.name || "Sélectionner un projet"}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-black rounded-lg shadow-lg border border-dark-400 py-1 z-50">
            {/* Create new project button */}
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2 border-b border-dark-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau projet
            </button>

            {/* Projects list */}
            <div className="max-h-64 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Aucun projet. Créez-en un !
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between px-4 py-2 hover:bg-dark-400 group ${
                      currentProject?.id === project.id ? "bg-green-500/10" : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectProject(project);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-medium text-white truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project._count?.events || 0} événement(s)
                      </div>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(project);
                        }}
                        className="p-1 text-gray-500 hover:text-green-400"
                        title="Renommer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id, project.name);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(project) => {
            onCreateProject(project);
            onSelectProject(project);
          }}
        />
      )}
      {showRenameModal && projectToRename && (
        <RenameProjectModal
          projectId={projectToRename.id}
          currentName={projectToRename.name}
          onClose={() => {
            setShowRenameModal(false);
            setProjectToRename(null);
          }}
          onRenamed={onRenameProject}
        />
      )}
    </>
  );
}
