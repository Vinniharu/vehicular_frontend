import SlaCountdownMonitor from "@/app/components/sla/SlaCountdownMonitor";

export const metadata = {
  title: "SLA Countdown & Breach Monitor | Admin Portal",
};

export default function AdminCountdownPage() {
  return <SlaCountdownMonitor portal="admin" />;
}
