import { signIn } from "@/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF1EC] px-4">
      <div className="w-full max-w-sm border border-[#D8DDD4] bg-white p-8 text-center">
        <h1 className="font-serif text-2xl text-[#16241F]">Sambungla</h1>
        <p className="mt-2 text-sm text-[#16241F]/65">
          Sign in with LinkedIn to generate and publish your posts.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("linkedin", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="mt-8 w-full bg-[#16241F] px-6 py-3 text-sm font-medium text-white"
          >
            Continue with LinkedIn
          </button>
        </form>

        <p className="mt-4 text-xs text-[#16241F]/45">
          We request permission to post on your behalf so scheduled posts can
          publish automatically. You stay in control of what's generated.
        </p>
      </div>
    </div>
  );
}
