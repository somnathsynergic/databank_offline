import SQLite from 'react-native-sqlite-storage';
import React, { useEffect, useContext } from "react";
import { LoaderOverlay } from './src/Components/LoaderOverlay';
import { AppStore } from './src/Context/AppContext';
import { StyleSheet } from "react-native";
import MainNavigation from "./src/Navigation/MainNavigation";
import AppContext from "./src/Context/AppContext";

const SyncOverlay = () => {
  const { syncLoading } = useContext(AppStore);
  return <LoaderOverlay visible={syncLoading} message="Syncing agent data…" />;
};
import { initDatabase } from "./src/Database/db-service";

const App = () => {
  useEffect(() => {
    const setupDB = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("SQLite Database initialization failed:", error);
      }
    };
    setupDB();
  }, []);


  return (
    <>
      <AppContext>
        <MainNavigation />
        <SyncOverlay />
      </AppContext>
    </>
  );
}

export default App

const styles = StyleSheet.create({})
