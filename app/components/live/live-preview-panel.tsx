'use client';

import { useState, useCallback } from 'react';
import { ExternalLink, Play, Square, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface LivePreviewPanelProps {
  projectId: string;
  defaultUrl?: string;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: () => void;
}

export function LivePreviewPanel({
  projectId,
  defaultUrl = '',
  onSessionStart,
  onSessionEnd,
}: LivePreviewPanelProps) {
  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ei_${timestamp}_${random}`;
  }, []);

  // Build URL with session parameter
  const buildSessionUrl = useCallback((url: string, session: string) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('ei_session', session);
      return urlObj.toString();
    } catch {
      // If URL parsing fails, append manually
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}ei_session=${session}`;
    }
  }, []);

  // Start live preview
  const handleStartPreview = useCallback(() => {
    if (!targetUrl) return;

    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsActive(true);

    // Build URL with session parameter
    const sessionUrl = buildSessionUrl(targetUrl, newSessionId);

    // Open in new tab
    window.open(sessionUrl, '_blank', 'noopener,noreferrer');

    // Notify parent component
    onSessionStart?.(newSessionId);

    console.log('[LivePreview] Started session:', {
      sessionId: newSessionId,
      targetUrl: sessionUrl,
    });
  }, [targetUrl, generateSessionId, buildSessionUrl, onSessionStart]);

  // Stop live preview
  const handleStopPreview = useCallback(() => {
    setIsActive(false);
    setSessionId(null);
    onSessionEnd?.();

    console.log('[LivePreview] Session ended');
  }, [onSessionEnd]);

  // Open target in new tab (for re-opening)
  const handleOpenInNewTab = useCallback(() => {
    if (!targetUrl || !sessionId) return;

    const sessionUrl = buildSessionUrl(targetUrl, sessionId);
    window.open(sessionUrl, '_blank', 'noopener,noreferrer');
  }, [targetUrl, sessionId, buildSessionUrl]);

  // Copy session URL
  const handleCopyUrl = useCallback(() => {
    if (!targetUrl || !sessionId) return;

    const sessionUrl = buildSessionUrl(targetUrl, sessionId);
    navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [targetUrl, sessionId, buildSessionUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Preview</span>
          {isActive && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Open your target site in a new tab to capture live events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target URL Input */}
        <div className="space-y-2">
          <Label htmlFor="target-url">Target URL</Label>
          <Input
            id="target-url"
            type="url"
            placeholder="https://your-site.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isActive}
          />
        </div>

        {/* Session Info (when active) */}
        {isActive && sessionId && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session ID</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {sessionId}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button
              className="flex-1"
              onClick={handleStartPreview}
              disabled={!targetUrl}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Live Preview
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleStopPreview}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleStartPreview}
                title="Start new session"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>How it works:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Click Start Live Preview to generate a session</li>
            <li>Your target site opens in a new tab with the session ID</li>
            <li>Events from that tab appear in the Live Feed below</li>
            <li>Only events with matching session ID are shown</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

