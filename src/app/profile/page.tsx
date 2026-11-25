import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const SLOTS = [
  ["front", "Front"],
  ["back", "Back"],
  ["left", "Left side"],
  ["right", "Right side"],
] as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/profile");

  const [record] = await db.get(db.key(["AvatarPhotos", user.id]));
  const photos: Record<string, string> = record?.photos ?? {};
  const hasPhotos = SLOTS.some(([slot]) => photos[slot]);
  const updatedAt: Date | undefined = record?.updatedAt;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <Link href="/" className="mb-8 inline-flex items-center text-sm text-mute transition-colors hover:text-ink">
          ← Back to home
        </Link>
        <h1 className="mb-3 font-serif text-4xl text-ink">Your profile</h1>

        <div className="mb-10 rounded-2xl border border-line bg-card p-8">
          <div className="flex justify-between border-b border-line py-3">
            <span className="text-mute">Name</span>
            <span className="font-medium text-ink">{user.name}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-mute">Email</span>
            <span className="font-medium text-ink">{user.email}</span>
          </div>
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">Your avatar photos</h2>
            {updatedAt && (
              <p className="mt-1 text-sm text-mute">
                Last updated {updatedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                {record?.status !== "uploaded" && " · upload incomplete"}
              </p>
            )}
          </div>
          <Link
            href="/create-avatar"
            className="rounded-full border border-ink px-5 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-bg"
          >
            {hasPhotos ? "Replace photos" : "Upload photos"}
          </Link>
        </div>

        {hasPhotos ? (
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {SLOTS.map(([slot, label]) => (
              <li key={slot}>
                <div className="aspect-[3/4] overflow-hidden rounded-xl border border-line bg-card">
                  {photos[slot] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/avatar-photos/${slot}?v=${updatedAt?.getTime() ?? 0}`}
                      alt={`${label} view`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-mute">Missing</div>
                  )}
                </div>
                <p className="mt-2 text-sm text-mute">{label}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-card p-8 text-mute">
            You haven&apos;t uploaded any photos yet.
          </p>
        )}
      </div>
    </div>
  );
}
