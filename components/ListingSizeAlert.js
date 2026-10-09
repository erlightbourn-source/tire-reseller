import EmailAlertForm from "@/components/EmailAlertForm";
import { canonicalSizeLabel } from "@/lib/tiresize";

// Logged-out buyers: a no-account way to hear about more of this size.
// Renders nothing when the listing's size string can't be parsed.
export default function ListingSizeAlert({ size }) {
  const label = canonicalSizeLabel(size);
  if (!label) return null;
  return (
    <div className="card p-5" data-testid="listing-size-alert">
      <p className="text-sm font-semibold text-slate-200">Get an alert when more {label} tires are listed</p>
      <div className="mt-2"><EmailAlertForm query={`size=${label}`} compact /></div>
    </div>
  );
}
