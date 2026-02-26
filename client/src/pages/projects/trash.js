import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyProjectsTrashRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trash");
  }, [router]);

  return null;
}
