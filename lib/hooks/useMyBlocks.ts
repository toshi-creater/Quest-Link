import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchMyBlocks } from "@/lib/api/users";

export function useMyBlocks(): Set<string> {
  const { status } = useSession();
  const { data } = useQuery({
    queryKey: ["my-blocks"],
    queryFn: fetchMyBlocks,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });
  return new Set(data?.data.map((b) => b.blockedId) ?? []);
}
