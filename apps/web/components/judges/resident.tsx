"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  GiftIcon,
  HeartIcon,
  MapPinIcon,
  PlusIcon,
  RecycleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { bookingGuidance, type PreviewTask } from "@/lib/judges/journey"
import { bookingActions, bookingSteps, items } from "@/lib/judges/seed"
import { unavailable, type PreviewSession } from "./session"
import styles from "./judges.module.css"

type ResidentTab = "Borrow & lend" | "Events" | "Recycling" | "Rewards"
const tabs: ResidentTab[] = ["Borrow & lend", "Events", "Recycling", "Rewards"]

export function ResidentView({
  session,
  task,
}: {
  session: PreviewSession
  task?: PreviewTask
}) {
  const { state, update } = session
  const [tab, setTab] = useState<ResidentTab>(
    task === "events"
      ? "Events"
      : task === "recycling"
        ? "Recycling"
        : task === "rewards"
          ? "Rewards"
          : "Borrow & lend"
  )
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All items")
  const [selected, setSelected] = useState<string | null>(
    task === "borrow" ? "washer" : null
  )
  const bookingPanel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!selected) return
    bookingPanel.current?.focus({ preventScroll: true })
    bookingPanel.current?.scrollIntoView({
      block: "start",
      behavior: "instant",
    })
  }, [selected])
  const selectedItem = items.find((item) => item.id === selected)
  const step = selected ? (state.bookings[selected] ?? 0) : 0
  const completed = Object.values(state.bookings).filter(
    (value) => value === 6
  ).length
  const balance = 1250 - (state.redeemed ? 300 : 0)
  const filtered = items.filter(
    (item) =>
      `${item.name} ${item.owner} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "All items" ||
        (category === "Saved"
          ? state.saved.includes(item.id)
          : item.category === category))
  )

  return (
    <>
      <div className={`${styles.pageHero} ${styles.lime}`}>
        <div>
          <h1>
            A little sharing.
            <br />A better neighbourhood.
          </h1>
          <p>Hi Aisyah. What does your day need?</p>
          <span className={styles.location}>
            <MapPinIcon size={15} aria-hidden="true" />
            Harmoni Heights · Block A
          </span>
        </div>
        <div className={styles.points}>
          <GiftIcon size={25} aria-hidden="true" />
          <strong>{balance.toLocaleString("en-MY")}</strong>
          <span>BetterPoints · seeded balance</span>
        </div>
      </div>
      <div className={styles.tryGuide}>
        <strong>Try this</strong>
        <p>
          Open the pressure washer and follow the borrowing steps. You’ll
          simulate both neighbours’ confirmations. Then join the garden event
          and switch to the organiser view.
        </p>
      </div>
      <nav className={styles.tabs} aria-label="Resident features">
        {tabs.map((name) => (
          <button
            key={name}
            aria-current={name === tab ? "page" : undefined}
            onClick={() => {
              setTab(name)
              setSelected(null)
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      {tab === "Borrow & lend" && (
        <>
          <div className={styles.sectionTop}>
            <div>
              <h2>Good things, close to home.</h2>
              <p>Borrow from a neighbour. Return with care.</p>
            </div>
            <button
              className={styles.button}
              onClick={() => unavailable("Creating a borrow item")}
            >
              <PlusIcon size={17} aria-hidden="true" />
              List an item
            </button>
          </div>
          <div className={styles.filters}>
            <label className={styles.search}>
              <SearchIcon size={18} aria-hidden="true" />
              <input
                aria-label="Search demo items"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search items or neighbours"
              />
            </label>
            <label className={styles.selectLabel}>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {[
                  "All items",
                  "Tools",
                  "Home & garden",
                  "Outdoors",
                  "Saved",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          {selectedItem && (
            <section
              className={styles.bookingPanel}
              aria-labelledby="booking-title"
              ref={bookingPanel}
              tabIndex={-1}
            >
              <div className={styles.sectionTop}>
                <div>
                  <span className={styles.status}>
                    Sample borrowing journey
                  </span>
                  <h3 id="booking-title">{selectedItem.name}</h3>
                </div>
                <button
                  className={styles.iconButton}
                  aria-label="Close borrowing details"
                  onClick={() => setSelected(null)}
                >
                  <XIcon size={20} />
                </button>
              </div>
              <p>{selectedItem.detail}</p>
              <p className={styles.small}>
                Sample dates: 24–25 October 2026 · Community hub · Owner:{" "}
                {selectedItem.owner}
              </p>
              <div className={styles.bookingContext} aria-live="polite">
                <div>
                  <strong>
                    {step < 6
                      ? bookingGuidance[step]!.actor
                      : "The sharing loop is complete"}
                  </strong>
                  <span>{step} of 6 steps complete</span>
                </div>
                <progress
                  max={6}
                  value={step}
                  aria-label="Sample borrowing progress"
                />
                <p>
                  {step < 6
                    ? bookingGuidance[step]!.text
                    : "You’ve tried both neighbours’ parts of a loan. See the completed-loan total in the manager view, or continue to the community event."}
                </p>
              </div>
              <ol className={styles.bookingSteps}>
                {bookingSteps.slice(1).map((label, index) => (
                  <li
                    key={label}
                    aria-current={step === index ? "step" : undefined}
                    className={step > index ? styles.done : ""}
                  >
                    <span>
                      {step > index ? (
                        <CheckIcon size={13} aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
              <div className={styles.bookingBottom}>
                <div>
                  <strong>{bookingSteps[step]}</strong>
                  <p>
                    {step === 6
                      ? "The sample loan is complete. No real booking or points were created."
                      : "Approval and pick-up do not award points. Live rewards depend on the township’s active rules after completion."}
                  </p>
                </div>
                {step < 6 && (
                  <button
                    className={styles.button}
                    onClick={() =>
                      update(
                        {
                          bookings: {
                            ...state.bookings,
                            [selectedItem.id]: step + 1,
                          },
                        },
                        `${bookingSteps[step + 1]} · ${selectedItem.name}`
                      )
                    }
                  >
                    {bookingActions[step]}
                    <ArrowRightIcon size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              {step === 6 && (
                <div className={styles.inlineActions}>
                  <Link
                    href="/preview/manager"
                    className={styles.secondaryButton}
                  >
                    See the manager’s updated pulse{" "}
                    <ArrowRightIcon size={16} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/preview/resident?task=events"
                    className={styles.textLink}
                  >
                    Continue to the garden event{" "}
                    <ArrowRightIcon size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>
          )}
          <div className={styles.itemGrid}>
            {filtered.map((item) => (
              <article className={styles.item} key={item.id}>
                <div className={styles.itemImage}>
                  <Image
                    src={`/demo/${item.image}`}
                    alt={item.name}
                    width={400}
                    height={250}
                    sizes="(max-width: 430px) 100vw, (max-width: 1499px) 50vw, 25vw"
                  />
                  <button
                    className={styles.saveButton}
                    aria-label={`${state.saved.includes(item.id) ? "Unsave" : "Save"} ${item.name}`}
                    aria-pressed={state.saved.includes(item.id)}
                    onClick={() =>
                      update(
                        {
                          saved: state.saved.includes(item.id)
                            ? state.saved.filter((id) => id !== item.id)
                            : [...state.saved, item.id],
                        },
                        state.saved.includes(item.id)
                          ? "Item removed from saved"
                          : "Item saved"
                      )
                    }
                  >
                    <HeartIcon
                      size={18}
                      fill={
                        state.saved.includes(item.id) ? "currentColor" : "none"
                      }
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div className={styles.itemCopy}>
                  <span className={styles.small}>
                    {item.category} · {item.block}
                  </span>
                  <h3>{item.name}</h3>
                  <p>Shared by {item.owner}</p>
                  <div>
                    <span className={styles.status}>
                      {bookingSteps[state.bookings[item.id] ?? 0]}
                    </span>
                    <button
                      className={styles.textButton}
                      onClick={() => setSelected(item.id)}
                    >
                      View item <ArrowRightIcon size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <h3>No matching items</h3>
              <p>
                Try another search or category. The catalogue contains four
                seeded items.
              </p>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setQuery("")
                  setCategory("All items")
                }}
              >
                Show all demo items
              </button>
            </div>
          )}
          <p className={styles.small}>
            Completed sample loans: {completed}. All catalogue items and
            availability are seeded examples.
          </p>
        </>
      )}
      {tab === "Events" && (
        <section className={styles.featurePanel}>
          <div className={styles.eventArt}>
            <Image
              src="/images/township-garden.webp"
              alt="Community garden illustration"
              width={420}
              height={420}
            />
          </div>
          <div>
            <CalendarDaysIcon size={27} aria-hidden="true" />
            <h2>Community garden morning</h2>
            <p>
              Get your hands in the soil and meet the neighbours. A morning of
              planting, tidying, and sharing tips.
            </p>
            <p className={styles.small}>
              Sample event · 24 October 2026 · 8:30–10:30 AM MYT
              <br />
              Community garden · Raj, organiser
            </p>
            <span className={styles.status}>
              {state.rsvp
                ? "You’re on the sample guest list"
                : "Registration open · demo"}
            </span>
            <div className={styles.inlineActions}>
              <button
                className={styles.button}
                onClick={() =>
                  update(
                    {
                      rsvp: !state.rsvp,
                      checkedIn: state.rsvp
                        ? state.checkedIn.filter((id) => id !== "aisyah")
                        : state.checkedIn,
                    },
                    state.rsvp
                      ? "Sample RSVP cancelled"
                      : "Joined the sample event"
                  )
                }
              >
                {state.rsvp ? "Cancel sample RSVP" : "Join sample event"}
              </button>
              <Link className={styles.textLink} href="/preview/event">
                See the organiser’s view{" "}
                <ArrowRightIcon size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className={styles.small}>
              No confirmation email, ticket, or notification is sent.
            </p>
          </div>
        </section>
      )}
      {tab === "Recycling" && (
        <section className={styles.featurePanel}>
          <div className={`${styles.featureSymbol} ${styles.sky}`}>
            <RecycleIcon size={110} strokeWidth={1} aria-hidden="true" />
          </div>
          <div>
            <h2>Small habits. Shared progress.</h2>
            <p>
              Recycling logs help residents track their contribution to a shared
              township goal.
            </p>
            <dl className={styles.statRow}>
              <div>
                <dt>{state.recycling ? "14.5" : "12.5"} kg</dt>
                <dd>Your sample total</dd>
              </div>
              <div>
                <dt>{state.recycling ? "182" : "180"} / 250 kg</dt>
                <dd>Seeded township goal</dd>
              </div>
            </dl>
            <progress
              className={styles.progress}
              max={250}
              value={state.recycling ? 182 : 180}
              aria-label="Seeded recycling goal progress"
            />
            <button
              className={styles.button}
              disabled={state.recycling}
              onClick={() =>
                update({ recycling: true }, "Sample 2 kg paper log added")
              }
            >
              {state.recycling
                ? "Sample log added"
                : "Add sample 2 kg paper log"}
            </button>
            <p className={styles.small}>
              Self-reported demo weights, not verified measurements. No points
              are issued in this preview.
            </p>
            <button
              className={styles.textButton}
              onClick={() => unavailable("Uploading a recycling receipt")}
            >
              Upload a receipt <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
      {tab === "Rewards" && (
        <section className={styles.featurePanel}>
          <div className={`${styles.featureSymbol} ${styles.mustard}`}>
            <GiftIcon size={110} strokeWidth={1} aria-hidden="true" />
          </div>
          <div>
            <h2>A little thank-you for taking part.</h2>
            <p>
              Explore how BetterPoints can connect community participation with
              local rewards.
            </p>
            <h3>Kopi Kita · RM5 drink voucher</h3>
            <p>300 BetterPoints · Fictional reward partner</p>
            <button
              className={styles.button}
              disabled={state.redeemed}
              onClick={() =>
                update(
                  { redeemed: true },
                  "Sample reward redeemed · 300 demo BP"
                )
              }
            >
              {state.redeemed
                ? "Sample voucher redeemed"
                : "Redeem sample reward"}
            </button>
            {state.redeemed && (
              <div className={styles.guide}>
                <strong>DEMO-ONLY · No cash value</strong>
                <p>This sample voucher cannot be used at a real outlet.</p>
              </div>
            )}
            <p className={styles.small}>
              The seeded balance starts at 1,250 BP. No real voucher or points
              transaction is created.
            </p>
          </div>
        </section>
      )}
    </>
  )
}
