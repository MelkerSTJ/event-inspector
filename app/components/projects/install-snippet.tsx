'use client';

import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InstallSnippetProps {
  projectId: string;
  writeKey: string;
}

export function InstallSnippet({ projectId, writeKey }: InstallSnippetProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Production endpoint
  const endpoint = 'https://event-inspector-pi.vercel.app/api/ingest';
  const scriptUrl = 'https://event-inspector-pi.vercel.app/ei.js';

  // GTM Custom HTML snippet (2 script tags as requested)
  const gtmSnippet = `<!-- Event Inspector Configuration -->
<script>
  window.__EI_WRITE_KEY__ = '${writeKey}';
  window.__EI_ENDPOINT__ = '${endpoint}';
</script>

<!-- Event Inspector Tracking Script -->
<script src=\"${scriptUrl}\" async></script>`;

  // Direct HTML snippet
  const htmlSnippet = `<!-- Event Inspector Tracking -->
<script>
  window.__EI_WRITE_KEY__ = '${writeKey}';
  window.__EI_ENDPOINT__ = '${endpoint}';
</script>
<script src=\"${scriptUrl}\" async></script>`;

  // Manual tracking example
  const manualTrackingExample = `// Track custom events
window._ei_track('button_click', {
  button_id: 'cta-signup',
  button_text: 'Sign Up Now'
});

// Track form submissions
window._ei_track('form_submit', {
  form_id: 'contact-form',
  form_name: 'Contact Us'
});

// Track purchases
window._ei_track('purchase', {
  product_id: 'prod_123',
  product_name: 'Premium Plan',
  value: 99.00,
  currency: 'USD'
});`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Installation Snippet
        </CardTitle>
        <CardDescription>
          Add this snippet to your website to start tracking events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gtm" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gtm">GTM</TabsTrigger>
            <TabsTrigger value="html">Direct HTML</TabsTrigger>
            <TabsTrigger value="manual">Manual Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="gtm" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Add as a <strong>Custom HTML</strong> tag in Google Tag Manager:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to Tags → New → Custom HTML</li>
                <li>Paste the snippet below</li>
                <li>Set trigger to All Pages</li>
                <li>Save and publish</li>
              </ol>
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{gtmSnippet}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(gtmSnippet, 'gtm')}
              >
                {copied === 'gtm' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Add this snippet before the closing <code>&lt;/head&gt;</code> tag:
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{htmlSnippet}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(htmlSnippet, 'html')}
              >
                {copied === 'html' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              After the script loads, use <code>window._ei_track()</code> to send custom events:
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{manualTrackingExample}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(manualTrackingExample, 'manual')}
              >
                {copied === 'manual' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Project ID:</strong> {projectId}<br />
            <strong>Write Key:</strong> {writeKey.substring(0, 16)}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

