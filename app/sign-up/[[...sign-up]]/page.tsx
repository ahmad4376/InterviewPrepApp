// import { SignUp } from "@clerk/nextjs";
// import Link from "next/link";

// export default function SignUpPage() {
//   return (
//     <div className="min-h-screen bg-[#0b0b0b] relative overflow-hidden">
//       {/* Gradient Background */}
//       <div
//         className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
//         aria-hidden="true"
//       >
//         <div
//           className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-[#3ecf8e] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
//           style={{
//             clipPath:
//               "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
//           }}
//         />
//       </div>

//       {/* Header */}
//       <div className="relative z-10">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//           <Link href="/" className="flex items-center gap-2">
//             <span className="text-2xl font-bold text-[#3ecf8e]">InterviewPrepApp</span>
//           </Link>
//         </div>
//       </div>

//       {/* Sign Up Form */}
//       <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//         <div className="w-full max-w-md">
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-bold text-white mb-2">Get started</h2>
//             <p className="text-gray-400">Create your account to start practicing interviews</p>
//           </div>

//           <SignUp
//             appearance={{
//               elements: {
//                 rootBox: "w-full",
//                 card: "bg-[#0e0e0e] border border-white/10 shadow-2xl rounded-lg",
//                 headerTitle: "text-white",
//                 headerSubtitle: "text-gray-400",
//                 socialButtonsBlockButton:
//                   "bg-[#1a1a1a] border border-white/10 text-white hover:bg-[#252525]",
//                 socialButtonsBlockButtonText: "text-white font-medium",
//                 formButtonPrimary: "bg-[#3ecf8e] hover:bg-[#36be81] text-black font-semibold",
//                 formFieldInput: "bg-[#1a1a1a] border border-white/10 text-white",
//                 formFieldLabel: "text-gray-300",
//                 footerActionLink: "text-[#3ecf8e] hover:text-[#36be81]",
//                 identityPreviewText: "text-white",
//                 identityPreviewEditButton: "text-[#3ecf8e]",
//                 formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
//                 otpCodeFieldInput: "bg-[#1a1a1a] border border-white/10 text-white",
//               },
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Building2, User } from "lucide-react";

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<"user" | "business" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleContinue = () => {
    if (!accountType) return;
    // Store so webhook/callback can read it
    localStorage.setItem("pendingAccountType", accountType);
    setConfirmed(true);
  };

  const background = (
    <>
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-[#3ecf8e] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#3ecf8e]">InterviewPrepApp</span>
          </Link>
        </div>
      </div>
    </>
  );

  // Step 1: Account type selection
  if (!confirmed) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] relative overflow-hidden">
        {background}
        <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Get started</h2>
              <p className="text-gray-400">Choose the type of account you want to create</p>
            </div>

            <div className="bg-[#0e0e0e] border border-white/10 shadow-2xl rounded-lg p-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Candidate */}
                <button
                  onClick={() => setAccountType("user")}
                  className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all ${
                    accountType === "user"
                      ? "border-[#3ecf8e] bg-[#3ecf8e]/10"
                      : "border-white/10 hover:border-white/25 bg-white/5"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    accountType === "user" ? "bg-[#3ecf8e]/20" : "bg-white/5"
                  }`}>
                    <User className={`w-6 h-6 ${accountType === "user" ? "text-[#3ecf8e]" : "text-gray-400"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${accountType === "user" ? "text-white" : "text-gray-300"}`}>
                      Candidate
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Practice interviews &amp; improve skills</p>
                  </div>
                </button>

                {/* Business */}
                <button
                  onClick={() => setAccountType("business")}
                  className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all ${
                    accountType === "business"
                      ? "border-[#3ecf8e] bg-[#3ecf8e]/10"
                      : "border-white/10 hover:border-white/25 bg-white/5"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    accountType === "business" ? "bg-[#3ecf8e]/20" : "bg-white/5"
                  }`}>
                    <Building2 className={`w-6 h-6 ${accountType === "business" ? "text-[#3ecf8e]" : "text-gray-400"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${accountType === "business" ? "text-white" : "text-gray-300"}`}>
                      Business
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Create interviews &amp; evaluate candidates</p>
                  </div>
                </button>
              </div>

              <button
                onClick={handleContinue}
                disabled={!accountType}
                className="w-full bg-[#3ecf8e] hover:bg-[#36be81] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg text-sm transition"
              >
                Continue
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-[#3ecf8e] hover:text-[#36be81]">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Clerk SignUp form
  return (
    <div className="min-h-screen bg-[#0b0b0b] relative overflow-hidden">
      {background}
      <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {accountType === "business" ? "Create business account" : "Create your account"}
            </h2>
            <p className="text-gray-400">
              {accountType === "business"
                ? "Set up your business to start evaluating candidates"
                : "Start practicing interviews today"}
            </p>
            <button
              onClick={() => setConfirmed(false)}
              className="text-xs text-gray-500 hover:text-gray-300 mt-1 underline"
            >
              ← Change account type
            </button>
          </div>

          <SignUp
            forceRedirectUrl="/post-signup" // Added
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-[#0e0e0e] border border-white/10 shadow-2xl rounded-lg",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-[#1a1a1a] border border-white/10 text-white hover:bg-[#252525]",
                socialButtonsBlockButtonText: "text-white font-medium",
                formButtonPrimary: "bg-[#3ecf8e] hover:bg-[#36be81] text-black font-semibold",
                formFieldInput: "bg-[#1a1a1a] border border-white/10 text-white",
                formFieldLabel: "text-gray-300",
                footerActionLink: "text-[#3ecf8e] hover:text-[#36be81]",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-[#3ecf8e]",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                otpCodeFieldInput: "bg-[#1a1a1a] border border-white/10 text-white",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}