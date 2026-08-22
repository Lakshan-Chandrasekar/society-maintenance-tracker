import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ResidentDashboardClient from "./client";

export default function ResidentDashboardPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "RESIDENT") redirect("/admin/dashboard");

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <ResidentDashboardClient />
    </>
  );
}
