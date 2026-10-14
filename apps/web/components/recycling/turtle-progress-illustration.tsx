"use client"

import { InfoIcon } from "lucide-react"
import { useId } from "react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

function TurtleIllustration({ percent }: { percent: number }) {
  const illustrationId = useId()
  const shellClipId = `${illustrationId}-shell`
  const shellGradientId = `${illustrationId}-green`
  const translateY = ((100 - percent) / 100) * 104

  return (
    <svg
      viewBox="0 0 240 180"
      className="w-full"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <clipPath id={shellClipId}>
          <ellipse cx="108" cy="88" rx="62" ry="52" />
        </clipPath>
        <linearGradient id={shellGradientId} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#69BD81" />
          <stop offset="1" stopColor="#2F8F5B" />
        </linearGradient>
      </defs>

      {/* A soft wake gives the swimming silhouette a little depth. */}
      <ellipse cx="119" cy="151" rx="75" ry="8" fill="#0F3B45" opacity=".07" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity=".7">
        <circle cx="210" cy="34" r="6" />
        <circle cx="225" cy="48" r="3" />
        <path d="M22 83h12M16 96h14" strokeLinecap="round" />
      </g>

      <g stroke="#214E43" strokeWidth="3" strokeLinejoin="round">
        {/* Front flippers sweep forward; the smaller rear pair trails behind. */}
        <path
          d="M133 49C141 27 160 17 180 22C182 35 167 55 152 64Z"
          fill="#8DCFA0"
        />
        <path
          d="M135 122C147 139 167 158 182 153C184 137 168 116 153 110Z"
          fill="#8DCFA0"
        />
        <path d="M69 51C55 34 38 32 29 39C31 53 43 64 59 68Z" fill="#A4DAB1" />
        <path
          d="M66 119C53 135 36 142 27 135C30 120 42 110 56 108Z"
          fill="#A4DAB1"
        />
        <path d="M49 81L31 89L50 96" fill="#8DCFA0" />

        {/* The neck joins a rounded head, with a small lifted snout. */}
        <path
          d="M160 69C171 69 177 56 192 56C209 55 218 65 219 77C227 80 226 91 218 97C206 107 186 105 176 97L161 101Z"
          fill="#A4DAB1"
        />
        <path
          d="M181 94C192 101 205 101 214 96"
          fill="none"
          stroke="#78B98D"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <ellipse cx="108" cy="90" rx="68" ry="58" fill="#8DCFA0" />
        <ellipse
          cx="108"
          cy="88"
          rx="62"
          ry="52"
          fill="#EDF6DD"
          stroke="none"
        />
      </g>

      <g clipPath={`url(#${shellClipId})`}>
        <rect
          x="46"
          y="36"
          width="124"
          height="104"
          fill={`url(#${shellGradientId})`}
          style={{ transform: `translateY(${translateY}px)` }}
          className="duration-700 ease-out motion-safe:transition-transform"
        />
        {/* Broad, irregular scutes stay legible at the card's small size. */}
        <g
          fill="none"
          stroke="#285B43"
          strokeOpacity=".5"
          strokeWidth="2.5"
          strokeLinejoin="round"
        >
          <path d="M88 63L120 60L139 84L125 111L92 116L75 90Z" />
          <path d="M88 63L75 42M120 60L134 40M139 84L169 78M125 111L142 132M92 116L83 139M75 90L47 94" />
        </g>
        <path
          d="M62 70C68 53 85 44 103 44"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity=".55"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse
          cx="112"
          cy="137"
          rx="51"
          ry="9"
          fill="#214E43"
          opacity=".08"
        />
      </g>
      <ellipse
        cx="108"
        cy="88"
        rx="62"
        ry="52"
        fill="none"
        stroke="#214E43"
        strokeWidth="3"
      />

      <ellipse cx="201" cy="76" rx="4.5" ry="5.5" fill="#173E35" />
      <circle cx="202.5" cy="74" r="1.5" fill="#FFFFFF" />
      <ellipse cx="193" cy="87" rx="6" ry="3.5" fill="#EBAA91" opacity=".8" />
      <path
        d="M205 90C209 93 214 92 217 89"
        fill="none"
        stroke="#214E43"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g fill="#609E73" opacity=".65">
        <circle cx="184" cy="72" r="2" />
        <circle cx="189" cy="67" r="1.5" />
        <circle cx="181" cy="79" r="1.5" />
      </g>
    </svg>
  )
}

export function TurtleProgressIllustration({
  percent,
  hasCampaign,
}: {
  percent: number
  hasCampaign: boolean
}) {
  return (
    <div className="mx-auto w-full max-w-[190px]">
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={200}
          closeDelay={150}
          aria-label="How the turtle shows recycling progress"
          className="relative block w-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bb-focus-ring)"
        >
          <TurtleIllustration percent={percent} />
          <span
            aria-hidden="true"
            className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full bg-white/80 text-ink"
          >
            <InfoIcon className="size-4" strokeWidth={1.8} />
          </span>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={8}
          className="w-64 max-w-[calc(100vw-2rem)] p-4"
        >
          <PopoverHeader>
            <PopoverTitle>A greener shell, together</PopoverTitle>
            <PopoverDescription>
              {hasCampaign
                ? "The turtle’s shell fills with green as our township’s recycling estimates grow. At 100% of the goal, the shell is fully green!"
                : "When a township recycling goal is set, the turtle’s shell will fill with green as we make progress. Reach 100% to turn it fully green!"}
            </PopoverDescription>
          </PopoverHeader>
          <figure className="flex flex-col items-center rounded-xl bg-sky p-2 text-ink">
            <div className="w-32">
              <TurtleIllustration percent={100} />
            </div>
            <figcaption className="pb-1 text-xs font-semibold">
              100% · Goal reached
            </figcaption>
          </figure>
        </PopoverContent>
      </Popover>
    </div>
  )
}
