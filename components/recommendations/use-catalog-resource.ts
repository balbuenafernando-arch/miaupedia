import { useEffect, useState } from "react";

type Resource<T> =
  | { status: "loading" | "error" }
  | { status: "ready"; data: T };

export function useCatalogResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ load: typeof load; attempt: number; resource: Resource<T> }>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      data => {
        if (!controller.signal.aborted) setResult({ load, attempt, resource: { status: "ready", data } });
      },
      () => {
        if (!controller.signal.aborted) setResult({ load, attempt, resource: { status: "error" } });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  const resource: Resource<T> = result?.load === load && result.attempt === attempt ? result.resource : { status: "loading" };
  return { resource, refresh: () => setAttempt(value => value + 1) };
}
