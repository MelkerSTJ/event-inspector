export interface Project {
  id: string;
  name: string;
  writeKey: string;
  domain: string;
  createdAt: string;
}

// Mock projects database
// IMPORTANT: The writeKey here must match what's used in the tracking snippet
export const projects: Project[] = [
  {
    id: 'moteva',
    name: 'Moteva',
    writeKey: 'wr_moteva_live_abc123xyz789',  // <-- ÄNDRA TILL DIN RIKTIGA WRITEKEY
    domain: 'moteva.vercel.app',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'demo',
    name: 'Demo Project',
    writeKey: 'wr_demo_live_demo123demo456',
    domain: 'demo.example.com',
    createdAt: '2024-01-10T08:00:00Z',
  },
];

// Helper to find project by ID
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

// Helper to find project by writeKey
export function getProjectByWriteKey(writeKey: string): Project | undefined {
  return projects.find((p) => p.writeKey === writeKey);
}

// Helper to validate writeKey
export function isValidWriteKey(writeKey: string): boolean {
  return projects.some((p) => p.writeKey === writeKey);
}
