import { Suspense } from "react";
import ResetForm from "@/components/ResetForm";

export const metadata = { title: "Set a new password — TireKind", robots: { index: false } };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
