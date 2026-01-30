import { redirect } from "next/navigation";

export default function Home() {
  // Simple landing behavior: send users straight into the app.
  // /strategies is protected and will redirect to /login when logged out.
  redirect("/strategies");
}
