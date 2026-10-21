import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { parsePreviewTask } from "@/lib/judges/journey"
import { PreviewApp } from "@/components/judges/preview-app"
import { isJudgeRole, isJudgesPreview, judgeRoles } from "@/lib/judges/config"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>
}): Promise<Metadata> {
  const { role } = await params
  return {
    title: `${judgeRoles.find((item) => item.id === role)?.name ?? "Preview"} · Judges preview`,
    robots: { index: false, follow: false },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>
  searchParams: Promise<{ task?: string | string[] }>
}) {
  const { role } = await params
  if (!isJudgesPreview() || !isJudgeRole(role)) notFound()
  const { task } = await searchParams
  return <PreviewApp role={role} task={parsePreviewTask(task)} />
}
