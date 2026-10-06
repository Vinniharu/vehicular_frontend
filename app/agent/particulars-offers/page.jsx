"use client";

// Staff SMS for vehicle papers offers link here; the offers live on /agent.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../_components/ui";

export default function ParticularsOffersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent");
  }, [router]);
  return <Spinner label="Opening offers…" />;
}
