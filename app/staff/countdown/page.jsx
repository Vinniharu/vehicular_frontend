import SlaCountdownMonitor from "@/app/components/sla/SlaCountdownMonitor";

export const metadata = {
  title: "SLA Countdown & Breach Monitor | Staff Portal",
};

export default function StaffCountdownPage() {
  return <SlaCountdownMonitor portal="staff" />;
}
