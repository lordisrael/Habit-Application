import { client, DATABASEID, databases, HABIT_COLLECTION_ID, HABIT_COMPLETION_COLLECTION_ID, realTimeResponse } from '@/lib/appwrite';
import { useEffect, useState } from 'react';
import { View, StyleSheet,} from 'react-native';
import { Query } from 'react-native-appwrite';
import { Habit, HabitCompletion } from "@/types/database.type";
import { useAuth } from '@/lib/auth-context';
import {Card, Text} from "react-native-paper";
import { ScrollView } from 'react-native-gesture-handler';


export default function StreaksScreen() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>();



  useEffect(() => {
    if (!user) return;
    const channel = `databases.${DATABASEID}.collections.${HABIT_COLLECTION_ID}.documents`;
    const habitsSubscription = client.subscribe(
      channel,
      (response: realTimeResponse) => {
        if (
          response.events.includes("databases.*.collections.*.documents.*.create")
        ) {
          fetchHabits()
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")
        ) {
          fetchHabits()
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")
        ) {
          fetchHabits()
        }
      }
    );

    const completedChannel = `databases.${DATABASEID}.collections.${HABIT_COMPLETION_COLLECTION_ID}.documents`;
    const completionsSubscription = client.subscribe(
      completedChannel,
      (response: realTimeResponse) => {
        if (
          response.events.includes("databases.*.collections.*.documents.*.create")
        ) {
          fetchCompletions()
        }
      }
    );
    fetchHabits();
    fetchCompletions();
    return () => {
      habitsSubscription();
      completionsSubscription();
    }
  }, [user])

  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASEID,
        HABIT_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      //console.log(response.documents);
      setHabits(response.documents as Habit[])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchCompletions = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASEID,
        HABIT_COMPLETION_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      //console.log(response.documents);
      const completions = response.documents as HabitCompletion[]
      setCompletedHabits(completions)
    } catch (error) {
      console.error(error)
    }
  }

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  // const getStreakData = (habitId: string) => {
  //   const habitCompletions = completedHabits?.filter(
  //     (c) => c.habit_id === habitId
  //   ).sort(
  //     (a, b) =>
  //       new Date(a.completed_at).getTime() -
  //       new Date(b.completed_at).getTime()
  //   )
  //   if (habitCompletions?.length === 0) {
  //     return {
  //       streak: 0, bestStreak: 0, total: 0
  //     }
  //   }

  //   let streak = 0;
  //   let bestStreak = 0;
  //   let total = habitCompletions?.length;

  //   let lastDate: Date | null = null;
  //   let currentStreak = 0;

  //   habitCompletions?.forEach((c) => {
  //     const date = new Date(c.completed_at)
  //     if(lastDate) {
  //       const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)

  //       if(diff <= 1.5) {
  //         currentStreak += 1;
  //       } else {
  //         currentStreak = 1;
  //       }
  //     } else {
  //        currentStreak = 1;
  //     }
  //       if(currentStreak > bestStreak) bestStreak = currentStreak
  //       streak = currentStreak
  //       lastDate = date

  //   });
  //   return {
  //     streak, bestStreak, total
  //   }

  // }

  const getStreakData = (habitId: string) => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
      );

    if (!habitCompletions || habitCompletions.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    let bestStreak = 1;
    let currentStreak = 1;
    let total = habitCompletions.length;

    for (let i = 1; i < habitCompletions.length; i++) {
      const prevDate = new Date(habitCompletions[i - 1].completed_at);
      const currDate = new Date(habitCompletions[i].completed_at);
      const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diff <= 1.5) {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    // If the last completion was today or yesterday, streak = currentStreak, else streak = 0
    const lastCompletionDate = new Date(habitCompletions[habitCompletions.length - 1].completed_at);
    const now = new Date();
    const daysSinceLast = (now.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24);
    const streak = daysSinceLast <= 1.5 ? currentStreak : 0;

    return { streak, bestStreak, total };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, total }
  })

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);
  //console.log(rankedHabits.map((h) => h.habit));

  const badgesStyles = [ styles.badge1, styles.badge2, styles.badge3 ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Streaks</Text>
      {rankedHabits.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🎖️ Top streaks</Text>
          {rankedHabits.slice(0, 3).map(({ habit, streak, bestStreak, total }, key) => (
            <View key={key} style={styles.rankingRow}>
              <View style={[styles.rankingBadge, badgesStyles[key]]}>
                <Text style={styles.rankingBadgeText}>{key + 1}</Text>
              </View>
              <Text variant="titleMedium" style={styles.rankingHabitTitle}>{habit.title}</Text>
              <Text style={styles.rankingBestStreak}>{bestStreak}</Text>
            </View>
          ))}
        </View>
      )}
      {habits.length === 0 ?  (
         <View style={styles.emptyState}>
         <Text style={styles.emptyStateText}>No habits found</Text>
         </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        {rankedHabits.map(({habit, streak, bestStreak, total}, key) => ( 
        <Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitDescription}>{habit.description}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsCurrent}>
                <Text style={styles.statsText}> 🔥{" "}{streak}</Text>
                <Text style={styles.statsLabel}>Current</Text>
              </View>
              <View style={styles.statsBest}>
                <Text style={styles.statsText}> 🏆{" "}{bestStreak}</Text>
                <Text style={styles.statsLabel}>Best</Text>
              </View>
              <View style={styles.statsTotal}>
                <Text style={styles.statsText}> ✅{" "}{total}</Text>
                <Text style={styles.statsLabel}>Total</Text>
              </View>
            </View>
          </Card.Content>
        </Card>))}
        </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 22,
    color: '#888',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#7c4dff', // Highlight the first card
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  habitDescription: {
    color: '#6c6c6c',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom:12,
    marginTop: 8,
  },
  statsCurrent: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  statsBest: {
     backgroundColor: '#fffde7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  statsTotal: {
     backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  statsText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#22223b',
  },
  statsLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  badge1: {
    backgroundColor: '#ffd700',
  },  
  badge2: {
    backgroundColor: '#c0c0c0',
  },
  badge3: {
    backgroundColor: '#cd7f32',
  },
  rankingContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#7c4dff',
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  rankingBadgeText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankingHabitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  rankingBestStreak: {
    fontSize: 14,
    color: '#7c4dff',
  },
});