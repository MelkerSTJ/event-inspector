export type EnvironmentStatus = "live" | "test";

export interface Environment {
  id: string;
  name: string;
  status: EnvironmentStatus;
  endpoint?: string;
}

export interface Project {
  id: string;
  name: string;
  writeKey: string;
  domain: string;
  createdAt: string;
  environments: Environment[];
}

// Mock projects database
// IMPORTANT: The writeKey here must match what's used in the tracking snippet
export const projects: Project[] = [
  {
    id: "moteva",
    name: "Moteva",
    writeKey: "wr_moteva_live_abc123xyz789",
    domain: "moteva.vercel.app",
    createdAt: "2024-01-15T10:00:00Z",
    environments: [
      {
        id: "moteva-live",
        name: "Live",
        status: "live",
        endpoint: "https://event-inspector-pi.vercel.app/api/ingest",
      },
    ],
  },
  {
    id: "demo",
    name: "Demo Project",
    writeKey: "wr_demo_live_demo123demo456",
    domain: "demo.example.com",
    createdAt: "2024-01-10T08:00:00Z",
    environments: [
      { id: "demo-live", name: "Live", status: "live" },
      { id: "demo-test", name: "Test", status: "test" },
    ],
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
