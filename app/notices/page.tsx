import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import NoticeBoardClient from "./client";

export default function NoticesPage() {
  const session = getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <NoticeBoardClient />
    </>
  );
}
