/**
 * Workspace type definitions
 */

export type WorkspaceRole = 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdBy: string; // User ID of creator
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}
