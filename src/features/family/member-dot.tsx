import type { FamilyMember, MemberColor } from "@/domain/types"
import { cn } from "@/lib/utils"

// Täydet luokkanimet, jotta Tailwind löytää ne lähdekoodista.
export const MEMBER_DOT_CLASS: Record<MemberColor, string> = {
  sage: "bg-member-sage",
  clay: "bg-member-clay",
  slate: "bg-member-slate",
  ochre: "bg-member-ochre",
}

export function MemberDot({
  member,
  className,
}: {
  member: FamilyMember
  className?: string
}) {
  return (
    <span
      aria-hidden
      title={member.displayName}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        MEMBER_DOT_CLASS[member.color],
        className,
      )}
    />
  )
}

/** Tapahtuman henkilöt pisteinä; koko perheen tapahtuma näytetään renkaana. */
export function MemberDots({ members }: { members: FamilyMember[] }) {
  if (members.length === 0) {
    return (
      <span
        aria-hidden
        title="Koko perhe"
        className="inline-block size-2 shrink-0 rounded-full border border-foreground/40"
      />
    )
  }
  return (
    <span className="flex shrink-0 gap-1" aria-hidden>
      {members.map((m) => (
        <MemberDot key={m.id} member={m} />
      ))}
    </span>
  )
}
