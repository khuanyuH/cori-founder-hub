import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

// Shown to pending users. They can edit their profile but see nothing else.
export default async function PendingPage() {
  const { profile } = await requireUser();
  if (profile.status === "approved") redirect("/");

  return (
    <div className="max-w-2xl">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-lg font-semibold text-amber-900">
          Your account is awaiting approval
        </h1>
        <p className="mt-1 text-sm text-amber-800">
          A CORI admin will review your account shortly. Once approved you&apos;ll
          get access to the forum and the warm-intro directory. In the meantime,
          fill out your profile so members know how to help you.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-medium text-slate-900">Your profile</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          Tell the network who you are and what you&apos;re working on.
        </p>
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
