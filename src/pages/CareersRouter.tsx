import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const PwrCareers = lazy(() => import("./PwrCareers"));
const CareersPage = lazy(() => import("./CareersPage"));

const Fallback = () => (
  <div className="container mx-auto px-4 py-8 space-y-4">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
);

/**
 * Routes /carreiras/:slug to the PWR-branded page when slug === 'pwr-gestao',
 * otherwise renders the generic CareersPage.
 */
export default function CareersRouter() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <Suspense fallback={<Fallback />}>
      {slug === "pwr-gestao" ? <PwrCareers /> : <CareersPage />}
    </Suspense>
  );
}