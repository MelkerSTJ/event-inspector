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
    id: "jacson",
    name: "Jacson",
    domain: "jacson.se",
    environments: [
      { id: "prod", name: "Production", status: "live", writeKey: "wk_jacson_prod_xxx" },
      { id: "stage", name: "Staging", status: "paused", writeKey: "wk_jacson_stage_xxx" }
    ]
  },
  {
    id: "dogman",
    name: "Dogman",
    domain: "dogman.se",
    environments: [{ id: "prod", name: "Production", status: "live", writeKey: "wk_dogman_prod_xxx" }]
  }
];

export function getProjectById(id: string) {
  return mockProjects.find((p) => p.id === id) ?? null;
}
