export type Environment = {
  id: string;
  name: "Production" | "Staging" | "Development";
  status: "live" | "paused";
  writeKey: string;
};

export type Project = {
  id: string;
  name: string;
  domain: string;
  environments: Environment[];
};

export const mockProjects: Project[] = [
  {
    id: "moteva",
    name: "Moteva",
    domain: "moteva.vercel.app",
    environments: [
      { id: "prod", name: "Production", status: "live", writeKey: "wk_moteva_prod_123" }
    ]
  },
  {
    id: "jacson",
    name: "Jacson",
    domain: "jacson.se",
    environments: [
      { id: "prod", name: "Production", status: "live", writeKey: "wk_jacson_prod_123" },
      { id: "stage", name: "Staging", status: "paused", writeKey: "wk_jacson_stage_123" }
    ]
  },
  {
    id: "dogman",
    name: "Dogman",
    domain: "dogman.se",
    environments: [
      { id: "prod", name: "Production", status: "live", writeKey: "wk_dogman_prod_123" }
    ]
  }
];

export function getProjectById(id: string) {
  return mockProjects.find((p) => p.id === id) ?? null;
}
