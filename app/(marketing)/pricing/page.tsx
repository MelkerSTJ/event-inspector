export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl p-10">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="mt-3 text-muted-foreground">
        Simple plans for e-commerce teams.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Starter</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One site. Validate tracking fast.
          </p>
          <div className="mt-4 text-3xl font-bold">499 kr/mån</div>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Multiple sites & environments.
          </p>
          <div className="mt-4 text-3xl font-bold">999 kr/mån</div>
        </div>
      </div>
    </main>
  );
}
