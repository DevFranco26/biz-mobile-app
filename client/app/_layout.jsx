import { Stack } from "expo-router";
import "../global.css";
import { Button } from "react-native";

export default function RootLayout() {
  return (
    <>
      <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Biz University",
          headerShown: false,
       
        }}
      
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: "Biz University"
        }}
      />
      
       <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          title: "Biz University"
        }}
      />
    </Stack>
    </>
   
    
    
  );
}
