import {Account, Client, Databases} from "react-native-appwrite";

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!) // Your Appwrite Endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!).setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!); // Your project ID


export const account = new Account(client);

export const databases = new Databases(client);
export const habitCollection = new Databases(client);

export const DATABASEID = process.env.EXPO_PUBLIC_DB_ID!;
export const HABIT_COLLECTION_ID = process.env.EXPO_PUBLIC_HABIT_COLLECTION_ID!;
export const HABIT_COMPLETION_COLLECTION_ID = process.env.EXPO_PUBLIC_HABIT_COMPLETEION_COLLECTION_ID!;
export interface realTimeResponse {
  events: string[];
  payload: any;
}

