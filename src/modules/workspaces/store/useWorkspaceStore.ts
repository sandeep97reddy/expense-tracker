/**
 * Workspaces Zustand Store
 * Handles workspaces list, active workspace context, and mock members/roles.
 * Persisted using MMKV so state persists across restarts.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { generateId } from '@/utils/helpers';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../types/workspace';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null; // null = Personal Account

  // Actions
  addWorkspace: (name: string) => string;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  inviteMember: (workspaceId: string, name: string, email: string, role: WorkspaceRole) => void;
  removeMember: (workspaceId: string, memberId: string) => void;
  changeMemberRole: (workspaceId: string, memberId: string, role: WorkspaceRole) => void;
  
  // Helpers
  getCurrentUserRole: () => WorkspaceRole; // Returns role of the active user in the active workspace
}

// Initial mock workspaces to show off roles and invite features instantly
const getInitialWorkspaces = (): Workspace[] => {
  const authUser = useAuthStore.getState().user;
  const currentUserId = authUser?.id || 'guest_user_id';
  const currentUserName = authUser?.name || 'Guest User';
  const currentUserEmail = authUser?.email || 'guest@example.com';

  const now = new Date().toISOString();

  return [
    {
      id: 'family_workspace_id',
      name: 'Family Joint Account',
      createdBy: currentUserId,
      members: [
        {
          id: currentUserId,
          name: `${currentUserName} (You)`,
          email: currentUserEmail,
          role: 'admin',
          joinedAt: now,
        },
        {
          id: 'member_sarah',
          name: 'Sarah Connor',
          email: 'sarah@family.com',
          role: 'editor',
          joinedAt: now,
        },
        {
          id: 'member_john',
          name: 'John Connor',
          email: 'john@family.com',
          role: 'viewer',
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'roommates_workspace_id',
      name: 'Roommate Sync',
      createdBy: 'alex_mercer', // Created by someone else, making current user a viewer or editor
      members: [
        {
          id: 'alex_mercer',
          name: 'Alex Mercer',
          email: 'alex@roommates.com',
          role: 'admin',
          joinedAt: now,
        },
        {
          id: currentUserId,
          name: `${currentUserName} (You)`,
          email: currentUserEmail,
          role: 'editor', // Editor in this workspace
          joinedAt: now,
        },
        {
          id: 'member_diana',
          name: 'Diana Prince',
          email: 'diana@roommates.com',
          role: 'viewer',
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null, // Default to Personal Account

      addWorkspace: (name) => {
        const authUser = useAuthStore.getState().user;
        const currentUserId = authUser?.id || 'guest_user_id';
        const currentUserName = authUser?.name || 'Guest User';
        const currentUserEmail = authUser?.email || 'guest@example.com';

        const now = new Date().toISOString();
        const id = generateId();

        const newWorkspace: Workspace = {
          id,
          name,
          createdBy: currentUserId,
          members: [
            {
              id: currentUserId,
              name: `${currentUserName} (You)`,
              email: currentUserEmail,
              role: 'admin',
              joinedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          activeWorkspaceId: id, // Automatically switch to the newly created workspace
        }));

        return id;
      },

      deleteWorkspace: (id) => {
        set((state) => {
          const nextActive = state.activeWorkspaceId === id ? null : state.activeWorkspaceId;
          return {
            workspaces: state.workspaces.filter((w) => w.id !== id),
            activeWorkspaceId: nextActive,
          };
        });
      },

      setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id });
      },

      inviteMember: (workspaceId, name, email, role) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== workspaceId) return w;

            // Prevent duplicate invites
            if (w.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
              return w;
            }

            const newMember: WorkspaceMember = {
              id: generateId(),
              name,
              email,
              role,
              joinedAt: new Date().toISOString(),
            };

            return {
              ...w,
              members: [...w.members, newMember],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeMember: (workspaceId, memberId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== workspaceId) return w;
            return {
              ...w,
              members: w.members.filter((m) => m.id !== memberId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      changeMemberRole: (workspaceId, memberId, role) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== workspaceId) return w;
            return {
              ...w,
              members: w.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      getCurrentUserRole: () => {
        const { activeWorkspaceId, workspaces } = get();
        if (!activeWorkspaceId) return 'admin'; // Personal workspace has full admin rights

        const authUser = useAuthStore.getState().user;
        const currentUserId = authUser?.id || 'guest_user_id';

        const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
        if (!workspace) return 'admin';

        const member = workspace.members.find((m) => m.id === currentUserId);
        return member?.role || 'viewer'; // Default to viewer if member details aren't found
      },
    }),
    {
      name: 'expense-tracker-workspaces',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Set initial workspaces if state is empty upon hydration
      onRehydrateStorage: () => (state) => {
        if (state && state.workspaces.length === 0) {
          state.workspaces = getInitialWorkspaces();
        }
      },
    },
  ),
);
