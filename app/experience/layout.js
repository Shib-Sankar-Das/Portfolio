import { ExperienceTransition } from "@/components/experience/transition-context";

/**
 * Wraps the wall and every role page. Its only job is to hold the handover
 * between them: because this layout is not re-mounted when you navigate from
 * one to the other, the badge's starting position survives the route change,
 * and the detail page can carry on the movement the click began.
 */
export default function ExperienceLayout({ children }) {
  return <ExperienceTransition>{children}</ExperienceTransition>;
}
