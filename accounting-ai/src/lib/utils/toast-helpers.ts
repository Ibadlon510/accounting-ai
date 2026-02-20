import { toast } from "sonner";

export function comingSoon(feature?: string) {
  toast.info(feature ? `${feature} — Coming Soon` : "Coming Soon", {
    description: "This feature is under development and will be available shortly.",
    duration: 3000,
  });
}

export function showSuccess(message: string, description?: string) {
  toast.success(message, { description, duration: 3000 });
}

export function showError(message: string, description?: string) {
  toast.error(message, { description, duration: 4000 });
}
