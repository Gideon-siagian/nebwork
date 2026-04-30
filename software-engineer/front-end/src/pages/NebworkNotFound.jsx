import { Link } from "react-router-dom";

import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NebworkNotFound() {
  return (
    <AppShell
      title="Page not found"
      description="Halaman yang dicari belum tersedia di prototipe frontend Nebwork."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
          <Link to="/">Back to home</Link>
        </Button>
      }
    >
      <Card className="mx-auto max-w-2xl bg-white/[0.85]">
        <CardHeader>
          <CardTitle className="text-3xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Route ini belum dimasukkan ke demo frontend. Gunakan navigasi kiri untuk menjelajahi Home Feed, Editor,
            AI Assistant, Projects, dan Analytics.
          </p>
          <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
            <Link to="/">Return to Nebwork</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
