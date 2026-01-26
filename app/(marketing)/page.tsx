export default function MarketingHome() {
  return (
    <main className="mx-auto max-w-4xl p-10">
      <h1 className="text-4xl font-bold tracking-tight">Event Inspector</h1>
      <p className="mt-3 text-muted-foreground">
        See what actually happens when users click. Validate tracking in real time.
      </p>

      <div className="mt-8 flex gap-3">
        <a
          href="/dashboard"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Open dashboard
        </a>
        <a
          href="/pricing"
          className="rounded-md border px-4 py-2"
        >
          Pricing
        </a>
      </div>
    </main>
  );
}
