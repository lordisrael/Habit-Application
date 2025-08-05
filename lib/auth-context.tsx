import { createContext, useContext, useEffect, useState } from "react";
import { Models, ID } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Here you can implement your authentication logic
  // For example, you can use context to provide auth state and functions
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch user data when the component mounts
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      console.error("Failed to fetch user data:", error); 
      setUser(null);
    } finally {
      setIsLoading(false);
    }

  }


  const signUp = async (email: string, password: string) => {
    // Implement sign-up logic here
    try {
        account.create(ID.unique(), email, password)
        await signIn(email, password);
        return null; // Return null if sign-up is successful
    } catch (error) {
        if (error instanceof Error) {
            return error.message; // Return error message if sign-up fails
        }
        return "An unknown error occurred"; // Fallback error message
    }
  }

  const signIn = async (email: string, password: string) => {
    // Implement sign-in logic here
    try {
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        setUser(session); // Update user state on successful sign-in
        return null; // Return null if sign-in is successful
    } catch (error) {
        if (error instanceof Error) {
            return error.message; // Return error message if sign-in fails
        }
        return "An unknown error occurred"; // Fallback error message
    }
  }

  const signOut = async () => {
    // Implement sign-out logic here
    try {
      await account.deleteSession("current");
      setUser(null); // Clear user state on sign-out
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }

  return (
    <AuthContext.Provider value={{user, isLoading,  signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}