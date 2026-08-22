import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import AdminComplaintsClient from "./client";

export default function AdminComplaintsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/resident/dashboard");

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <AdminComplaintsClient />
    </>
  );
}
