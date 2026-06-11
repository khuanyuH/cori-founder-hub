import { requireApproved } from "@/lib/auth";
import ImportClient from "@/components/ImportClient";

export default async function ImportPage() {
  await requireApproved();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Import your LinkedIn connections
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Your connections join the shared, pooled network so members can find warm
        introductions. We store names, companies, and titles only — never email
        or phone. Raw contact details are never shown to anyone; an introduction
        is the only path.
      </p>
      <ImportClient />
    </div>
  );
}
