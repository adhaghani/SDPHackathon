import Image from "next/image"
import Link from "next/link"
import {
  CompassIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  Building2Icon,
  CalendarDaysIcon,
  DatabaseIcon,
  MousePointer2Icon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { judgeRoles } from "@/lib/judges/config"
import styles from "./judges.module.css"

const icons = [UsersIcon, Building2Icon, ShieldCheckIcon, CalendarDaysIcon]

export function JudgesLanding() {
  return (
    <div className={styles.world}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.landingHeader}>
        <Link href="/" aria-label="BorrowLah judges overview">
          <BrandLogo />
        </Link>
        <span className={styles.demoLabel}>
          <span />
          Judges preview
        </span>
        <a
          className={styles.liveLink}
          href="https://borrowlah.my"
          target="_blank"
          rel="noreferrer"
        >
          Live app <ArrowUpRightIcon size={16} aria-hidden="true" />
        </a>
      </header>
      <main id="main">
        <section className={styles.hero} aria-labelledby="overview-title">
          <div className={styles.heroCopy}>
            <h1 id="overview-title">
              A better township.
              <br />
              <span>From every side.</span>
            </h1>
            <p>
              BorrowLah brings neighbours and township teams together. Borrow
              what you need, join community events, welcome visitors, and turn
              everyday participation into a more connected place to live.
            </p>
            <div className={styles.heroActions}>
              <Link
                href="/preview/resident?task=borrow"
                className={styles.primaryLink}
              >
                Start the guided demo{" "}
                <ArrowRightIcon size={18} aria-hidden="true" />
              </Link>
              <a href="#perspectives" className={styles.textLink}>
                Choose a perspective
              </a>
            </div>
            <div className={styles.heroMeta}>
              <MousePointer2Icon size={16} aria-hidden="true" /> Four
              perspectives. No account needed.
            </div>
          </div>
          <figure className={styles.heroFigure}>
            <Image
              src="/images/township-garden.webp"
              alt="Illustration of neighbours sharing a green community space"
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 90vw, 42vw"
              preload
            />
            <figcaption>
              <span className={styles.figureDot} />
              One township. Many ways to take part.
            </figcaption>
          </figure>
        </section>
        <div className={styles.disclosure}>
          <DatabaseIcon size={20} aria-hidden="true" />
          <p>
            <strong>Seeded demo data. No database connection.</strong>{" "}
            Everything here is fictional. Supported actions change this browser
            tab only. The live, database-connected app is at{" "}
            <a href="https://borrowlah.my" target="_blank" rel="noreferrer">
              borrowlah.my <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
            .
          </p>
        </div>
        <section className={styles.routeIntro} aria-labelledby="route-title">
          <div>
            <CompassIcon size={26} aria-hidden="true" />
            <div>
              <h2 id="route-title">One neighbourhood. A connected story.</h2>
              <p>
                A suggested 3–5 minute route. Your progress follows you between
                perspectives.
              </p>
            </div>
          </div>
          <ol>
            <li>
              <span>Resident</span>Borrow & return
            </li>
            <li>
              <span>Resident → organiser</span>RSVP & check in
            </li>
            <li>
              <span>Guard</span>Welcome a visitor
            </li>
            <li>
              <span>Manager</span>Review & understand
            </li>
          </ol>
          <Link
            href="/preview/resident?task=borrow"
            className={styles.routeStart}
          >
            Take the guided route{" "}
            <ArrowRightIcon size={17} aria-hidden="true" />
          </Link>
        </section>
        <section
          id="perspectives"
          className={styles.perspectives}
          aria-labelledby="perspective-title"
        >
          <div className={styles.sectionIntro}>
            <h2 id="perspective-title">Choose your perspective.</h2>
            <p>
              Pick a role and try a small part of township life.
              <br />
              Switch perspectives anytime from the demo navigation.
            </p>
          </div>
          <div className={styles.roleGrid}>
            {judgeRoles.map((role, index) => {
              const Icon = icons[index]!
              return (
                <Link
                  key={role.id}
                  href={`/preview/${role.id}`}
                  className={`${styles.roleCard} ${styles[role.color]}`}
                >
                  <div className={styles.roleCardTop}>
                    <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
                    <ArrowUpRightIcon size={22} aria-hidden="true" />
                  </div>
                  <h3>{role.name}</h3>
                  <p>{role.summary}</p>
                  <div className={styles.roleTask}>
                    <span>Try this</span>
                    {role.task}
                  </div>
                  <span className={styles.roleCta}>
                    Explore as{" "}
                    {role.id === "event"
                      ? "organiser"
                      : role.name.toLowerCase()}{" "}
                    <ArrowRightIcon size={17} aria-hidden="true" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
        <section className={styles.before} aria-labelledby="before-title">
          <div>
            <h2 id="before-title">Before you demo.</h2>
            <p>A little context for a smoother visit.</p>
            <Link
              href="/preview/resident?task=borrow"
              className={styles.textLink}
            >
              Start with the resident journey{" "}
              <ArrowRightIcon size={17} aria-hidden="true" />
            </Link>
          </div>
          <dl className={styles.notes}>
            <div>
              <dt>
                <MousePointer2Icon size={20} aria-hidden="true" />
                Follow the prompts
              </dt>
              <dd>
                Use “Your demo route” to jump to the next action and see your
                progress. Search, filter, and try the sample actions. A
                recent-activity log shows what changed across roles. Unavailable
                features explain their limits in a toast.
              </dd>
            </div>
            <div>
              <dt>
                <RotateCcwIcon size={20} aria-hidden="true" />
                Make it yours, then reset
              </dt>
              <dd>
                Changes stay in this tab as you move between roles. “Reset demo”
                restores all sample data. Closing the tab ends the session. No
                messages, real bookings, or rewards are sent.
              </dd>
            </div>
            <div>
              <dt>
                <DatabaseIcon size={20} aria-hidden="true" />
                Read the numbers as examples
              </dt>
              <dd>
                Names, activity, points, and township figures are seeded
                examples, not pilot results. Recycling quantities are
                self-reported; impact figures are estimates.
              </dd>
            </div>
            <div>
              <dt>
                <ShieldCheckIcon size={20} aria-hidden="true" />A guided preview
                of a wider app
              </dt>
              <dd>
                This preview covers selected journeys. Account verification,
                uploads, camera scanning, notifications, and database writes
                belong to the live app and are unavailable here.
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <footer className={styles.footer}>
        <BrandLogo className="w-32" />
        <p>Share more. Connect more. Live better.</p>
        <span>Interactive judges preview · Seeded data</span>
      </footer>
    </div>
  )
}
