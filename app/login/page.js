import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  robots: { index: false },
  title: "Log in — TireKind",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
