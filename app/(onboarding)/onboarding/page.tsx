"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type Game } from "@/lib/mock-data";
import { Logo } from "@/components/ui/Logo";
import { OnboardingProgressDots } from "./OnboardingProgressDots";
import { StepWelcome } from "./StepWelcome";
import { StepUsername } from "./StepUsername";
import { StepBio } from "./StepBio";
import { StepAvatar } from "./StepAvatar";
import { StepGames } from "./StepGames";
import { useOnboardingSubmit } from "./useOnboardingSubmit";

const TOTAL_STEPS = 5;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { data: session, status } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.needsProfileSetup) {
      router.replace("/users/me");
    }
  }, [status, session, router]);

  // アンマウント時に Object URL を解放
  useEffect(() => {
    const ref = avatarPreviewUrlRef;
    return () => {
      if (ref.current) URL.revokeObjectURL(ref.current);
    };
  }, []);

  const handleAvatarFileChange = (file: File) => {
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
    const url = URL.createObjectURL(file);
    avatarPreviewUrlRef.current = url;
    setAvatarPreview(url);
    setAvatarFile(file);
  };

  const { handleSubmit, saving } = useOnboardingSubmit({
    avatarFile,
    username,
    bio,
    selectedGames,
    callbackUrl,
  });

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-10"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo height={64} />
        </div>
        <OnboardingProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        {currentStep === 1 && <StepWelcome onNext={() => setCurrentStep(2)} />}
        {currentStep === 2 && (
          <StepUsername
            username={username}
            onUsernameChange={setUsername}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepBio
            bio={bio}
            onBioChange={setBio}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <StepAvatar
            username={username}
            avatarPreview={avatarPreview}
            onFileChange={handleAvatarFileChange}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <StepGames
            selectedGames={selectedGames}
            onGamesChange={setSelectedGames}
            onBack={() => setCurrentStep(4)}
            onSubmit={() => void handleSubmit()}
            saving={saving}
            status={status}
          />
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
