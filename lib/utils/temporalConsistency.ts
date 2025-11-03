/**
 * Temporal Consistency Checker
 * Detects temporal inconsistencies in event timelines
 */

interface Event {
  id: string;
  date?: string | null;
  nexts?: Array<{
    nextId: string | null;
    type: string;
  }>;
}

/**
 * Detects events with temporal inconsistencies
 * An inconsistency occurs when:
 * 1. A LINEAR connection goes from a later date to an earlier date
 * 2. An event has a date but connects to an undated event via LINEAR connection
 *
 * @param events - Array of events with connections
 * @returns Set of event IDs that have inconsistencies
 */
export function detectTemporalInconsistencies(events: Event[]): Set<string> {
  const inconsistentEvents = new Set<string>();
  const eventMap = new Map(events.map((e) => [e.id, e]));

  for (const event of events) {
    // Skip if event has no date
    if (!event.date) continue;

    const eventDate = new Date(event.date);

    // Check all outgoing connections
    for (const connection of event.nexts || []) {
      if (!connection.nextId) continue;

      const nextEvent = eventMap.get(connection.nextId);
      if (!nextEvent) continue;

      // Only check LINEAR connections for inconsistencies
      // TIMETRAVEL connections are expected to go backwards
      if (connection.type === "LINEAR") {
        // Case 1: Next event has no date but current event does
        if (!nextEvent.date) {
          inconsistentEvents.add(event.id);
          inconsistentEvents.add(nextEvent.id);
          continue;
        }

        // Case 2: Next event's date is before current event's date
        const nextEventDate = new Date(nextEvent.date);
        if (nextEventDate < eventDate) {
          inconsistentEvents.add(event.id);
          inconsistentEvents.add(nextEvent.id);
        }
      }
    }
  }

  return inconsistentEvents;
}

/**
 * Validates if a new connection would create a temporal inconsistency
 *
 * @param sourceEvent - The source event
 * @param targetEvent - The target event
 * @param connectionType - Type of connection (LINEAR or TIMETRAVEL)
 * @returns true if connection is valid, false if it would create an inconsistency
 */
export function validateConnection(
  sourceEvent: { date?: string | null },
  targetEvent: { date?: string | null },
  connectionType: "LINEAR" | "TIMETRAVEL"
): { valid: boolean; reason?: string } {
  // TIMETRAVEL connections can always go backwards
  if (connectionType === "TIMETRAVEL") {
    return { valid: true };
  }

  // For LINEAR connections:
  // If both events have dates, target must be after or equal to source
  if (sourceEvent.date && targetEvent.date) {
    const sourceDate = new Date(sourceEvent.date);
    const targetDate = new Date(targetEvent.date);

    if (targetDate < sourceDate) {
      return {
        valid: false,
        reason:
          "Connexion linéaire invalide : l'événement cible est antérieur à l'événement source. Utilisez une connexion de voyage temporel.",
      };
    }
  }

  // If source has a date but target doesn't (or vice versa), it's technically ok
  // but we flag it as a warning in the detection function

  return { valid: true };
}

/**
 * Get suggestions for fixing temporal inconsistencies
 *
 * @param events - Array of events
 * @param inconsistentEventIds - Set of inconsistent event IDs
 * @returns Array of suggestions
 */
export function getInconsistencySuggestions(
  events: Event[],
  inconsistentEventIds: Set<string>
): Array<{ eventId: string; suggestion: string }> {
  const suggestions: Array<{ eventId: string; suggestion: string }> = [];
  const eventMap = new Map(events.map((e) => [e.id, e]));

  for (const eventId of inconsistentEventIds) {
    const event = eventMap.get(eventId);
    if (!event) continue;

    // Check why this event is inconsistent
    if (!event.date) {
      suggestions.push({
        eventId,
        suggestion: "Ajoutez une date à cet événement pour résoudre l'incohérence.",
      });
      continue;
    }

    const eventDate = new Date(event.date);

    for (const connection of event.nexts || []) {
      if (!connection.nextId || connection.type !== "LINEAR") continue;

      const nextEvent = eventMap.get(connection.nextId);
      if (!nextEvent) continue;

      if (!nextEvent.date) {
        suggestions.push({
          eventId,
          suggestion: `Ajoutez une date à l'événement connecté ou supprimez la connexion.`,
        });
      } else {
        const nextEventDate = new Date(nextEvent.date);
        if (nextEventDate < eventDate) {
          suggestions.push({
            eventId,
            suggestion: `Changez le type de connexion en "Voyage temporel" ou ajustez les dates.`,
          });
        }
      }
    }
  }

  return suggestions;
}
