"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock,
  Globe,
  ChevronDown,
  ChevronRight,
  Trash2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type EventParams = {
  ei_session?: string | null;
  page_title?: string;
  referrer?: string;
  [key: string]: unknown;
};

interface EventData {
  id: string;
  projectId: string;
  name: string;
  url: string;
  timestamp: string;
  params: EventParams;
}

interface StreamConnectedMessage {
  type: "connected";
  timestamp: string;
  session: string | null;
  projectId?: string | null;
}

interface StreamEventMessage {
  type: "event";
  evt: EventData;
}

type StreamMessage = StreamConnectedMessage | StreamEventMessage;

interface LiveFeedProps {
  projectId: string;
  sessionId?: string | null;
  maxEvents?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEventData(value: unknown): value is EventData {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.name === "string" &&
    typeof value.url === "string" &&
    typeof value.timestamp === "string" &&
    isObject(value.params)
  );
}

function parseStreamMessage(raw: string): StreamMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isObject(data)) return null;
  if (data.type === "connected") {
    return {
      type: "connected",
      timestamp: typeof data.timestamp === "string" ? data.timestamp : "",
      session: typeof data.session === "string" || data.session === null ? data.session : null,
      projectId:
        typeof data.projectId === "string" || data.projectId === null
          ? data.projectId
          : null,
    };
  }

  if (data.type === "event" && "evt" in data && isEventData(data.evt)) {
    return { type: "event", evt: data.evt };
  }

  return null;
}

export function LiveFeed({
  projectId,
  sessionId,
  maxEvents = 100,
}: LiveFeedProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep latest connect in a ref to avoid "accessed before declared" + stale closures
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnects before starting a new connection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Build stream URL with filters
    const params = new URLSearchParams();
    params.set("projectId", projectId);
    if (sessionId) params.set("session", sessionId);

    const streamUrl = `/api/stream?${params.toString()}`;
    console.log("[LiveFeed] Connecting to:", streamUrl);

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("[LiveFeed] Connected");
      setIsConnected(true);
      setConnectionError(null);
    };

    es.onmessage = (evt) => {
      const msg = parseStreamMessage(evt.data);
      if (!msg) return;

      if (msg.type === "connected") {
        console.log("[LiveFeed] Stream ready:", msg);
        return;
      }

      if (msg.type === "event") {
        console.log("[LiveFeed] Event received:", msg.evt.name);

        setEvents((prev) => {
          const newEvents = [msg.evt, ...prev];
          return newEvents.slice(0, maxEvents);
        });
      }
    };

    es.onerror = (error) => {
      console.error("[LiveFeed] Connection error:", error);
      setIsConnected(false);
      setConnectionError("Connection lost. Reconnecting...");

      try {
        es.close();
      } catch {
        // ignore
      }

      // Reconnect after delay (use ref to always call latest connect)
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[LiveFeed] Attempting to reconnect...");
        connectRef.current();
      }, 3000);
    };
  }, [projectId, sessionId, maxEvents]);

  // update ref each render so timers always call latest connect
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Connect on mount and when filters change
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const toggleExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const clearEvents = () => setEvents([]);

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const getEventBadgeVariant = (
    name: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (name === "page_view") return "secondary";
    if (name.includes("error")) return "destructive";
    if (name.includes("click") || name.includes("submit")) return "default";
    return "outline";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Feed
              {isConnected ? (
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {sessionId ? (
                <span className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Filtering by session:{" "}
                  <code className="text-xs">{sessionId}</code>
                </span>
              ) : (
                "Showing all events"
              )}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearEvents}
              disabled={events.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {connectionError && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            {connectionError}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Waiting for events...</p>
              {sessionId && (
                <p className="text-xs mt-1">
                  Navigate the target site to trigger events
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <Collapsible
                  key={event.id}
                  open={expandedEvents.has(event.id)}
                  onOpenChange={() => toggleExpanded(event.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                      {expandedEvents.has(event.id) ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      <Badge variant={getEventBadgeVariant(event.name)}>
                        {event.name}
                      </Badge>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {event.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.timestamp)}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 pl-10">
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        {event.params.ei_session && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Session:
                            </span>
                            <code className="bg-background px-1.5 py-0.5 rounded">
                              {event.params.ei_session}
                            </code>
                          </div>
                        )}

                        {event.params.page_title && (
                          <div className="flex items-center gap-2 text-xs">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span>{event.params.page_title}</span>
                          </div>
                        )}

                        <div className="text-xs">
                          <span className="text-muted-foreground">URL: </span>
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {event.url}
                          </a>
                        </div>

                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View all parameters
                          </summary>
                          <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.params, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
