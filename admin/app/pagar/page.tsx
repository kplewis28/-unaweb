import { Suspense } from "react";
import PagarClient from "./PagarClient";

export default function PagarPage() {
  return (
    <Suspense>
      <PagarClient />
    </Suspense>
  );
}
