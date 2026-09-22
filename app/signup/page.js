import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Create Your Seller Account — TireTrader",
  description:
    "Sign up to buy and sell tires on TireTrader. List unlimited tire sets, message buyers directly, and track your sales — free to list during launch.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Create Your Seller Account — TireTrader",
    description:
      "Sign up to buy and sell tires locally. Free to list during launch.",
    url: "/signup",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
