import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CurrentRoomsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const participation = await prisma.roomParticipant.findFirst({
    where: { userId: session.user.id, leftAt: null },
    select: { roomId: true },
  });

  if (participation) {
    redirect(`/rooms/${participation.roomId}`);
  }

  redirect("/rooms");
}
