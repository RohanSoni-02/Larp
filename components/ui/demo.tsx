import React from "react"

import { LeaderboardCard } from "@/components/ui/leaderboard-card"

export default function DemoOne() {
  return (
    <LeaderboardCard
      title="Weekly Leaderboard"
      fromDate="2026-05-01"
      toDate="2026-05-07"
      currentUserId="u-5"
      podiumRankings={[
        {
          userId: "u-1",
          userName: "Ava Elizabeth Turner",
          rank: 1,
          value: 289400,
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-2",
          userName: "Leo Harrison",
          rank: 2,
          value: 251800,
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-3",
          userName: "Rowan Elijah",
          rank: 3,
          value: 238300,
          avatarUrl:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
        },
      ]}
      rankings={[
        {
          userId: "u-1",
          rank: 1,
          userName: "Ava Elizabeth Turner",
          byline: "Level 42 – Diamond",
          value: 289400,
          displayed: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-2",
          rank: 2,
          userName: "Leo Harrison",
          byline: "Level 39 – Platinum",
          value: 251800,
          displayed: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-3",
          rank: 3,
          userName: "Rowan Elijah",
          byline: "Level 35 – Gold",
          value: 238300,
          displayed: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-4",
          rank: 4,
          userName: "Maya Chen",
          byline: "Level 31 – Silver",
          value: 198700,
          displayed: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
        },
        {
          userId: "u-5",
          rank: 5,
          userName: "You",
          byline: "Level 28 – Bronze",
          value: 156200,
          displayed: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
        },
      ]}
    />
  )
}
