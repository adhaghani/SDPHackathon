export type BriefVisual =
  | "garden"
  | "scenarios"
  | "pillars"
  | "recap"
  | "washer"
  | "chair"
  | "flow-washer"
  | "flow-chair"
  | "aim"
  | "handover"
  | "materials"
  | "entry"
  | "estimate"
  | "equivalents"
  | "honesty"
  | "goal"
  | "recognition"
  | "pilot"
  | "measures"
  | "learning"
  | "closing"
export type BriefBeat = {
  speech: string
  title: string
  body: string
  focus: number
}
export type BriefScene = {
  id: string
  member: number
  chapter: string
  tone: "paper" | "ink" | "sky" | "mustard" | "lime"
  visual: BriefVisual
  beats: BriefBeat[]
  route?: string
  items?: string[]
  note: string
}

export const scenes: BriefScene[] = [
  {
    id: "planet",
    member: 1,
    chapter: "The planet",
    tone: "paper",
    visual: "garden",
    beats: [
      {
        speech: "",
        title: "A greener township\nstarts with us.",
        body: "Everyday choices. Shared locally.",
        focus: 0,
      },
    ],
    note: "Hold briefly before speech. Press Right as Member 1 starts “A pressure washer used once.”",
  },
  {
    id: "everyday",
    member: 1,
    chapter: "Three everyday situations",
    tone: "paper",
    visual: "scenarios",
    beats: [
      {
        speech: "A pressure washer used once.",
        title: "Three everyday situations.",
        body: "A useful tool, needed for a single task.",
        focus: 0,
      },
      {
        speech: "A chair nobody needs anymore.",
        title: "Three everyday situations.",
        body: "Something useful, ready for a new home.",
        focus: 1,
      },
      {
        speech: "Bottles waiting to be sorted.",
        title: "Three everyday situations.",
        body: "Materials with somewhere better to go.",
        focus: 2,
      },
      {
        speech:
          "Three everyday situations. Three opportunities to make a different choice for our planet.",
        title: "Three chances to\nchoose differently.",
        body: "For our planet. Starting close to home.",
        focus: 3,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "three-rs",
    member: 1,
    chapter: "The three Rs",
    tone: "ink",
    visual: "pillars",
    beats: [
      {
        speech: "Reduce what we buy unnecessarily.",
        title: "Reduce.",
        body: "Borrow before buying for an occasional task.",
        focus: 0,
      },
      {
        speech: "Reuse what still has value.",
        title: "Reuse.",
        body: "Pass useful things to someone who needs them.",
        focus: 1,
      },
      {
        speech: "Recycle what can be recovered.",
        title: "Recycle.",
        body: "Sort materials and record contributions.",
        focus: 2,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "meet-borrowlah",
    member: 1,
    chapter: "Meet BorrowLah",
    tone: "paper",
    visual: "recap",
    beats: [
      {
        speech:
          "We built BorrowLah to make these three actions easier to practise with the people living around us.",
        title: "Three choices.\nOne neighbourhood.",
        body: "BorrowLah brings the three Rs close to home.",
        focus: 3,
      },
      {
        speech: "A resident can borrow instead of buying,",
        title: "Borrow instead\nof buying.",
        body: "Use an item that already exists nearby.",
        focus: 0,
      },
      {
        speech: "pass useful things to a neighbour,",
        title: "Pass useful\nthings on.",
        body: "A new home for something you no longer need.",
        focus: 1,
      },
      {
        speech: "and record their recycling contributions.",
        title: "Record your\ncontribution.",
        body: "Make self-reported recycling participation visible.",
        focus: 2,
      },
      {
        speech:
          "Our goal is to help townships use resources more carefully and make the three Rs part of everyday life.",
        title: "Make the three Rs\neveryday choices.",
        body: "A goal to work towards, together.",
        focus: 3,
      },
      {
        speech: "Let us show you how each R works in BorrowLah.",
        title: "Let’s see\nthe three Rs.",
        body: "Reduce → Reuse → Recycle",
        focus: 3,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "reduce",
    member: 2,
    chapter: "Reduce",
    tone: "sky",
    visual: "washer",
    beats: [
      {
        speech: "First, Reduce.",
        title: "Need it once?\nBorrow it.",
        body: "Reduce unnecessary purchases.",
        focus: 0,
      },
      {
        speech:
          "Before buying something for a single task, we can ask: could I borrow it nearby?",
        title: "Could I borrow\nit nearby?",
        body: "An afternoon’s task. A neighbour’s useful tool.",
        focus: 1,
      },
    ],
    route: "/borrow",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "find-request",
    member: 2,
    chapter: "Find, check, request",
    tone: "paper",
    visual: "flow-washer",
    beats: [
      {
        speech: "In BorrowLah, a resident finds a pressure washer,",
        title: "Find the right tool.",
        body: "Start with an existing item in the neighbourhood.",
        focus: 0,
      },
      {
        speech: "checks its availability,",
        title: "Check availability.",
        body: "Choose around the item’s other bookings.",
        focus: 1,
      },
      {
        speech: "selects dates and sends a request.",
        title: "Choose dates.\nSend a request.",
        body: "The owner reviews the request next.",
        focus: 2,
      },
    ],
    route: "/borrow",
    items: [
      "Find a pressure washer",
      "Check availability",
      "Select dates & request",
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "borrow-loop",
    member: 2,
    chapter: "Approve, use, return",
    tone: "paper",
    visual: "flow-washer",
    beats: [
      {
        speech: "The owner approves.",
        title: "The owner\napproves.",
        body: "Approval starts the arrangement.",
        focus: 0,
      },
      {
        speech: "At collection, both neighbours confirm handover.",
        title: "Both confirm\ncollection.",
        body: "A shared record of the handover.",
        focus: 1,
      },
      {
        speech: "After use, the borrower marks it returned,",
        title: "Use it.\nMark it returned.",
        body: "The owner still needs to confirm.",
        focus: 2,
      },
      {
        speech: "and the owner confirms its condition and return.",
        title: "The owner\nconfirms return.",
        body: "Record the condition and confirm the return.",
        focus: 3,
      },
      {
        speech:
          "That completes the loan and makes the item available to share again, subject to its other bookings.",
        title: "Ready to\nshare again.",
        body: "Loan completed. Other bookings still apply.",
        focus: 4,
      },
    ],
    route: "/borrow/mine",
    items: [
      "Owner approves",
      "Both confirm collection",
      "Borrower marks returned",
      "Owner confirms condition & return",
      "Loan completed",
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "borrow-purpose",
    member: 2,
    chapter: "Why borrowing matters",
    tone: "sky",
    visual: "aim",
    beats: [
      {
        speech:
          "This gives residents a practical alternative to owning an item they only need occasionally.",
        title: "Access for a task.",
        body: "An alternative to owning an occasional-use item.",
        focus: 0,
      },
      {
        speech:
          "The environmental aim is to avoid unnecessary purchases by making better use of what already exists.",
        title: "Use what\nalready exists.",
        body: "Aim: avoid unnecessary purchases through sharing.",
        focus: 1,
      },
      {
        speech:
          "Whether residents actually replace a purchase is something we must assess in a pilot.",
        title: "Did borrowing\nreplace a purchase?",
        body: "A question for the proposed pilot, not a proven outcome.",
        focus: 2,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "reuse",
    member: 3,
    chapter: "Reuse",
    tone: "mustard",
    visual: "chair",
    beats: [
      {
        speech: "Second, Reuse.",
        title: "Done with it?\nPass it on.",
        body: "Useful things deserve another use.",
        focus: 0,
      },
      {
        speech:
          "An item can stop being useful to one household while still being useful to another.",
        title: "Same things.\nA different need.",
        body: "Things you no longer need could be useful to a neighbour.",
        focus: 1,
      },
    ],
    route: "/giveaway",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "giveaway-listing",
    member: 3,
    chapter: "Create a giveaway",
    tone: "paper",
    visual: "flow-chair",
    beats: [
      {
        speech: "In Giveaway, a resident lists an item,",
        title: "Give it\na visible listing.",
        body: "Help neighbours discover something useful.",
        focus: 0,
      },
      {
        speech: "describes its condition",
        title: "Describe its\ncondition.",
        body: "Make the item’s condition clear.",
        focus: 1,
      },
      {
        speech: "and chooses a shared handover location.",
        title: "Meet in\na shared place.",
        body: "Choose a shared location for handover.",
        focus: 2,
      },
    ],
    route: "/giveaway/new",
    items: [
      "List the item",
      "Describe its condition",
      "Choose a shared location",
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "giveaway-claim",
    member: 3,
    chapter: "A neighbour claims it",
    tone: "mustard",
    visual: "flow-chair",
    beats: [
      {
        speech: "A neighbour selects Ask to take this.",
        title: "“Ask to take this.”",
        body: "A neighbour finds something they can use.",
        focus: 0,
      },
      {
        speech: "The item becomes reserved,",
        title: "Reserved for\nits next owner.",
        body: "The handover comes next.",
        focus: 1,
      },
    ],
    route: "/giveaway",
    items: ["Neighbour asks to take it", "Item reserved"],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "second-home",
    member: 3,
    chapter: "Both confirm handover",
    tone: "paper",
    visual: "handover",
    beats: [
      {
        speech: "and both people confirm when the handover happens.",
        title: "Two people.\nA shared handover.",
        body: "Giver and recipient each confirm.",
        focus: 0,
      },
      {
        speech: "Only after both confirmations is the giveaway completed.",
        title: "Both confirmed.\nGiveaway completed.",
        body: "The items move to their next owner.",
        focus: 2,
      },
      {
        speech:
          "This is different from borrowing: the item moves to a new owner, with no return expected.",
        title: "A new owner.\nNo return expected.",
        body: "A permanent transfer of a useful item.",
        focus: 3,
      },
    ],
    route: "/giveaway/mine",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "reuse-purpose",
    member: 3,
    chapter: "Keep useful things in use",
    tone: "paper",
    visual: "flow-chair",
    beats: [
      {
        speech:
          "The aim is to keep useful things in use before they become waste.",
        title: "Keep useful\nthings in use.",
        body: "Give that next use a place to begin.",
        focus: -1,
      },
      {
        speech:
          "BorrowLah gives that next use a place to begin: a visible listing,",
        title: "A visible listing.",
        body: "Make something useful discoverable.",
        focus: 0,
      },
      {
        speech: "a neighbour who wants it,",
        title: "Someone who\ncan use it.",
        body: "Connect the item with its next owner.",
        focus: 1,
      },
      {
        speech: "and a confirmed handover.",
        title: "A confirmed\nnew beginning.",
        body: "The next use starts with a completed handover.",
        focus: 2,
      },
    ],
    items: [
      "A visible listing",
      "A neighbour who wants it",
      "A confirmed handover",
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "recycle",
    member: 4,
    chapter: "Recycle",
    tone: "lime",
    visual: "materials",
    beats: [
      {
        speech: "Third, Recycle.",
        title: "Sort it.\nLog it.\nKeep going.",
        body: "Paper, plastic, metal and glass.",
        focus: 0,
      },
      {
        speech:
          "After sorting and taking materials for recycling, residents can record what they contributed.",
        title: "Recycle first.\nThen record it.",
        body: "The log records a physical contribution.",
        focus: 1,
      },
    ],
    route: "/recycling",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "recycling-entry",
    member: 4,
    chapter: "Two ways to record",
    tone: "paper",
    visual: "entry",
    beats: [
      {
        speech: "In the recycling log, they can count common items",
        title: "Count common\nitems.",
        body: "Choose from the units available for each material.",
        focus: 0,
      },
      {
        speech: "or enter an estimated weight by material.",
        title: "Or enter\nestimated kg.",
        body: "Custom weight is an alternative to item counts.",
        focus: 1,
      },
    ],
    route: "/recycling",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "estimates",
    member: 4,
    chapter: "From counts to estimates",
    tone: "paper",
    visual: "estimate",
    beats: [
      {
        speech: "BorrowLah converts counts into estimated kilograms",
        title: "Counts become\nestimated kg.",
        body: "Item count × weight per unit.",
        focus: 0,
      },
      {
        speech: "and shows a material breakdown.",
        title: "See it\nby material.",
        body: "A breakdown of the recorded contributions.",
        focus: 1,
      },
    ],
    route: "/recycling",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "equivalents",
    member: 4,
    chapter: "Documented factors",
    tone: "ink",
    visual: "equivalents",
    beats: [
      {
        speech:
          "Where supported by documented factors, it also shows estimated carbon and energy equivalents.",
        title: "Estimates need\na documented basis.",
        body: "Carbon and energy equivalents appear only where supported.",
        focus: 0,
      },
    ],
    route: "/recycling",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "honest-estimates",
    member: 4,
    chapter: "What the log tells us",
    tone: "paper",
    visual: "honesty",
    beats: [
      {
        speech:
          "These are self-reported estimates, not independently measured collection weights.",
        title: "Self-reported.\nEstimated.",
        body: "These are not independently measured collection weights.",
        focus: 0,
      },
      {
        speech: "Logging an entry does not itself recycle the material.",
        title: "A log records\nthe action.",
        body: "The physical recycling happens outside the app.",
        focus: 1,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "together",
    member: 4,
    chapter: "A shared recycling goal",
    tone: "sky",
    visual: "goal",
    beats: [
      {
        speech: "Township teams can also set a shared recycling goal.",
        title: "One township.\nA shared goal.",
        body: "Township teams can set a recycling campaign goal.",
        focus: 0,
      },
      {
        speech:
          "When a campaign is active, residents can see collective progress and how their logs contribute.",
        title: "See how your\ncontribution fits.",
        body: "Collective progress is visible when a campaign is active.",
        focus: 1,
      },
    ],
    route: "/recycling",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "recycling-purpose",
    member: 4,
    chapter: "Keep the three Rs going",
    tone: "lime",
    visual: "recap",
    beats: [
      {
        speech: "The purpose is to make recycling participation visible",
        title: "Make participation\nvisible.",
        body: "A record of residents’ recycling contributions.",
        focus: 2,
      },
      {
        speech: "and encourage people to keep going,",
        title: "Keep going.\nTogether.",
        body: "Encourage continued participation.",
        focus: 3,
      },
      {
        speech: "alongside reducing purchases and reusing useful things.",
        title: "All three Rs\nwork together.",
        body: "Reduce purchases. Reuse useful things. Recycle responsibly.",
        focus: 3,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "recap",
    member: 5,
    chapter: "Three choices together",
    tone: "paper",
    visual: "recap",
    beats: [
      {
        speech:
          "BorrowLah brings these three choices together: borrow before buying,",
        title: "Borrow before\nbuying.",
        body: "Reduce unnecessary purchases.",
        focus: 0,
      },
      {
        speech: "pass things on,",
        title: "Pass things on.",
        body: "Reuse what still has value.",
        focus: 1,
      },
      {
        speech: "and recycle responsibly.",
        title: "Recycle\nresponsibly.",
        body: "Sort materials and record contributions.",
        focus: 2,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "participation",
    member: 5,
    chapter: "BetterPoints",
    tone: "ink",
    visual: "recognition",
    beats: [
      {
        speech:
          "BetterPoints support participation through eligible completed activities",
        title: "Recognise\ncontributions.",
        body: "BetterPoints support eligible completed activities.",
        focus: 0,
      },
      {
        speech: "and recycling campaign goals.",
        title: "Shared goals\ncan support participation.",
        body: "Recycling campaign rules and eligibility apply.",
        focus: 1,
      },
      {
        speech:
          "They recognise contributions; they are not a measure of environmental impact.",
        title: "Recognition\nneeds context.",
        body: "BetterPoints recognise participation, not environmental impact.",
        focus: 2,
      },
    ],
    route: "/rewards",
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "pilot",
    member: 5,
    chapter: "A proposed local pilot",
    tone: "paper",
    visual: "pilot",
    beats: [
      {
        speech:
          "For Sime Darby Property, we propose starting with one township and a small resident pilot across the three Rs.",
        title: "Start with\none township.",
        body: "Proposed: a small resident pilot across all three Rs.",
        focus: 0,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "pilot-measures",
    member: 5,
    chapter: "What we would track",
    tone: "paper",
    visual: "measures",
    beats: [
      {
        speech: "We would track completed loans,",
        title: "Completed loans.",
        body: "Track loans that reach a confirmed return.",
        focus: 0,
      },
      {
        speech: "giveaway handovers,",
        title: "Giveaway\nhandovers.",
        body: "Track transfers confirmed by both people.",
        focus: 1,
      },
      {
        speech: "recycling logs",
        title: "Recycling logs.",
        body: "Keep self-reported contributions clearly labelled.",
        focus: 2,
      },
      {
        speech: "and repeat participation,",
        title: "Repeat\nparticipation.",
        body: "Do residents return to take another action?",
        focus: 3,
      },
      {
        speech: "alongside resident feedback",
        title: "Listen to\nresidents.",
        body: "Understand what works and what needs to improve.",
        focus: 4,
      },
      {
        speech: "and staff effort.",
        title: "Understand\nstaff effort.",
        body: "Consider the work required to run the pilot.",
        focus: 5,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "learn",
    member: 5,
    chapter: "Learn before making claims",
    tone: "sky",
    visual: "learning",
    beats: [
      {
        speech: "That would help us understand what people use",
        title: "Learn what\npeople use.",
        body: "Participation tells us which features residents use.",
        focus: 0,
      },
      {
        speech: "and what environmental evidence we still need to collect.",
        title: "Find the evidence\nwe still need.",
        body: "Environmental outcomes need their own evidence.",
        focus: 1,
      },
    ],
    note: "Use Right / Page Down for the next visual beat; Left / Page Up reverses it.",
  },
  {
    id: "close",
    member: 5,
    chapter: "Closing",
    tone: "lime",
    visual: "closing",
    beats: [
      {
        speech:
          "Our goal is to make caring for the planet easier to practise close to home.",
        title: "Caring for the planet\nstarts close to home.",
        body: "Everyday choices. Shared locally.",
        focus: 0,
      },
      {
        speech: "BorrowLah. Reduce. Reuse. Recycle.",
        title: "Reduce.\nReuse.\nRecycle.",
        body: "BorrowLah",
        focus: 1,
      },
      {
        speech: "Share more. Connect more. Live better.",
        title: "Share more.\nConnect more.\nLive better.",
        body: "BorrowLah · Reduce. Reuse. Recycle.",
        focus: 2,
      },
    ],
    note: "Hold the final frame after the tagline. Add all five names in your video editor.",
  },
]

export const timeline = scenes.flatMap((scene, sceneIndex) =>
  scene.beats.map((beat, beatIndex) => ({ sceneIndex, beatIndex, beat }))
)
export function sceneIndex(id?: string) {
  return Math.max(
    0,
    scenes.findIndex((scene) => scene.id === id)
  )
}
export function timelineIndex(scene: number, beat = 0) {
  const safeScene = Math.min(scenes.length - 1, Math.max(0, scene))
  const safeBeat = Number.isFinite(beat)
    ? Math.min(
        scenes[safeScene]!.beats.length - 1,
        Math.max(0, Math.trunc(beat))
      )
    : 0
  return timeline.findIndex(
    (item) => item.sceneIndex === safeScene && item.beatIndex === safeBeat
  )
}
