import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useCallback, useContext, useEffect, useState } from "react"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import InputComponent from "../../Components/InputComponent"
import SearchCard from "../../Components/SearchCard"
import axios from "axios"
import { REACT_APP_BASE_URL } from "../../Config/config"
import { address } from "../../Routes/addresses"
import { AppStore } from "../../Context/AppContext"
import { useFocusEffect } from "@react-navigation/native"
import { getDBConnection, saveAccounts, searchOfflineAccounts } from "../../Database/db-service"

const FindAccountScreen = ({ navigation }) => {
  const [searchValue, changeSearchValue] = useState(() => "")
  const [userBankDetails, setUserBankDetails] = useState(() => [])
  const [isLoading, setIsLoading] = useState(false)

  const { userId, bankId, branchCode, isOffline } = useContext(AppStore)

  // Debounce handled via useEffect below



  const fetchBankDetails = async () => {
    setIsLoading(true)

    // Handle offline search
    // if (isOffline) {
    // console.log("Searching details locally (Offline)")
    try {
      const db = await getDBConnection()
      const localAccounts = await searchOfflineAccounts(db, searchValue, "D")
      setUserBankDetails(localAccounts)
    } catch (err) {
      console.error("Error searching local DB:", err)
      setUserBankDetails([])
    }
    setIsLoading(false)
    return
    // }

    // const obj = {
    //   bank_id: bankId,
    //   branch_code: branchCode,
    //   agent_code: userId,
    //   account_number: searchValue,
    //   flag: "D",
    // }
    // // console.log(bankId, branchCode, userId, searchValue)
    // // console.log("XXDXDXDXDXDXDXDXDXDXDXDX", userBankDetails)

    // try {
    //   const res = await axios.post(address.SEARCH_ACCOUNT, obj, {
    //     headers: { Accept: "application/json" },
    //   })
    //   setIsLoading(false)
    //   const accounts = res?.data?.success?.msg || []
    //   console.log(accounts)
    //   const filteredAccounts = accounts.filter(acc => acc?.acc_type?.toUpperCase() === "D");
    //   // console.log("bank details fetched from server", filteredAccounts)
    //   setUserBankDetails(filteredAccounts)

    //   // Save to local DB for future offline use
    //   if (filteredAccounts.length > 0) {
    //     const db = await getDBConnection()
    //     await saveAccounts(db, filteredAccounts, "D")
    //   }
    // } catch (err) {
    //   setIsLoading(false)
    //   setUserBankDetails([])
    //   console.log("error: " + err?.response?.data)
    // }
  }

  // Debounce search: trigger fetch when user stops typing
  useEffect(() => {
    if (!searchValue) {
      setUserBankDetails([]);
      setIsLoading(false);
      return;
    }
    const handler = setTimeout(() => {
      fetchBankDetails();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  useFocusEffect(
    useCallback(() => {
      // alert('Screen was focused')
      return () => {
        // alert('Screen was unfocused')
        // // Useful for cleanup functions
        changeSearchValue("")
        setUserBankDetails([])
      }
    }, []),
  )
  // console.log('isLoading '+isLoading)
  return (
    // <View>
    //   <CustomHeader />
    //   <View style={styles.container}>
    //     {/* Account Cards */}
    //     <Text style={styles.title}>Daily</Text>
    //     {/* {isLoading} */}
    //     {isLoading && (
    //       <ActivityIndicator
    //         color={COLORS.lightScheme.primary}
    //         style={styles.loading}
    //         size={"large"}
    //       />
    //     )}

    //     <ScrollView
    //       style={{ maxHeight: "60%" }}
    //       keyboardShouldPersistTaps="handled">
    //       {userBankDetails &&
    //         userBankDetails?.map((props, index) => {
    //           console.log("========================", props)
    //           return (
    //             <SearchCard
    //               item={props}
    //               index={index}
    //               navigation={navigation}
    //               key={index}
    //               flag={"D"}
    //             />
    //           )
    //         })}
    //     </ScrollView>
    //     {/* Search Component */}
    //     <View style={styles.searchContainer}>
    //       <InputComponent
    //         label={"Account No. / Name"}
    //         placeholder={"Enter Account No. / Name"}
    //         value={searchValue}
    //         handleChange={changeSearchValue}
    //         autoFocus={true}
    //       />
    //     </View>
    //   </View>
    // </View>

    //     <View style={styles.container}>
    //   <Text style={styles.title}>Daily</Text>

    //   <View style={styles.searchContainer}>
    //     <InputComponent
    //       label={"Account No. / Name"}
    //       placeholder={"Enter Account No. / Name"}
    //       value={searchValue}
    //       handleChange={changeSearchValue}
    //       autoFocus={true}
    //     />
    //   </View>

    //   {isLoading && (
    //     <ActivityIndicator
    //       color={COLORS.lightScheme.primary}
    //       style={styles.loading}
    //       size="large"
    //     />
    //   )}

    //   <ScrollView
    //     style={styles.listArea}
    //     contentContainerStyle={styles.listContent}
    //     keyboardShouldPersistTaps="handled"
    //     showsVerticalScrollIndicator={false}
    //   >
    //     {userBankDetails?.map((props, index) => (
    //       <SearchCard
    //         item={props}
    //         index={index}
    //         navigation={navigation}
    //         key={index}
    //         flag={"D"}
    //       />
    //     ))}
    //   </ScrollView>
    // </View>
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        {/* <View style={styles.hero}>
          <View>
            <Text style={styles.heroSmall}>Search and manage</Text>
            <Text style={styles.heroTitle}>Daily Accounts</Text>
            <Text style={styles.heroSub}>Find customer records quickly</Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {userBankDetails?.length || 0} Results
            </Text>
          </View>
        </View> */}

        <View style={styles.searchContainer}>
          <InputComponent
            // label={"Account No. / Name"}
            placeholder={"Daily Accounts (Account No. / Name)"}
            value={searchValue}
            handleChange={changeSearchValue}
            autoFocus={true}
            isLoading={isLoading}
          />
          {/* <View style={styles.heroBadge}> */}

          {/* </View> */}
        </View>
        <Text style={styles.heroBadgeText}>
          {userBankDetails?.length || 0} Results
        </Text>
        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {userBankDetails?.map((props, index) => (
            <SearchCard
              item={props}
              index={index}
              navigation={navigation}
              key={index}
              flag={"D"}
            />
          ))}
        </ScrollView>
      </View>
    </View>

  )
}

export default FindAccountScreen

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: COLORS.lightScheme.background,
//     height: "100%",
//     padding: 10,
//   },
//   searchContainer: {
//     position: "absolute",
//     bottom: 130,
//     width: "100%",
//     alignSelf: "center",
//     borderColor: COLORS.lightScheme.primary,
//     borderWidth: 2,
//     backgroundColor: COLORS.lightScheme.onPrimary,
//     padding: 20,
//     borderRadius: 10,
//     elevation: 10,
//   },
//   title: {
//     textAlign: "center",
//     fontSize: 20,
//     fontWeight: "900",
//     color: COLORS.lightScheme.tertiaryContainer,
//     // alignSelf: 'center',
//     letterSpacing: 4,
//     backgroundColor: COLORS.lightScheme.primary,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   loading: {
//     color: COLORS.lightScheme.tertiaryContainer,
//     marginTop: 50,
//   },
// })

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eef2f5ff",
  },
  container: {
    flex: 1,
    backgroundColor: "#eef2f5ff",
    // paddingHorizontal: 12,
    // paddingTop: 10,
  },
  hero: {
    backgroundColor: "#0B1F2A",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 12,
  },
  heroSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(217,184,92,0.12)",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.35)",
  },
  heroBadgeText: {
    fontSize: 11,
    padding: 2,
    paddingHorizontal: 15,
    fontWeight: "800",

    color: "#9fa1a1ff",
    letterSpacing: 0.8,
    textTransform: "uppercase",

  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    // borderRadius: 15,
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,129,129,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 12,
  },
  loading: {
    marginTop: 10,
    marginBottom: 8,
  },
  listArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
});