import type { Metadata } from "next"
import { notFound } from "next/navigation"
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
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  if (!isJudgesPreview() || !isJudgeRole(role)) notFound()
  return <PreviewApp role={role} />
}
