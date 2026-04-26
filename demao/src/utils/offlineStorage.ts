import { NetInfoState } from "@react-native-community/netinfo"; // Mocked type
// In real app: import NetInfo from "@react-native-community/netinfo";

export const isOnline = async (): Promise<boolean> => {
    // const state = await NetInfo.fetch();
    // return state.isConnected ?? false;
    return true; // Mocked for now
};

// Firestore persistence handles most offline logic automatically.
// Use this utility if you need to manually block features (e.g. initial login).
