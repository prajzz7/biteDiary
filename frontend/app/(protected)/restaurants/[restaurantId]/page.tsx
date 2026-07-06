import RestaurantDetailPage from "@/components/restaurants/restaurant-detail-page";

type RestaurantDetailRouteProps = {
  params: Promise<{
    restaurantId: string;
  }>;
};

export default async function RestaurantDetailRoute({
  params,
}: RestaurantDetailRouteProps) {
  const { restaurantId } = await params;

  return <RestaurantDetailPage restaurantId={restaurantId} />;
}
