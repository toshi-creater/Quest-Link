import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function CurrentRoomChatPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const participant = await prisma.roomParticipant.findFirst({
    where: { userId, leftAt: null, room: { status: { not: "closed" } } },
    select: { roomId: true },
  });

  if (!participant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <p className="text-gray-400 text-lg">参加中の部屋がありません</p>
        <Link
          href="/rooms"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          部屋を探す
        </Link>
      </div>
    );
  }

  redirect(`/rooms/${participant.roomId}/chat`);
}
