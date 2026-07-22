import VisitDetailPage from "@/components/restaurants/visit-detail-page";

type VisitDetailRouteProps = {
  params: Promise<{
    visitId: string;
  }>;
};

export default async function VisitDetailRoute({ params }: VisitDetailRouteProps) {
  const { visitId } = await params;

  return <VisitDetailPage visitId={visitId} />;
}
