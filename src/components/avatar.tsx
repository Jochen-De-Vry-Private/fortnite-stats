import clsx from "clsx";

const SIZES = {
  sm: "size-9 text-base",
  md: "size-12 text-xl",
  lg: "size-20 text-4xl",
  xl: "size-24 text-5xl sm:size-28 sm:text-6xl",
};

export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={clsx(
        "font-display grid shrink-0 place-items-center rounded-2xl text-white text-stroke ring-2 ring-white/15",
        SIZES[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 90% 60%), hsl(${(hue + 60) % 360} 85% 42%))`,
      }}
    >
      <span className="translate-y-[6%]">{name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
