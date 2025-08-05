import { DATABASEID, databases, HABIT_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
import { ID } from 'react-native-appwrite';
import { Button, SegmentedButtons, TextInput, useTheme } from 'react-native-paper';


const FREQUENCIES = ["daily","weekly","monthly"]
type Frequency = (typeof FREQUENCIES)[number];


export default function AddHabitScreen() {
  const [selectedFrequency, setSelectedFrequency] = useState(FREQUENCIES[0]);
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [frequency, setFrequency] = useState<Frequency>("daily")
  const [error, setError] = useState<string>("")
  const {user} = useAuth();
  const router = useRouter();
  const theme = useTheme();

   // ✅ Clear form every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setTitle("");
      setDescription("");
      setError("");
      setFrequency("daily");
    }, [])
  );



  const handleSubmit = async () => {
  if(!user) return;
  try{
    await databases.createDocument(DATABASEID, HABIT_COLLECTION_ID, ID.unique(), {
    user_id: user.$id,
    title,
    description,
    frequency,
    streak_count: 0,
    last_completed: new Date().toISOString(),
    created_at: new Date().toISOString()
  })
  router.back();
  } catch (error) {
    if(error instanceof Error) {
       setError(error.message)
    }
    setError("There was an error creating the habit")
  }
}

  return (
    <View style={styles.container}>
        <TextInput label="Title" mode='outlined' value={title} onChangeText={setTitle} style={styles.input}/>
        <TextInput label="Description" mode='outlined' multiline numberOfLines={4} value={description} onChangeText={setDescription}  style={styles.input}/>
        <View style={styles.frequencyButtons}>
            <SegmentedButtons
                value={frequency}
                onValueChange={(value) => setFrequency(value as Frequency)}
                buttons={FREQUENCIES.map(frequency => ({
                    value: frequency,
                    label: frequency.charAt(0).toUpperCase() + frequency.slice(1),
                }))}>
            </SegmentedButtons>
        </View>
        <Button mode='contained' onPress={handleSubmit} disabled={!title || !description}>Add Habit</Button>
        {error ? <Text style={{ color: theme.colors.error}}>{error}</Text> : null}{}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    padding:16,
    backgroundColor:"f5f5f5",
    justifyContent:"center"
  },
  frequencyButtons: {
    marginBottom:24,
  },
  input: {
    marginBottom:16
  }

})