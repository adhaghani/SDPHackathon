"use client"

import { useActionState, useOptimistic, useRef, useState } from "react"
import {
  ArrowUpIcon,
  BookOpenIcon,
  MessageCircleIcon,
  PlusIcon,
} from "lucide-react"

import { askHelp, talkToOrganiser, type HelpActionState } from "@/actions/help"
import type { HelpArticle, HelpMessage } from "@/lib/help"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@workspace/ui/components/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/message-scroller"
import { Spinner } from "@workspace/ui/components/spinner"

const STARTERS = [
  "How do I borrow an item?",
  "How do I list something?",
  "How do deposits work?",
  "How do I earn BetterPoints?",
]
const idleState = { status: "idle" } as const

export function HelpChat({
  initialArticles,
  initialConversationId = "",
  initialMessages = [],
}: {
  initialArticles: HelpArticle[]
  initialConversationId?: string
  initialMessages?: HelpMessage[]
}) {
  const [input, setInput] = useState("")
  const [chatKey, setChatKey] = useState(0)
  // Remounting resets the action state as well as the visible conversation.
  return (
    <HelpConversation
      key={chatKey}
      initialArticles={initialArticles}
      initialConversationId={chatKey ? "" : initialConversationId}
      initialMessages={chatKey ? [] : initialMessages}
      input={input}
      setInput={setInput}
      onNewChat={() => {
        setInput("")
        setChatKey((value) => value + 1)
        window.history.replaceState(null, "", "/help")
      }}
    />
  )
}

function HelpConversation({
  initialArticles,
  initialConversationId,
  initialMessages,
  input,
  setInput,
  onNewChat,
}: {
  initialArticles: HelpArticle[]
  initialConversationId: string
  initialMessages: HelpMessage[]
  input: string
  setInput: (value: string) => void
  onNewChat: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [articleSearch, setArticleSearch] = useState("")
  const [state, askAction, pending] = useActionState<HelpActionState, FormData>(
    async (previous, form) => {
      try {
        const next = await askHelp(previous, form)
        if (next.status === "error") {
          setInput(String(form.get("question") ?? ""))
          return { ...previous, status: "error", message: next.message }
        }
        if (next.conversationId) {
          window.history.replaceState(
            null,
            "",
            `/help?conversation=${next.conversationId}`
          )
        }
        inputRef.current?.focus()
        return next
      } catch {
        setInput(String(form.get("question") ?? ""))
        return {
          ...previous,
          status: "error",
          message: "Your answer couldn't be loaded. Try again in a moment.",
        }
      }
    },
    {
      status: "idle",
      conversationId: initialConversationId,
      messages: initialMessages,
    }
  )
  const [ticketState, ticketAction, ticketPending] = useActionState(
    talkToOrganiser,
    idleState
  )
  const [messages, addQuestion] = useOptimistic(
    state.messages ?? [],
    (current, question: string) => [
      ...current,
      { id: "pending-question", role: "user", content: question },
    ]
  )
  const conversationId = state.conversationId ?? initialConversationId
  const allArticles = [...(state.articles ?? []), ...initialArticles].filter(
    (article, index, list) =>
      list.findIndex((item) => item.id === article.id) === index
  )
  const visibleArticles = allArticles.filter((article) =>
    `${article.title} ${article.body}`
      .toLowerCase()
      .includes(articleSearch.trim().toLowerCase())
  )

  return (
    <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section
        aria-labelledby="ask-help-heading"
        className="flex h-[min(700px,calc(100dvh-18rem))] min-h-[480px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-hairline bg-surface"
      >
        <header className="flex items-center justify-between gap-3 border-b border-hairline p-4 sm:px-6">
          <div>
            <h2 id="ask-help-heading" className="text-title text-ink">
              Ask BorrowLah
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Practical help, backed by our help centre.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="New chat"
            disabled={pending || ticketPending || !messages.length}
            onClick={onNewChat}
          >
            <PlusIcon />
          </Button>
        </header>
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="flex-1">
            <MessageScrollerViewport aria-label="Help conversation">
              <MessageScrollerContent
                className="p-4 sm:p-6"
                aria-label="Chat messages"
                aria-live="polite"
                aria-busy={pending}
              >
                {!messages.length ? (
                  <MessageScrollerItem
                    messageId="welcome"
                    className="my-auto flex flex-col items-start gap-5 py-8"
                  >
                    <MessageCircleIcon
                      aria-hidden="true"
                      className="size-8 text-ink"
                    />
                    <div>
                      <h3 className="text-title text-ink">
                        A little help from your block.
                      </h3>
                      <p className="mt-2 max-w-[48ch] text-sm leading-6 text-ink-muted">
                        Ask a question in your own words. We can walk you
                        through borrowing, sharing, events and more.
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      aria-label="Suggested questions"
                    >
                      {STARTERS.map((question) => (
                        <Button
                          key={question}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInput(question)
                            inputRef.current?.focus()
                          }}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </MessageScrollerItem>
                ) : (
                  messages.map((message, index) => (
                    <MessageScrollerItem
                      key={message.id ?? index}
                      messageId={message.id ?? String(index)}
                    >
                      <Message
                        align={message.role === "user" ? "end" : "start"}
                      >
                        <MessageContent>
                          <MessageHeader>
                            {message.role === "user"
                              ? "You"
                              : message.role === "organiser"
                                ? "Organiser"
                                : "BorrowLah"}
                          </MessageHeader>
                          <Bubble
                            variant={
                              message.role === "user" ? "default" : "muted"
                            }
                          >
                            <BubbleContent>
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))
                )}
                {pending ? (
                  <MessageScrollerItem messageId="reply-pending">
                    <p
                      role="status"
                      className="flex items-center gap-2 text-sm text-ink-muted"
                    >
                      <Spinner aria-hidden="true" />
                      Finding an answer…
                    </p>
                  </MessageScrollerItem>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton
              size="icon"
              aria-label="Scroll to latest message"
            />
          </MessageScroller>
        </MessageScrollerProvider>
        <footer className="flex flex-col gap-3 border-t border-hairline p-4 sm:px-6">
          {state.message ? (
            <Alert
              variant={state.status === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <form
            ref={formRef}
            action={async (form) => {
              const question = String(form.get("question") ?? "").trim()
              if (!question || pending) return
              addQuestion(question)
              setInput("")
              askAction(form)
            }}
          >
            <input type="hidden" name="conversationId" value={conversationId} />
            <FieldGroup>
              <Field data-invalid={state.status === "error"}>
                <FieldLabel className="sr-only" htmlFor="help-question">
                  Help question
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    ref={inputRef}
                    id="help-question"
                    name="question"
                    rows={2}
                    className="min-h-16 max-h-40"
                    maxLength={1000}
                    required
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask anything about using BorrowLah…"
                    disabled={pending}
                    aria-invalid={state.status === "error"}
                    aria-describedby="help-composer-hint"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault()
                        if (input.trim() && !pending)
                          formRef.current?.requestSubmit()
                      }
                    }}
                  />
                  <InputGroupAddon align="block-end">
                    <p
                      id="help-composer-hint"
                      className="mr-auto text-xs text-muted-foreground"
                    >
                      Enter to send · Shift + Enter for a new line
                    </p>
                    <Button
                      type="submit"
                      variant="cta"
                      size="icon"
                      disabled={pending}
                      aria-disabled={pending || !input.trim()}
                      aria-label="Send message"
                    >
                      <ArrowUpIcon />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </form>
          <p className="text-xs leading-5 text-ink-muted">
            Answers use help articles and may need checking. For
            account-specific help, talk to an organiser.
          </p>
        </footer>
      </section>

      <aside className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="help-articles-heading">
          <div className="mb-3 flex items-center gap-2">
            <BookOpenIcon aria-hidden="true" className="size-5" />
            <h2 id="help-articles-heading" className="text-title text-ink">
              Help articles
            </h2>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="help-article-search" className="sr-only">
                Search help articles
              </FieldLabel>
              <Input
                id="help-article-search"
                type="search"
                placeholder="Find a guide…"
                value={articleSearch}
                onChange={(event) => setArticleSearch(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <div className="mt-3 max-h-80 overflow-y-auto overscroll-contain pr-1">
            <Accordion>
              {visibleArticles.map((article) => (
                <AccordionItem key={article.id} value={article.id}>
                  <AccordionTrigger>{article.title}</AccordionTrigger>
                  <AccordionContent>
                    <p className="leading-6 text-ink-muted">{article.body}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {!visibleArticles.length ? (
              <p className="py-4 text-sm text-ink-muted">
                No guides match that search. Try another word or ask in the
                chat.
              </p>
            ) : null}
          </div>
          {state.articles?.length ? (
            <p className="mt-2 text-xs text-ink-muted">
              Guides matching your latest question appear first.
            </p>
          ) : null}
        </section>
        <section
          aria-labelledby="organiser-heading"
          className="border-t border-hairline pt-5"
        >
          <h2 id="organiser-heading" className="text-title text-ink">
            Need a person?
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Ask an organiser to look into a problem with your account or
            booking.
          </p>
          <Accordion>
            <AccordionItem value="support">
              <AccordionTrigger>Talk to an organiser</AccordionTrigger>
              <AccordionContent>
                <form
                  action={ticketAction}
                  className="flex flex-col gap-3 pt-2"
                >
                  <input
                    type="hidden"
                    name="conversationId"
                    value={conversationId}
                  />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="support-subject">
                        What do you need help with?
                      </FieldLabel>
                      <Input
                        id="support-subject"
                        name="subject"
                        maxLength={160}
                        required
                        defaultValue="Need help with BorrowLah"
                      />
                    </Field>
                  </FieldGroup>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={ticketPending || pending}
                  >
                    {ticketPending ? (
                      <Spinner data-icon="inline-start" />
                    ) : null}
                    Create support ticket
                  </Button>
                  {ticketState.message ? (
                    <Alert
                      variant={
                        ticketState.status === "error"
                          ? "destructive"
                          : "default"
                      }
                    >
                      <AlertDescription>{ticketState.message}</AlertDescription>
                    </Alert>
                  ) : null}
                </form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </aside>
    </div>
  )
}
