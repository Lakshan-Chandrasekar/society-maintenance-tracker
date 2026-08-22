import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ComplaintDetailClient from "./client";

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <ComplaintDetailClient id={params.id} isAdmin={session.role === "ADMIN"} />
    </>
  );
}
