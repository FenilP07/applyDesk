import useAuthStore from "../store/authStore";

export default function HomePage() {
  const { user, logout, loading } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-neutral-200" />
            )}

            <div>
              <div className="font-semibold text-neutral-900">{user?.name}</div>
              <div className="text-sm text-neutral-600">
                {user?.email} • {user?.role}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900">You’re in ✅</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Next: wire this into your app routes (auction dashboard, sessions,
            etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
