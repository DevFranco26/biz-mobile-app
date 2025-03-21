// app/(tabs)/(settings)/(management)/manage-locations.jsx

"use client";

import React from "react";
import { View, Text } from "react-native";

function ManageLocations() {
  return (
    <View>
      <Text>ManageLocations</Text>
    </View>
  );
}

export default ManageLocations;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   Alert,
//   Pressable,
//   RefreshControl,
//   Modal,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
//   Keyboard,
//   ScrollView,
// } from "react-native";
// import useThemeStore from "../../../../store/themeStore";
// import useLocationsStore from "../../../../store/locationsStore";
// import { useRouter } from "expo-router";
// import * as SecureStore from "expo-secure-store";
// import { Ionicons } from "@expo/vector-icons";
// import { SafeAreaView } from "react-native-safe-area-context";
// import MapView, { Marker } from "react-native-maps";

// const Locations = () => {
//   const { theme } = useThemeStore();
//   const isLightTheme = theme === "light";
//   const router = useRouter();
//   const { locations, loading, error, fetchLocations, createLocation, updateLocation, deleteLocation } = useLocationsStore();
//   const [refreshing, setRefreshing] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [label, setLabel] = useState("");
//   const [latitude, setLatitude] = useState("");
//   const [longitude, setLongitude] = useState("");
//   const [radius, setRadius] = useState("");
//   const [selectedCoordinate, setSelectedCoordinate] = useState(null);

//   useEffect(() => {
//     const initialize = async () => {
//       const token = await SecureStore.getItemAsync("token");
//       if (token) {
//         await fetchLocations(token);
//       } else {
//         Alert.alert("Authentication Error", "Please sign in again.");
//         router.replace("(auth)/login-user");
//       }
//     };
//     initialize();
//   }, []);

//   const onRefresh = async () => {
//     const token = await SecureStore.getItemAsync("token");
//     if (token) {
//       setRefreshing(true);
//       await fetchLocations(token);
//       setRefreshing(false);
//     }
//   };

//   const handleLocationAction = (location) => {
//     Alert.alert("Location Actions", `Choose an action for the location "${location.label}".`, [
//       { text: "Cancel", style: "cancel" },
//       { text: "Edit", onPress: () => openEditLocationModal(location) },
//       { text: "Delete", onPress: () => handleDeleteLocation(location.id) },
//     ]);
//   };

//   const openAddLocationModal = () => {
//     setCurrentLocation(null);
//     setLabel("");
//     setLatitude("");
//     setLongitude("");
//     setRadius("");
//     setSelectedCoordinate(null);
//     setModalVisible(true);
//   };

//   const openEditLocationModal = (location) => {
//     setCurrentLocation(location);
//     setLabel(location.label);
//     setLatitude(location.latitude.toString());
//     setLongitude(location.longitude.toString());
//     setRadius(location.radius.toString());
//     setSelectedCoordinate({
//       latitude: parseFloat(location.latitude),
//       longitude: parseFloat(location.longitude),
//     });
//     setModalVisible(true);
//   };

//   const handleSaveLocation = async () => {
//     const token = await SecureStore.getItemAsync("token");
//     if (!token) {
//       Alert.alert("Authentication Error", "Please sign in again.");
//       router.replace("(auth)/login-user");
//       return;
//     }
//     if (!label || !latitude || !longitude || !radius) {
//       Alert.alert("Validation Error", "All fields are required.");
//       return;
//     }
//     const locationData = {
//       label,
//       latitude: parseFloat(latitude),
//       longitude: parseFloat(longitude),
//       radius: parseInt(radius, 10),
//     };
//     try {
//       let result;
//       if (currentLocation) {
//         result = await updateLocation(currentLocation.id, locationData, token);
//       } else {
//         result = await createLocation(locationData, token);
//       }
//       if (result.success) {
//         Alert.alert("Success", currentLocation ? "Location updated successfully." : "Location created successfully.");
//         setModalVisible(false);
//         await fetchLocations(token);
//       } else {
//         Alert.alert("Error", result.message || (currentLocation ? "Failed to update location." : "Failed to create location."));
//       }
//     } catch (err) {
//       console.error("Error saving location:", err);
//       Alert.alert("Error", "An unexpected error occurred.");
//     }
//   };

//   const handleDeleteLocation = async (locationId) => {
//     const token = await SecureStore.getItemAsync("token");
//     if (token) {
//       try {
//         const result = await deleteLocation(locationId, token);
//         if (result.success) {
//           Alert.alert("Success", "Location deleted successfully.");
//           await fetchLocations(token);
//         } else {
//           Alert.alert("Error", result.message || "Failed to delete location.");
//         }
//       } catch (err) {
//         console.error("Error deleting location:", err);
//         Alert.alert("Error", "An unexpected error occurred.");
//       }
//     } else {
//       Alert.alert("Authentication Error", "Please sign in again.");
//       router.replace("(auth)/login-user");
//     }
//   };

//   const handleMapPress = (e) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     setSelectedCoordinate({ latitude, longitude });
//     setLatitude(latitude.toFixed(6));
//     setLongitude(longitude.toFixed(6));
//   };

//   const renderItem = ({ item }) => {
//     const creator = item.admin ? item.admin.email : "Unknown";
//     const editor = item.lastEditor ? item.lastEditor.email : "Not edited";
//     return (
//       <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
//         <View className="flex-row items-center flex-1">
//           <Ionicons name="location-outline" size={40} color={isLightTheme ? "#4b5563" : "#d1d5db"} />
//           <View className="ml-3 flex-1">
//             <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>{item.label}</Text>
//             <View className="flex-row items-center">
//               <Ionicons name="navigate-outline" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} className="mr-1" />
//               <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Latitude: {item.latitude}</Text>
//             </View>
//             <View className="flex-row items-center mt-1">
//               <Ionicons name="navigate-outline" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} className="mr-1" />
//               <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Longitude: {item.longitude}</Text>
//             </View>
//             <View className="flex-row items-center mt-1">
//               <Ionicons name="radio-button-off-outline" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} className="mr-1" />
//               <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Radius: {item.radius} meters</Text>
//             </View>
//             <View className="flex-row items-center mt-1">
//               <Ionicons name="person-add-outline" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} className="mr-1" />
//               <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{creator}</Text>
//             </View>
//             <View className="flex-row items-center mt-1">
//               <Ionicons name="create-outline" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} className="mr-1" />
//               <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{editor}</Text>
//             </View>
//           </View>
//         </View>
//         <Pressable onPress={() => handleLocationAction(item)} className="p-2">
//           <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? "#1f2937" : "#f9fafb"} />
//         </Pressable>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} edges={["top"]}>
//       <View className="flex-row items-center px-4 py-3">
//         <Pressable onPress={() => router.back()} className="mr-2">
//           <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333" : "#fff"} />
//         </Pressable>
//         <Text className={`text-lg font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Locations</Text>
//       </View>
//       <View className="flex-row justify-between items-center px-4 mb-4">
//         <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Locations</Text>
//         <Pressable
//           onPress={openAddLocationModal}
//           className={`p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-900"}`}
//           accessibilityLabel="Add Location"
//           accessibilityHint="Opens a form to add a new location"
//         >
//           <Ionicons name="add" size={24} color={isLightTheme ? "#1e293b" : "#cbd5e1"} />
//         </Pressable>
//       </View>
//       {loading ? (
//         <ActivityIndicator size="large" color="#475569" className="mt-12" />
//       ) : (
//         <FlatList
//           data={locations}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderItem}
//           contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#475569"]} tintColor={isLightTheme ? "#475569" : "#f9fafb"} />
//           }
//           ListEmptyComponent={
//             <Text className={`text-center mt-12 text-lg ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>No locations available.</Text>
//           }
//         />
//       )}
//       <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
//         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//           <View className={`flex-1 justify-center items-center  ${isLightTheme ? "bg-slate-950/70" : "bg-slate-950/70"}`}>
//             <KeyboardAvoidingView
//               behavior={Platform.OS === "ios" ? "padding" : "height"}
//               className="w-11/12"
//               keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
//             >
//               <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
//                 <View className={`p-6 rounded-lg ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
//                   <Text className={`text-xl font-bold mb-4 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
//                     {currentLocation ? "Edit Location" : "Add Location"}
//                   </Text>
//                   <Text className={`text-base  ${isLightTheme ? "text-slate-800" : "text-slate-300"} mb-1`}>Location Name</Text>
//                   <TextInput
//                     className={`w-full p-3 mb-2 rounded-lg border ${
//                       isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
//                     }`}
//                     value={label}
//                     onChangeText={setLabel}
//                     placeholder="e.g., Main Office"
//                     placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
//                   />
//                   <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Select Location on Map</Text>
//                   <Text className={`text-sm mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
//                     Tap on the map to drop a pin, or drag the pin to adjust the location.
//                   </Text>
//                   <View style={{ height: 300, width: "100%" }} className="mb-3 rounded-lg overflow-hidden">
//                     <MapView
//                       style={{ flex: 1 }}
//                       initialRegion={{
//                         latitude: selectedCoordinate ? selectedCoordinate.latitude : 37.78825,
//                         longitude: selectedCoordinate ? selectedCoordinate.longitude : -122.4324,
//                         latitudeDelta: 0.005,
//                         longitudeDelta: 0.005,
//                       }}
//                       onPress={handleMapPress}
//                       showsUserLocation={true}
//                       showsMyLocationButton={true}
//                     >
//                       {selectedCoordinate && (
//                         <Marker
//                           coordinate={selectedCoordinate}
//                           draggable
//                           onDragEnd={(e) => {
//                             const { latitude, longitude } = e.nativeEvent.coordinate;
//                             setSelectedCoordinate({ latitude, longitude });
//                             setLatitude(latitude.toFixed(6));
//                             setLongitude(longitude.toFixed(6));
//                           }}
//                         />
//                       )}
//                     </MapView>
//                   </View>
//                   <View className="flex-row gap-2 my-3 justify-center items-center">
//                     <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Latitude:</Text>
//                     <TextInput
//                       className={` p-3 mb-2 rounded-lg border ${
//                         isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
//                       }`}
//                       value={latitude}
//                       onChangeText={setLatitude}
//                       placeholder="e.g., 37.7749"
//                       keyboardType="numeric"
//                       placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
//                       editable={false}
//                     />
//                     <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Longitude:</Text>
//                     <TextInput
//                       className={` p-3 mb-2 rounded-lg border ${
//                         isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
//                       }`}
//                       value={longitude}
//                       onChangeText={setLongitude}
//                       placeholder="e.g., -122.4194"
//                       keyboardType="numeric"
//                       placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
//                       editable={false}
//                     />
//                   </View>
//                   <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Radius (meters)</Text>
//                   <TextInput
//                     className={`w-full p-3 mb-2 rounded-lg border ${
//                       isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
//                     }`}
//                     value={radius}
//                     onChangeText={setRadius}
//                     placeholder="e.g., 500"
//                     keyboardType="numeric"
//                     placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
//                   />
//                   <View className="flex-row justify-end items-center mt-6">
//                     <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4">
//                       <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-400"}`}>Cancel</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={handleSaveLocation} className="bg-orange-500/90 p-3 rounded-lg">
//                       <Text className="text-white font-semibold">Confirm</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </ScrollView>
//             </KeyboardAvoidingView>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default Locations;
