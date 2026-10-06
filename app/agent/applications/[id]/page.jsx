"use client";

// Agent job page. Loads the job and hands it to the screen for its service;
// every screen leads with one "next step" and a clear finish-and-upload
// action (see app/agent/_components).

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApplication, getVehicle } from "@/lib/api";
import { Button, ErrorState } from "@/app/dashboard/_kit";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import { jobStage, isVerification } from "../../_components/jobs";
import { Spinner } from "../../_components/ui";
import StandardJob from "../../_components/StandardJob";
import ParticularsJob from "../../_components/ParticularsJob";
import { RegistryJob, VerificationJob } from "../../_components/CheckJobs";

export default function AgentJobPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? String(params.id).replace(/^app_/, "") : null;
  const appId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;

  const [application, setApplication] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = async (quiet = false) => {
    if (!appId) {
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    setError(null);
    const res = await getApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) {
      setApplication(res.data);
      if (res.data.vehicle) setVehicle(res.data.vehicle);
      else if (res.data.vehicle_id) {
        getVehicle(res.data.vehicle_id).then((v) => v?.data && setVehicle(v.data));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  // Roadworthiness has its own checklist page.
  useEffect(() => {
    if (application?.application_type === "roadworthiness_express") router.replace(`/agent/rwx/${appId}`);
  }, [application, appId, router]);

  if (loading) return <Spinner label="Loading job…" />;
  if (error || !application) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <ErrorState title="Job not found" message={error || "This job couldn't be loaded."} onRetry={() => load()} />
        <div className="mt-4 text-center">
          <Button variant="ghost" href="/agent/applications">Back to my jobs</Button>
        </div>
      </div>
    );
  }

  const type = application.application_type;
  if (type === "roadworthiness_express") return <Spinner label="Opening inspection…" />;

  const props = { application, vehicle, stage: jobStage(application), onPreview: setPreview, reload: () => load(true) };
  return (
    <>
      <DocumentPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} fileUrl={preview} />
      {isVerification(type) ? (
        <VerificationJob {...props} />
      ) : type === "central_motor_registry" ? (
        <RegistryJob {...props} />
      ) : type === "vehicle_particulars" ? (
        <ParticularsJob {...props} />
      ) : (
        <StandardJob {...props} />
      )}
    </>
  );
}
