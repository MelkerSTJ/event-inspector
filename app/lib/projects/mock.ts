export type EnvironmentStatus = "live" | "test";

export interface Environment {
  id: string;
  name: string;
  status: EnvironmentStatus;
  writeKey: string;
}

export interface Project {
  id: string;
  name: string;
  // project-level writeKey kan du behålla om du vill, men i UI:t använder du env.writeKey
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
    writeKey: "wr_moteva_project_abc123", // valfri / kan vara samma som live
    domain: "moteva.vercel.app",
    createdAt: "2024-01-15T10:00:00Z",
    environments: [
      {
        id: "moteva-live",
        name: "Production",
        status: "live",
        writeKey: "wr_moteva_live_abc123xyz789", // <-- DIN riktiga live writeKey
      },
      {
        id: "moteva-test",
        name: "Staging",
        status: "test",
        writeKey: "wr_moteva_test_abc123xyz789", // <-- staging/test writeKey (kan vara vad som helst i mock)
      },
    ],
  },
  {
    id: "demo",
    name: "Demo Project",
    writeKey: "wr_demo_project_demo123",
    domain: "demo.example.com",
    createdAt: "2024-01-10T08:00:00Z",
    environments: [
      {
        id: "demo-live",
        name: "Production",
        status: "live",
        writeKey: "wr_demo_live_demo123demo456",
      },
      {
        id: "demo-test",
        name: "Staging",
        status: "test",
        writeKey: "wr_demo_test_demo123demo456",
      },
    ],
  },
];

// Helper to find project by ID
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

// Helper to find project by writeKey (matchar både project och environments)
export function getProjectByWriteKey(writeKey: string): Project | undefined {
  return projects.find(
    (p) => p.writeKey === writeKey || p.environments.some((e) => e.writeKey === writeKey)
  );
}

// Helper to validate writeKey
export function isValidWriteKey(writeKey: string): boolean {
  return projects.some(
    (p) => p.writeKey === writeKey || p.environments.some((e) => e.writeKey === writeKey)
  );
}
