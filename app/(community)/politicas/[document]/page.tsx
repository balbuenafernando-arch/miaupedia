import { notFound } from "next/navigation";
import { legalDocuments, type LegalDocument } from "@/lib/community-legal";

export default async function PolicyPage({params}: {params:Promise<{document:string}>}) {
  const {document} = await params;
  if (!Object.prototype.hasOwnProperty.call(legalDocuments,document)) notFound();
  const policy = legalDocuments[document as LegalDocument];
  return <article className="community-narrow">
    <p className="community-meta">Versión {policy.version}</p>
    <h1>{policy.title}</h1>
    {policy.sections.map(([heading,body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
  </article>;
}
