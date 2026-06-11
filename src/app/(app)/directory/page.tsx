import { requireApproved } from "@/lib/auth";
import DirectoryClient from "@/components/DirectoryClient";

export default async function DirectoryPage() {
  const { userId } = await requireApproved();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Warm-intro directory
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Search the pooled network for someone you&apos;d like to meet, then ask a
        member who knows them to make the introduction.
      </p>
      <DirectoryClient currentUserId={userId} />
    </div>
  );
}
