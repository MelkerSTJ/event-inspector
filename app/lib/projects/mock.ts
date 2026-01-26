export type Project = {
  id: string;
  name: string;
  domain: string;
  environments: Array<{
    id: string;
    name: "Production" | "Staging" | "Development";
    status: "live" | "paused";
  }>;
};

export const mockProjects: Project[] = [
  {
    id: "jacson",
    name: "Jacson",
    domain: "jacson.se",
    environments: [
      { id: "prod", name: "Production", status: "live" },
      { id: "stage", name: "Staging", status: "paused" }
    ]
  },
  {
    id: "dogman",
    name: "Dogman",
    domain: "dogman.se",
    environments: [{ id: "prod", name: "Production", status: "live" }]
  }
];

export function getProjectById(id: string) {
  return mockProjects.find((p) => p.id === id) ?? null;
}
