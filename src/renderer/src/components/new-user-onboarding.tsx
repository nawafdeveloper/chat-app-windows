import { useState } from "react";
import CompleteProfile from "../components/complete-profile";
import NewPinCode from "../components/new-pin-code";

type OnboardingStep = "pin" | "profile";

export default function NewUserOnboarding() {
    const [step, setStep] = useState<OnboardingStep>("pin");

    if (step === "profile") {
        return <CompleteProfile completeNewUserOnSave />;
    }

    return <NewPinCode onComplete={() => setStep("profile")} />;
}
