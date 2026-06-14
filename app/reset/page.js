import { Suspense } from "react";
import ResetForm from "@/components/ResetForm";

export const metadata = { title: "Set a new password — TireTrader" };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
