import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { ChatInput } from "./ChatInput";

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

  const currentPlayers = room.participants.length;
  const tags = room.playStyleTags.map((t) => t.tag);

  const messages = await prisma.chatMessage.findMany({
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

  return (
    <div
      className="flex h-[calc(100vh-64px)] flex-col lg:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden w-72 shrink-0 flex-col border-r lg:flex"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Room info */}
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/rooms/${room.id}`}
            className="mb-3 flex items-center gap-2 text-xs transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            部屋の詳細へ
          </Link>
          <h2 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
            {room.title}
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {room.game.name}
          </p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <PlayStyleTag key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            参加者 {currentPlayers}/{room.maxPlayers}
          </p>
          <ul className="space-y-2.5">
            {room.participants.map((p) => {
              if (!p.user) return null;
              const { username, iconUrl, avgRating } = p.user;
              return (
                <li key={p.userId} className="flex items-center gap-2.5">
                  <div className="relative">
                    <UserAvatar username={username} iconUrl={iconUrl} size="sm" />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                      style={{
                        backgroundColor: "#22c55e",
                        borderColor: "var(--bg-card)",
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {p.isHost && <Crown className="h-3 w-3" style={{ color: "#eab308" }} />}
                      <span
                        className="truncate text-xs font-medium"
                        style={{ color: p.userId === currentUserId ? "var(--accent-light)" : "var(--text-primary)" }}
                      >
                        {username}
                      </span>
                    </div>
                    <RatingDisplay
                      avgRating={avgRating !== null ? Number(avgRating) : null}
                      ratingCount={avgRating != null ? 10 : 3}
                      size="sm"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3 lg:hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <Link href={`/rooms/${room.id}`} style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {room.title}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {currentPlayers}人参加中
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                    {msg.content}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                </div>
              );
            }

            const isMe = msg.user?.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && msg.user && (
                  <UserAvatar username={msg.user.username} iconUrl={msg.user.iconUrl} size="sm" />
                )}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!isMe && msg.user && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {msg.user.username}
                    </span>
                  )}
                  <div
                    className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      isMe
                        ? {
                            background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                            color: "#fff",
                            borderBottomRightRadius: "4px",
                          }
                        : {
                            backgroundColor: "var(--bg-card)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                            borderBottomLeftRadius: "4px",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(msg.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <ChatInput roomId={room.id} />
      </div>
    </div>
  );
}
