import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

type LogoProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Logo({ className, onNavigate }: LogoProps) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label="PartsHub — на главную"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-white">
        <Icon name="wrench" className="size-4" strokeWidth={2} />
      </span>
      <span className="text-lg font-extrabold leading-none tracking-tight text-ink">
        PartsHub
      </span>
    </Link>
  );
}
