"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="min-w-24" onClick={() => void copy()} aria-live="polite">
      {copied ? <CheckIcon aria-hidden="true" data-icon="inline-start" /> : <CopyIcon aria-hidden="true" data-icon="inline-start" />}
      {copied ? "Copied" : "Copy code"}
    </Button>
  )
}
