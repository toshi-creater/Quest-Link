import { RoomDetailView } from "./RoomDetailView";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params;
  return <RoomDetailView roomId={roomId} />;
}
