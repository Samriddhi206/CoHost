export function Brand({ small }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid place-items-center rounded-xl bg-primary font-display font-extrabold text-primary-foreground ${small ? "h-8 w-8 text-sm" : "h-10 w-10"}`}>co</span>
      <span className="font-display text-lg font-bold">CoHost</span>
    </span>
  );
}
export const meta = (title: string, description: string) => [
  { title },
  { name: "description", content: description },
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
];
