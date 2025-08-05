import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView} from "react-native-gesture-handler";

// function RouteGuard({ children }: { children: React.ReactNode }) {
//   // Here you can add authentication logic or other checks
//   const router = useRouter();
//   const isAuthenticated = false; // Replace with your authentication logic

//   useEffect(() => {
//     if (!isAuthenticated) {
//       // Redirect to the login screen if not authenticated
//       router.replace("/auth");
//     }
//   },[isAuthenticated]);
//   return <>{children}</>;
// }

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Simulate async auth check (e.g., check token from SecureStore)
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
      isLoading ? setCheckingAuth(true) : setCheckingAuth(false); // Auth check is done
    };

    checkAuth();
  }, [user]);

  const isAuthenticated = !!user; // true if user exists

  useEffect(() => {
    const isAuthRoute = segments[0] === "auth";
    if (!checkingAuth && !isAuthenticated && !isAuthRoute) {
      router.replace("/auth");
    } else if (isAuthenticated && isAuthRoute) {
      router.replace("/");
    }
  }, [checkingAuth, isAuthenticated, segments]);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex:1}}>
    <AuthProvider>
      <PaperProvider>
        <SafeAreaProvider>
        <RouteGuard>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </RouteGuard>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  )
}
