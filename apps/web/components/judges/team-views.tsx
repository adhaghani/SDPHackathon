"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  DownloadIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import type { PreviewTask } from "@/lib/judges/journey"
import { attendees, visitors } from "@/lib/judges/seed"
import { unavailable, type PreviewSession } from "./session"
import styles from "./judges.module.css"

function Stats({ values }: { values: [string, string][] }) {
  return (
    <dl className={styles.metrics}>
      {values.map(([value, label]) => (
        <div key={label}>
          <dt>{value}</dt>
          <dd>{label}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ManagerView({
  session,
  task,
}: {
  session: PreviewSession
  task?: PreviewTask
}) {
  const { state, update } = session
  const [tab, setTab] = useState(
    task === "review" ? "Resident reviews" : "Township pulse"
  )
  const [period, setPeriod] = useState("30")
  const short = period === "7"
  const completed = Object.values(state.bookings).filter(
    (value) => value === 6
  ).length
  return (
    <>
      <div className={`${styles.pageHero} ${styles.sky}`}>
        <div>
          <h1>See the bigger picture.</h1>
          <p>Township Pulse · Harmoni Heights</p>
          <span className={styles.location}>
            <UsersIcon size={16} aria-hidden="true" />
            Township office · Manager perspective
          </span>
        </div>
        <span className={styles.heroStamp}>
          Seeded insight
          <br />
          Illustrative, not measured
        </span>
      </div>
      <div className={styles.tryGuide}>
        <strong>Try this</strong>
        <p>
          Review a sample membership under “Resident reviews”. Explore the
          period filter, then visit the resident view to complete a sample loan
          and see the demo total change here.
        </p>
      </div>
      <nav className={styles.tabs} aria-label="Manager features">
        {["Township pulse", "Resident reviews", "Planning signals"].map(
          (name) => (
            <button
              key={name}
              aria-current={name === tab ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              {name}
              {name === "Resident reviews" && state.membership === "pending"
                ? " (1)"
                : ""}
            </button>
          )
        )}
      </nav>
      {tab === "Township pulse" && (
        <>
          <div className={styles.sectionTop}>
            <div>
              <h2>A community in motion.</h2>
              <p>All figures below are seeded demo examples.</p>
            </div>
            <label className={styles.selectLabel}>
              <span>Sample reporting period</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </label>
          </div>
          <Stats
            values={[
              [
                String(
                  (short ? 42 : 128) + (state.membership === "approved" ? 1 : 0)
                ),
                "Active residents",
              ],
              [String((short ? 8 : 34) + completed), "Completed loans"],
              [String(short ? 2 : 8), "Community events"],
              [
                `${(short ? 36 : 180) + (state.recycling ? 2 : 0)} kg`,
                "Self-reported recycling",
              ],
            ]}
          />
          <div className={styles.twoColumns}>
            <section className={styles.panel}>
              <h3>Participation by activity</h3>
              <p className={styles.small}>
                Sample activity counts · last {period} days
              </p>
              <div className={styles.bars}>
                {[
                  ["Borrowing", short ? 18 : 72, "sky"],
                  ["Events", short ? 24 : 96, "lime"],
                  ["Neighbourly help", short ? 9 : 38, "mustard"],
                  ["Recycling logs", short ? 14 : 54, "paper"],
                ].map(([name, value, color]) => (
                  <div key={name}>
                    <div>
                      <span>{name}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className={styles.barTrack}>
                      <span
                        className={styles[String(color)]}
                        style={{
                          width: `${(Number(value) / (short ? 30 : 110)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.panel}>
              <h3>What this can help with</h3>
              <ul className={styles.readingList}>
                <li>
                  <strong>Plan around participation</strong>
                  <p>
                    See which activities residents return to before planning the
                    next community programme.
                  </p>
                </li>
                <li>
                  <strong>Keep an eye on the loop</strong>
                  <p>
                    Completed returns tell a different story from requests. This
                    demo adds only completed loans to the total.
                  </p>
                </li>
                <li>
                  <strong>Protect resident privacy</strong>
                  <p>
                    Production planning views use aggregate signals and suppress
                    small groups. These figures are fictional.
                  </p>
                </li>
              </ul>
            </section>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={() => unavailable("Exporting township data")}
          >
            <DownloadIcon size={16} aria-hidden="true" />
            Export report
          </button>
        </>
      )}
      {tab === "Resident reviews" && (
        <section className={styles.panel}>
          <div className={styles.sectionTop}>
            <div>
              <h2>Welcome a new neighbour.</h2>
              <p>One seeded membership request, ready for review.</p>
            </div>
            <span className={styles.status}>
              {state.membership === "pending" ? "1 pending" : "Review complete"}
            </span>
          </div>
          <div className={styles.reviewRow}>
            <div className={styles.avatar}>NH</div>
            <div>
              <h3>Nur Hana</h3>
              <p>Block C · Unit C-05-02</p>
              <p className={styles.small}>
                Fictional resident · Sample supporting document
              </p>
            </div>
            <span className={styles.status}>{state.membership}</span>
          </div>
          <p>
            This simulates a manager’s membership decision. There are no
            identity documents or real accounts in this preview.
          </p>
          {state.membership === "pending" ? (
            <div className={styles.inlineActions}>
              <button
                className={styles.button}
                onClick={() =>
                  update(
                    { membership: "approved" },
                    "Sample membership approved"
                  )
                }
              >
                <CheckIcon size={17} aria-hidden="true" />
                Approve sample resident
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  update(
                    { membership: "declined" },
                    "Sample membership declined"
                  )
                }
              >
                Decline sample request
              </button>
            </div>
          ) : (
            <div className={styles.guide}>
              <strong>Sample membership {state.membership}</strong>
              <p>
                No notification was sent. Use Reset demo to try the other
                decision.
              </p>
            </div>
          )}
        </section>
      )}
      {tab === "Planning signals" && (
        <section className={styles.panel}>
          <h2>From activity to better questions.</h2>
          <p>
            These sample signals illustrate a decision workflow. They are not
            validated recommendations.
          </p>
          <div className={styles.signal}>
            <span className={styles.status}>12 fictional residents</span>
            <h3>Could a shared tool hub help?</h3>
            <p>
              Seeded requests show interest in drills and ladders. A manager
              could investigate a small equipment pilot, then compare actual
              uptake and maintenance costs.
            </p>
            <button
              className={styles.secondaryButton}
              onClick={() => unavailable("Creating an equipment pilot")}
            >
              <PlusIcon size={17} aria-hidden="true" />
              Create pilot proposal
            </button>
          </div>
          <div className={styles.signal}>
            <span className={styles.status}>8 fictional residents</span>
            <h3>A repair café worth exploring</h3>
            <p>
              Sample event interest points toward repair and reuse. Ask
              residents about timing, volunteer availability, and useful repair
              skills before committing a budget.
            </p>
            <button
              className={styles.textButton}
              onClick={() => unavailable("Publishing a resident survey")}
            >
              Ask residents <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          </div>
          <p className={styles.small}>
            Production demand views suppress groups below five distinct
            residents. This preview contains aggregate seeded examples only.
          </p>
        </section>
      )}
    </>
  )
}

export function GuardView({ session }: { session: PreviewSession }) {
  const { state, update } = session
  const [code, setCode] = useState("DEMO-1024")
  const [lookedUp, setLookedUp] = useState<string | null>(null)
  const [sighted, setSighted] = useState(false)
  const [gate, setGate] = useState("Main gate")
  const visitor = visitors.find((item) => item.code === lookedUp)
  const isInside = !!visitor && state.inside.includes(visitor.code)
  const departed = !!visitor && state.departures.includes(visitor.code)
  return (
    <>
      <div className={`${styles.pageHero} ${styles.mustard}`}>
        <div>
          <h1>
            A warmer welcome.
            <br />A clearer gate.
          </h1>
          <p>Visitor access · Harmoni Heights</p>
          <span className={styles.location}>
            <ShieldCheckIcon size={16} aria-hidden="true" />
            Guard perspective · Demo shift
          </span>
        </div>
        <ShieldCheckIcon
          className={styles.heroIcon}
          size={100}
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
      <div className={styles.tryGuide}>
        <strong>Try this</strong>
        <p>
          Look up DEMO-1024, confirm the sample identity check, then check the
          visitor in and out. Try DEMO-EXPIRED to see an invalid pass. No camera
          or real visitor data is used.
        </p>
      </div>
      <Stats
        values={[
          [String(state.inside.length), "Sample visitors inside"],
          [String(state.departures.length), "Sample departures"],
          ["2", "Valid sample passes"],
        ]}
      />
      <div className={styles.twoColumns}>
        <section className={styles.panel}>
          <h2>Check a visitor pass.</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setLookedUp(code.trim().toUpperCase())
              setSighted(false)
            }}
            className={styles.form}
          >
            <label>
              Gate
              <select
                value={gate}
                onChange={(event) => setGate(event.target.value)}
              >
                <option>Main gate</option>
                <option>Community hub gate</option>
              </select>
            </label>
            <label>
              Sample pass code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="DEMO-1024"
                required
              />
            </label>
            <button className={styles.button} type="submit">
              <SearchIcon size={17} aria-hidden="true" />
              Look up sample pass
            </button>
          </form>
          <button
            className={styles.textButton}
            onClick={() => unavailable("Camera QR scanning")}
          >
            Scan a real QR code <ArrowRightIcon size={16} aria-hidden="true" />
          </button>
          <p className={styles.small}>
            Sample passes are fixed scenarios; validity here does not use the
            current date.
          </p>
        </section>
        <section className={styles.panel} aria-live="polite">
          <h2>Pass result</h2>
          {lookedUp === null ? (
            <div className={styles.empty}>
              <ShieldCheckIcon size={35} aria-hidden="true" />
              <h3>Ready when you are</h3>
              <p>Look up a sample code to see visitor details.</p>
            </div>
          ) : !visitor ? (
            <div className={styles.guide}>
              <h3>No sample pass found</h3>
              <p>
                Try DEMO-1024 or DEMO-2048. Only seeded codes are recognised.
              </p>
            </div>
          ) : (
            <>
              <span className={styles.status}>
                {!visitor.valid
                  ? "Expired · Entry unavailable"
                  : isInside
                    ? "Inside township"
                    : departed
                      ? "Visit completed"
                      : "Valid sample pass"}
              </span>
              <h3 className={styles.resultName}>{visitor.name}</h3>
              <dl className={styles.details}>
                <div>
                  <dt>Host</dt>
                  <dd>{visitor.host}</dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>{visitor.unit}</dd>
                </div>
                <div>
                  <dt>Vehicle</dt>
                  <dd>{visitor.plate}</dd>
                </div>
                <div>
                  <dt>Gate</dt>
                  <dd>{gate}</dd>
                </div>
              </dl>
              {visitor.valid && !departed && (
                <>
                  {!isInside && (
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={sighted}
                        onChange={(event) => setSighted(event.target.checked)}
                      />
                      Simulate identity sighted at gate
                    </label>
                  )}
                  <button
                    className={styles.button}
                    disabled={!isInside && !sighted}
                    onClick={() =>
                      update(
                        isInside
                          ? {
                              inside: state.inside.filter(
                                (item) => item !== visitor.code
                              ),
                              departures: [...state.departures, visitor.code],
                            }
                          : { inside: [...state.inside, visitor.code] },
                        isInside
                          ? "Sample visitor checked out"
                          : "Sample visitor checked in"
                      )
                    }
                  >
                    {isInside
                      ? "Check out sample visitor"
                      : "Check in sample visitor"}
                  </button>
                </>
              )}
              <p className={styles.small}>
                {departed
                  ? "Reset demo to replay this sample visit."
                  : !visitor.valid
                    ? "An expired pass cannot be checked in. Try a valid sample code."
                    : "Simulation only. No access system is connected."}
              </p>
            </>
          )}
        </section>
      </div>
      <section className={styles.panel}>
        <h3>Available sample passes</h3>
        <div className={styles.sampleCodes}>
          {visitors.map((item) => (
            <button
              key={item.code}
              className={styles.secondaryButton}
              onClick={() => {
                setCode(item.code)
                setLookedUp(null)
                setSighted(false)
              }}
            >
              {item.code}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

export function EventView({ session }: { session: PreviewSession }) {
  const { state, update } = session
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All attendees")
  const registered = attendees.filter(
    (item) => item.id !== "aisyah" || state.rsvp
  )
  const visible = registered.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All attendees" ||
        (filter === "Checked in"
          ? state.checkedIn.includes(item.id)
          : !state.checkedIn.includes(item.id)))
  )
  const checked = registered.filter((item) =>
    state.checkedIn.includes(item.id)
  ).length
  return (
    <>
      <div className={`${styles.pageHero} ${styles.lime}`}>
        <div>
          <h1>Bring the block together.</h1>
          <p>Community garden morning</p>
          <span className={styles.location}>
            <CalendarDaysIcon size={16} aria-hidden="true" />
            24 October 2026 · 8:30–10:30 AM MYT · Sample event
          </span>
          <span className={styles.location}>
            <MapPinIcon size={16} aria-hidden="true" />
            Community garden · Raj, organiser
          </span>
        </div>
        <CalendarDaysIcon
          className={styles.heroIcon}
          size={100}
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
      <div className={styles.tryGuide}>
        <strong>Try this</strong>
        <p>
          Find an attendee and check them in. RSVP as Aisyah from the resident’s
          Events tab, then return here to see her registration. Duplicate
          check-ins are disabled.
        </p>
      </div>
      <Stats
        values={[
          [String(registered.length), "Sample registrations"],
          [String(checked), "Checked in"],
          [String(registered.length - checked), "Expected arrivals"],
        ]}
      />
      <div className={styles.sectionTop}>
        <div>
          <h2>A good morning starts here.</h2>
          <p>Manage sample attendance. No tickets or notifications are sent.</p>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => unavailable("Creating an event")}
        >
          <PlusIcon size={17} aria-hidden="true" />
          Create event
        </button>
      </div>
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label className={styles.search}>
            <SearchIcon size={18} aria-hidden="true" />
            <input
              aria-label="Search sample attendees"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search attendee names"
            />
          </label>
          <label className={styles.selectLabel}>
            <span>Attendance</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {["All attendees", "Checked in", "Not checked in"].map(
                (value) => (
                  <option key={value}>{value}</option>
                )
              )}
            </select>
          </label>
        </div>
        <ul className={styles.attendees}>
          {visible.map((item) => (
            <li key={item.id}>
              <div className={styles.avatar}>
                {item.name
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {item.role} · {item.block}
                </p>
              </div>
              {state.checkedIn.includes(item.id) ? (
                <span className={styles.status}>
                  <CheckIcon size={14} aria-hidden="true" />
                  Checked in
                </span>
              ) : (
                <button
                  className={styles.button}
                  aria-label={`Check in ${item.name}`}
                  onClick={() =>
                    update(
                      { checkedIn: [...state.checkedIn, item.id] },
                      `${item.name} checked in`
                    )
                  }
                >
                  Check in
                </button>
              )}
            </li>
          ))}
        </ul>
        {visible.length === 0 && (
          <div className={styles.empty}>
            <h3>No attendees match</h3>
            <p>
              Change the name or attendance filter to see the seeded guest list.
            </p>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setQuery("")
                setFilter("All attendees")
              }}
            >
              Show all attendees
            </button>
          </div>
        )}
        <div className={styles.inlineActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => unavailable("Exporting the attendance list")}
          >
            <DownloadIcon size={16} aria-hidden="true" />
            Export attendees
          </button>
          <button
            className={styles.textButton}
            onClick={() =>
              unavailable("Publishing a live event check-in QR code")
            }
          >
            Open live QR check-in{" "}
            <ArrowRightIcon size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
      <div className={styles.guide}>
        <strong>Attendance is one step in the live workflow.</strong>
        <p>
          This preview records sample check-ins only. Event completion,
          volunteer verification, and BetterPoints issuance are not simulated.
        </p>
        <Link href="/preview/resident" className={styles.textLink}>
          Switch to the resident’s view{" "}
          <ArrowRightIcon size={16} aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
