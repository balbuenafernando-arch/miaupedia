import { notFound } from "next/navigation";
import { MiaupediaApp } from "@/components/miaupedia-app";

export default async function PersonalPage({params}: {params:Promise<{section:string}>}) {
  const {section} = await params;
  if (section !== "mis-gatos" && section !== "agenda") notFound();
  return <MiaupediaApp initialTab={section==="mis-gatos" ? "Mi gato" : "Agenda"} personalOnly/>;
}
