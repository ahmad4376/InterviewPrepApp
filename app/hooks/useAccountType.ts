import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export function useAccountType() {
  const { isSignedIn } = useAuth();
  const [accountType, setAccountType] = useState<"user" | "business" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }
    fetch("/api/user/account-type")
      .then((r) => r.json())
      .then((d) => setAccountType(d.accountType ?? "user"))
      .catch(() => setAccountType("user"))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  return { accountType, loading, isBusiness: accountType === "business" };
}