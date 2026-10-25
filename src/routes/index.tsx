import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/Brand";
import { Landing } from "@/components/landing/Landing";

export const Route = createFileRoute("/")({
  head: () => ({ meta: meta("CoHost — campus club collaboration", "One club's idea. A whole campus behind it. Co-host events across clubs with versioned agreements and volunteer crews.") }),
  component: Landing,
});
