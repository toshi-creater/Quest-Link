import { notFound } from "next/navigation";
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
          user: { select: { username: true, iconUrl: true, avgRating: true } },
        },
      },
    },
  });
  if (!room) notFound();

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
      user: { select: { id: true, username: true, iconUrl: true } },
    },
  });

  const initialMessages: ChatMessage[] = rawMessages.map((m) => ({
    id: m.id,
    roomId,
    user: m.user ?? null,
    content: m.content,
    isSystem: m.isSystem,
    createdAt: m.createdAt,
  }));

  const initialParticipants: Participant[] = room.participants.map((p) => ({
    userId: p.userId,
    isHost: p.isHost,
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
      initialMessages={initialMessages}
      initialParticipants={initialParticipants}
      roomInfo={{ title: room.title, maxPlayers: room.maxPlayers, game: room.game, tags }}
    />
  );
}
