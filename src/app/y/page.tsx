import { redirect } from "next/navigation";

export default function YearIndexPage() {
  redirect(`/y/${new Date().getFullYear()}`);
}
