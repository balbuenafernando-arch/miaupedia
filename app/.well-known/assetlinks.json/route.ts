import statements from "./statement.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(statements);
}
