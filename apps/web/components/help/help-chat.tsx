"use client"

import { useActionState, useState } from "react"

import { askHelp, talkToOrganiser, type HelpActionState } from "@/actions/help"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

type Article = { id: string; slug: string; title: string; body: string; category: string }

export function HelpChat({
  initialArticles,
  initialConversationId = "",
  initialMessages = [],
}: {
  initialArticles: Article[]
  initialConversationId?: string
  initialMessages?: Array<{ id: string; role: string; content: string; created_at: string }>
}) {
  const [state, askAction, pending] = useActionState(askHelp, idleState)
  const [ticketState, ticketAction, ticketPending] = useActionState(talkToOrganiser, idleState)
  const [expanded, setExpanded] = useState<string | null>(null)
  const articles = state.articles ?? initialArticles
  const conversationId = state.conversationId ?? initialConversationId
  const messages = state.messages ?? initialMessages

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section aria-labelledby="ask-help-heading" className="bb-card p-5">
        <h2 id="ask-help-heading" className="text-title text-ink">Ask BorrowBetter</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Answers use the help centre only. Without an AI key, the top matching articles are shown instead.
        </p>
        <form action={askAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversationId} />
          <Textarea
            name="question"
            rows={3}
            maxLength={1000}
            required
            placeholder="How does a handover work?"
            aria-label="Help question"
          />
          <Button type="submit" variant="cta" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Ask
          </Button>
        </form>
        {state.status === "error" && state.message ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        {state.status === "success" && state.answer ? (
          <div className="mt-5 rounded-lg bg-lilac-tint p-4">
            <p className="text-eyebrow text-ink-muted">
              {state.source === "ai" ? "AI answer grounded in help articles" : "Closest help articles"}
            </p>
            <p className="mt-2 whitespace-pre-line text-ink">{state.answer}</p>
          </div>
        ) : null}
        {messages.length ? (
          <div className="mt-5 max-h-72 overflow-y-auto border-t border-hairline pt-4">
            <ul className="space-y-2">
              {messages.map((message, index) => (
                <li
                  key={message.id ?? index}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user" ? "ml-auto bg-ink text-surface" : "bg-ground text-ink"
                  }`}
                >
                  {message.content}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form action={ticketAction} className="mt-5 flex flex-col gap-3 border-t border-hairline pt-4">
          <input type="hidden" name="conversationId" value={conversationId} />
          <label className="text-sm font-bold text-ink" htmlFor="support-subject">
            Talk to an organiser
          </label>
          <input
            id="support-subject"
            name="subject"
            maxLength={160}
            defaultValue="Need help with BorrowBetter"
            className="min-h-11 rounded-lg border border-ink-muted bg-surface px-3 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <Button type="submit" variant="outline" disabled={ticketPending}>
            {ticketPending ? <Spinner data-icon="inline-start" /> : null}
            Create support ticket
          </Button>
          {ticketState.message ? (
            <Alert variant={ticketState.status === "error" ? "destructive" : "default"}>
              <AlertDescription>{ticketState.message}</AlertDescription>
            </Alert>
          ) : null}
        </form>
      </section>

      <section aria-labelledby="help-articles-heading" className="bb-card p-5">
        <h2 id="help-articles-heading" className="text-title text-ink">Help articles</h2>
        <ul className="mt-3 divide-y divide-hairline">
          {articles.map((article) => (
            <li key={article.id} className="py-3">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-2 text-left font-bold text-ink"
                aria-expanded={expanded === article.id}
                onClick={() => setExpanded((current) => (current === article.id ? null : article.id))}
              >
                <span>{article.title}</span>
                <span aria-hidden="true">{expanded === article.id ? "−" : "+"}</span>
              </button>
              {expanded === article.id ? <p className="mt-2 text-sm leading-6 text-ink-muted">{article.body}</p> : null}
            </li>
          ))}
        </ul>
        {!articles.length ? <p className="mt-4 text-sm text-ink-muted">No matching articles yet.</p> : null}
      </section>
    </div>
  )
}
