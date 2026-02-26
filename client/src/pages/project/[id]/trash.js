import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyProjectTrashRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    router.replace(`/trash?projectId=${id}`);
  }, [router, id]);

  return null;
}
