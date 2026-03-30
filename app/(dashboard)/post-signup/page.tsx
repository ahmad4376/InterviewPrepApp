"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function PostSignupPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }

    const accountType = localStorage.getItem("pendingAccountType") ?? "user";

    fetch("/api/user/save-account-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountType }),
    }).finally(() => {
      localStorage.removeItem("pendingAccountType");
      router.replace("/dashboard");
    });
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Setting up your account...</p>
    </div>
  );
}