import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

/**
 * Progressive identity resolution hook
 * Step A: Check if User is authenticated (Base44)
 * Step B: Check if Person entity exists for this User
 * 
 * Returns:
 * - user: Base44 User object (null if not logged in)
 * - person: Application Person entity (null if not created yet)
 * - isLoading: true while checking
 * - needsPersonCreation: true if User exists but Person does not
 * - refetch: function to re-check Person after creation
 */
export function usePersonIdentity() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Step A: Check User authentication
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // Step B: Check Person entity (only if User exists)
  const { 
    data: person, 
    isLoading: isLoadingPerson, 
    refetch: refetchPerson 
  } = useQuery({
    queryKey: ['person-identity', user?.id],
    queryFn: async () => {
      // Find Person created by this User
      const people = await base44.entities.Person.filter({
        created_by: user.email
      });
      
      // Return first Person (should only be one per User)
      return people.length > 0 ? people[0] : null;
    },
    enabled: !!user, // Only run query if User exists
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const needsPersonCreation = user && !isLoadingPerson && !person;

  return {
    user,
    person,
    isLoading: isLoadingUser || (user && isLoadingPerson),
    needsPersonCreation,
    refetch: refetchPerson
  };
}

/**
 * Ensure person identity before action
 * Handles login + person creation flow
 * 
 * Usage:
 * const { ensurePersonIdentity } = useEnsurePersonIdentity();
 * 
 * const handleAddProperty = async () => {
 *   const person = await ensurePersonIdentity();
 *   if (!person) return; // User cancelled
 *   // Proceed with action using person.id
 * };
 */
export function useEnsurePersonIdentity() {
  const { user, person, needsPersonCreation, refetch } = usePersonIdentity();
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [resolveCallback, setResolveCallback] = useState(null);

  const ensurePersonIdentity = () => {
    return new Promise((resolve) => {
      // Already have Person - resolve immediately
      if (person) {
        resolve(person);
        return;
      }

      // No User - trigger login
      if (!user) {
        base44.auth.redirectToLogin(window.location.pathname);
        resolve(null);
        return;
      }

      // User exists but no Person - show modal
      if (needsPersonCreation) {
        setResolveCallback(() => resolve);
        setShowPersonModal(true);
        return;
      }

      // Fallback
      resolve(null);
    });
  };

  const handlePersonCreated = async (newPerson) => {
    setShowPersonModal(false);
    await refetch(); // Refresh Person data
    if (resolveCallback) {
      resolveCallback(newPerson);
      setResolveCallback(null);
    }
  };

  const handleCancel = () => {
    setShowPersonModal(false);
    if (resolveCallback) {
      resolveCallback(null);
      setResolveCallback(null);
    }
  };

  return {
    ensurePersonIdentity,
    showPersonModal,
    handlePersonCreated,
    handleCancel
  };
}