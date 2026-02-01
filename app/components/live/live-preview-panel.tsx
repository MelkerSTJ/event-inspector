"use client";

import { useMemo, useState } from "react";
import { LiveFeed } from "app/components/live/live-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type EnvironmentStatus = "live" | "test";

export type LivePreviewEnvironment = {
  id: string;
  name: string;
  status: EnvironmentStatus;
  writeKey: string;
};

export type LivePreviewPanelProps = {
  projectId: string;
  environments: LivePreviewEnvironment[];
};

export function LivePreviewPanel({ projectId, environments }: LivePreviewPanelProps) {
  // default: välj live env om den finns, annars första
  const defaultEnvId = useMemo(() => {
    const live = environments.find((e) => e.status === "live");
    return live?.id ?? environments[0]?.id ?? "";
  }, [environments]);

  const [selectedEnvId, setSelectedEnvId] = useState<string>(defaultEnvId);

  const selectedEnv = useMemo(() => {
    return environments.find((e) => e.id === selectedEnvId) ?? null;
  }, [environments, selectedEnvId]);

  const sessionId = useMemo(() => {
    // enkel "session id" för filtrering i din SSE (valfritt)
    // kan bytas senare mot riktig session från snippet
    return selectedEnv ? `${projectId}:${selectedEnv.id}` : null;
  }, [projectId, selectedEnv]);

  if (!environments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No environments found for this project.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Environments</CardTitle>
          <Badge variant="outline">{projectId}</Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Pick environment to view incoming events.
          </div>

          <div className="flex flex-wrap gap-2">
            {environments.map((env) => {
              const active = env.id === selectedEnvId;
              return (
                <Button
                  key={env.id}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setSelectedEnvId(env.id)}
                >
                  {env.name}
                  <span className="ml-2 text-xs opacity-80">• {env.status}</span>
                </Button>
              );
            })}
          </div>

          {selectedEnv && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{selectedEnv.name}</div>
                <Badge variant={selectedEnv.status === "live" ? "secondary" : "outline"}>
                  {selectedEnv.status}
                </Badge>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">Write key</div>
              <div className="mt-1 font-mono text-xs break-all">{selectedEnv.writeKey}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <LiveFeed projectId={projectId} sessionId={sessionId} />
    </div>
  );
}
