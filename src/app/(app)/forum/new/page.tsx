import { requireApproved } from "@/lib/auth";
import NewPostForm from "@/components/NewPostForm";

export default async function NewPostPage() {
  const { userId } = await requireApproved();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Share a question or update with the network.
      </p>
      <NewPostForm authorId={userId} />
    </div>
  );
}
