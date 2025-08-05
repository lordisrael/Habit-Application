import { View, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Button, Surface, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { client, DATABASEID, databases, HABIT_COLLECTION_ID, HABIT_COMPLETION_COLLECTION_ID, realTimeResponse } from "@/lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { useEffect, useRef, useState } from "react";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";


export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>();

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

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
          fetchTodayCompletions()
        } 
      }
    );
    fetchHabits();
    fetchTodayCompletions()
    return () => {
      habitsSubscription();
      completionsSubscription()
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

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(
        DATABASEID,
        HABIT_COMPLETION_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? ""), Query.greaterThanEqual("completed_at", today.toISOString()),]
      );
      //console.log(response.documents);
      const completions = response.documents as HabitCompletion[]
      setCompletedHabits(completions.map((c) => c.habit_id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASEID, HABIT_COLLECTION_ID, id)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    const currentDate = new Date().toISOString()
    try {
      await databases.createDocument(DATABASEID, HABIT_COMPLETION_COLLECTION_ID, ID.unique(), {
        habit_id: id,
        user_id: user.$id,
        completed_at: currentDate
      })
      const habit = habits?.find((h) => h.$id === id);
      if(!habit) return
      await databases.updateDocument(DATABASEID, HABIT_COLLECTION_ID, id, {
        streak_count: habit.streak_count +1,
        last_completed: currentDate
      })
    } catch (error) {
      console.error(error)
    }
  }

  const isHabitCompleted = (habitId : string) => completedHabits?.includes(habitId)
  

  const renderRightActions = (habitId: string) => (
    <View style={styles.swipeActionRight}>
      {isHabitCompleted(habitId) ? (
        <View style={{alignItems:"center", paddingHorizontal:12, borderRadius:18, backgroundColor:"#fff"}}> 
        <Text style={{color:"#07411bff", fontSize:18, fontWeight:"bold"}}>Completed!</Text>
        </View>
      ): (
      <MaterialCommunityIcons name="check-circle-outline" size={32} color={"#ffff"} /> 
      )}
    </View>
  )

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={32} color={"#ffff"} />
    </View>
  )



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Today's Habits</Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>Sign Out</Button>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateText}>No Habits yet. Add your first Habit</Text></View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable ref={(ref) => {
              swipeableRefs.current[habit.$id] = ref
            }}
              key={key}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else if (direction === "right") {
                  handleCompleteHabit(habit.$id)
                }
                swipeableRefs.current[habit.$id]?.close();
              }}>
              <Surface style={[styles.card, isHabitCompleted(habit.$id) && styles.cardCompleted]} elevation={0}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardContentTitle}>{habit.title}</Text>
                  <Text style={styles.cardDescription}>{habit.description}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.streakBadge}>
                      <MaterialCommunityIcons name="fire" size={18} color={"#ff9880"} />
                      <Text style={styles.streakText}>{habit.streak_count} day count</Text>
                    </View>
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>{""}{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  title: {
    fontWeight: "bold"
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  cardCompleted: {
    opacity:0.6
  },
  cardContent: {
    padding: 20
  },
  cardContentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b"
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80"
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyStateText: {
    color: "#66666"
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16
  }

})