import { requireApproved } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const { profile } = await requireApproved();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Keep this current so members know how to help you.
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
