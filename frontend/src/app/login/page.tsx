import type { Metadata } from "next";
import { LoginPage } from "@/features/login";
import type { AuthFailKind } from "@/features/login";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ · AIVA Portal",
};

const ERRORS: AuthFailKind[] = ["cred", "noaccess", "timeout"];

type SearchParams = { next?: string; error?: string };

/** /login?next=/queue&error=noaccess  (Next 14: searchParams เป็น object · Next 15+: เป็น Promise — await ใช้ได้ทั้งสองแบบ) */
export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = (await searchParams) ?? {};
  const error = ERRORS.find((e) => e === sp.error) ?? null;
  return <LoginPage redirectTo={sp.next} initialError={error} />;
}
