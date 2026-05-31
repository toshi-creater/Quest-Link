import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type ChatMessage, type Participant } from "@/lib/stores/chatStore";
import { ChatView } from "./ChatView";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { roomId } = await params;

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const cookieStore = await cookies();
  const currentGuestSessionId = cookieStore.get("quest_link_guest_session")?.value ?? null;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      title: true,
      maxPlayers: true,
      game: { select: { id: true, name: true } },
      playStyleTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      participants: {
        where: { leftAt: null },
        select: {
          userId: true,
          isHost: true,
          guestSessionId: true,
          user: { select: { username: true, iconUrl: true, avgRating: true } },
        },
      },
    },
  });
  if (!room) notFound();

  // ゲスト参加者の displayName を Guest テーブルから一括取得
  const guestSessionIds = room.participants
    .map((p) => p.guestSessionId)
    .filter((id): id is string => id !== null);
  const guestRecords =
    guestSessionIds.length > 0
      ? await prisma.guest.findMany({
          where: { guestSessionId: { in: guestSessionIds } },
          select: { guestSessionId: true, displayName: true },
        })
      : [];
  const guestMap = new Map(guestRecords.map((g) => [g.guestSessionId, g.displayName]));

  const tags = room.playStyleTags.map((t) => t.tag);

  const rawMessages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      content: true,
      isSystem: true,
      createdAt: true,
      guest: { select: { guestSessionId: true, displayName: true } },
      user: { select: { id: true, username: true, iconUrl: true } },
    },
  });

  const initialMessages: ChatMessage[] = rawMessages.map((m) => ({
    id: m.id,
    roomId,
    user: m.user ?? null,
    displayName: m.guest?.displayName ?? undefined,
    guestSessionId: m.guest?.guestSessionId ?? undefined,
    content: m.content,
    isSystem: m.isSystem,
    createdAt: m.createdAt,
  }));

  const initialParticipants: Participant[] = room.participants.map((p) => ({
    userId: p.userId,
    isHost: p.isHost,
    displayName: p.guestSessionId ? (guestMap.get(p.guestSessionId) ?? undefined) : undefined,
    guestSessionId: p.guestSessionId ?? undefined,
    user: p.user
      ? {
          username: p.user.username,
          iconUrl: p.user.iconUrl,
          avgRating: p.user.avgRating !== null ? Number(p.user.avgRating) : null,
        }
      : null,
  }));

  return (
    <ChatView
      roomId={room.id}
      currentUserId={currentUserId}
      currentGuestSessionId={currentGuestSessionId}
      initialMessages={initialMessages}
      initialParticipants={initialParticipants}
      roomInfo={{ title: room.title, maxPlayers: room.maxPlayers, game: room.game, tags }}
    />
  );
}
