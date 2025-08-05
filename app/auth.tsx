import { useAuth } from "@/lib/auth-context";
import { use, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");  
  const [error, setError] = useState<string | null>("");

  const theme = useTheme();
  const router = useRouter();

  const { signUp, signIn } = useAuth();
  const handleAuth = async () => {
    if(!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if(password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null); // Clear previous errors

    if (isSignUp) {
      const signUpError = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
      } else {
        router.replace("/"); // Redirect to home on successful sign-up
      }
    } else {
      const signInError = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      } else {
        router.replace("/"); // Redirect to home on successful sign-in
      }
    }
    
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "height" : "padding"}
      keyboardVerticalOffset={100}
      contentContainerStyle={styles.container}
    >
        <View style={styles.content}>
            <Text style={styles.title} variant="headlineMedium">{isSignUp ? "Create Account" : "Welcome back"}</Text>
            <TextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter your email"
              mode="outlined"
              style={styles.input}
              onChangeText={setEmail}
            />

            <TextInput
              label="Password"
              autoCapitalize="none"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              onChangeText={setPassword}
            />

            {error ? <Text style={{ color: theme.colors.error}}>{error}</Text> : null}{}

            <Button mode="contained" style={styles.button} onPress={handleAuth}>{isSignUp ? "Sign Up" : "Sign In"}</Button>
            <Button mode="text" onPress={handleSwitchMode} style={styles.switchButton}>{isSignUp ? "Already have an account? Sign In" : "Don't have account? Sign Up"}</Button>
        </View>
      {/* Your authentication components go here */}
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  }, 
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
    alignSelf: "center",
  },
})