"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setFailed(false)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setFailed(true)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-24"
        onClick={() => void copy()}
        aria-live="polite"
      >
        {copied ? (
          <CheckIcon aria-hidden="true" data-icon="inline-start" />
        ) : (
          <CopyIcon aria-hidden="true" data-icon="inline-start" />
        )}
        {copied ? "Copied" : "Copy code"}
      </Button>
      {failed ? (
        <span role="status" className="text-sm text-ink-soft">
          Couldn’t copy. Open the voucher and select the code.
        </span>
      ) : null}
    </span>
  )
}
