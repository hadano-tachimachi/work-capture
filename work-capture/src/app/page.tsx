import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isMobileUserAgent } from "@/lib/utils/capture-helpers";

export default async function HomePage() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  redirect(isMobileUserAgent(userAgent) ? "/capture" : "/inbox");
}
