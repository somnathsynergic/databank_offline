import {
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { useCallback, useContext, useEffect, useState } from "react"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import InputComponent from "../../Components/InputComponent"
import { getDBConnection, searchOfflineAccounts } from "../../Database/db-service";
import { AppStore } from "../../Context/AppContext"
import { useFocusEffect } from "@react-navigation/native"
import SearchCardMiniStatement from "../../Components/SearchCardMiniStatement"
import { LoaderOverlay } from "../../Components/LoaderOverlay";
import { Dropdown } from "react-native-element-dropdown";


const MiniStatement = ({ navigation, item }) => {
  const [searchValue, changeSearchValue] = useState(() => "")
  const [userBankDetails, setUserBankDetails] = useState(() => [])
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [showModal, setShowModal] = useState(() => false)
  const [accountType, setAccountType] = useState(() => "")
  const [isReadonly, setReadonly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { userId, bankId, branchCode } = useContext(AppStore)

  function handleAccountSearch() {
    if (!searchValue) {
      return
    }
    fetchBankDetails()
  }
  const renderLabel = () => {
    if (accountType || focusDrop) {
      return (
        <Text style={[styles.label, focusDrop && { color: "blue" }]}>
          Select type
        </Text>
      )
    }
    return null
  }
  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  useEffect(() => {
    handleAccountSearch()
    // console.log(userBankDetails)
  }, [searchValue])

  const fetchBankDetails = async () => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const accounts = await searchOfflineAccounts(db, searchValue, accountType);
      setUserBankDetails(accounts);
      if (!accounts || accounts.length === 0) {
        ToastAndroid.showWithGravityAndOffset(
          "No data found!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
    } catch (err) {
      console.error("Error fetching bank details offline", err);
      ToastAndroid.showWithGravityAndOffset(
        "Error loading data offline",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <View>
      <CustomHeader />

      {/* Search Component */}
      {/* <View style={styles.searchContainer}>
        {renderLabel()}

        <Dropdown
          style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={data}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!focusDrop ? "Select type" : "..."}
          searchPlaceholder="Search..."
          value={accountType}
          onFocus={() => setFocusDrop(true)}
          onBlur={() => setFocusDrop(false)}
          onChange={item => {
            setReadonly(false)
            setAccountType(item?.value)
            setFocusDrop(false)
          }}
        />
        <InputComponent
          readOnly={isReadonly}
          label={"Account No. / Name"}
          placeholder={"Enter Account No. / Name"}
          value={searchValue}
          handleChange={changeSearchValue}
          autoFocus={!isReadonly}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleAccountSearch} disabled={isLoading}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View> */}

      {/* Account Cards */}
      {isLoading && (
        <ActivityIndicator
          size={"large"}
          color={COLORS.lightScheme.primary}
        />
      )}


      {/* <ScrollView> */}

      {/* Search Component */}
      <View style={styles.searchContainer}>
        {renderLabel()}

        <Dropdown
          style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={data}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!focusDrop ? "Select type" : "..."}
          searchPlaceholder="Search..."
          value={accountType}
          onFocus={() => setFocusDrop(true)}
          onBlur={() => setFocusDrop(false)}
          // onConfirmSelectItem={()=>{
          //   setReadonly(accountType?false:true)

          // }}
          onChange={item => {
            // console.log(accountType)
            setReadonly(false)
            setAccountType(item?.value)
            setFocusDrop(false)
          }}
        />
        <InputComponent
          readOnly={isReadonly}
          label={"Account No. / Name"}
          placeholder={"Enter Account No. / Name"}
          value={searchValue}
          handleChange={changeSearchValue}
          autoFocus={!isReadonly}
        />

      </View>
      <ScrollView
        style={{ maxHeight: "60%" }}
        keyboardShouldPersistTaps="handled">
        {userBankDetails &&
          userBankDetails?.map((props, index) => {
            console.log("========================", props)
            return (
              <SearchCardMiniStatement
                item={props}
                index={index}
                navigation={navigation}
                key={index}
              />
            )
          })}
      </ScrollView>
      {/* </ScrollView> */}
    </View>
    //   <CustomHeader />

    //   <View style={styles.container}>
    //     <View style={styles.hero}>
    //       <Text style={styles.heroSmall}>Reports</Text>
    //       <Text style={styles.heroTitle}>Mini Statement</Text>
    //       <Text style={styles.heroSub}>Search account and view mini statement</Text>
    //     </View>

    //     {/*  */}

    //     <ScrollView
    //       style={styles.listWrap}
    //       keyboardShouldPersistTaps="handled"
    //       showsVerticalScrollIndicator={false}
    //     >
    //       {userBankDetails?.map((props, index) => (
    //         <SearchCardMiniStatement
    //           item={props}
    //           index={index}
    //           navigation={navigation}
    //           key={index}
    //         />
    //       ))}
    //     </ScrollView>

    //     <View style={styles.card}>
    //       {renderLabel()}

    //       <Dropdown
    //         style={[styles.dropdown, focusDrop && styles.dropdownFocused]}
    //         placeholderStyle={styles.placeholderStyle}
    //         selectedTextStyle={styles.selectedTextStyle}
    //         inputSearchStyle={styles.inputSearchStyle}
    //         iconStyle={styles.iconStyle}
    //         data={data}
    //         search
    //         maxHeight={300}
    //         labelField="label"
    //         valueField="value"
    //         placeholder={!focusDrop ? "Select type" : "..."}
    //         searchPlaceholder="Search..."
    //         value={accountType}
    //         onFocus={() => setFocusDrop(true)}
    //         onBlur={() => setFocusDrop(false)}
    //         onChange={item => {
    //           setReadonly(false)
    //           setAccountType(item?.value)
    //           setFocusDrop(false)
    //         }}
    //       />

    //       <InputComponent
    //         readOnly={isReadonly}
    //         label={"Account No. / Name"}
    //         placeholder={"Enter Account No. / Name"}
    //         value={searchValue}
    //         handleChange={changeSearchValue}
    //         autoFocus={!isReadonly}
    //         isLoading={isLoading}
    //       />
    //       <TouchableOpacity style={styles.searchButton} onPress={handleAccountSearch} disabled={isLoading}>
    //         <Text style={styles.searchButtonText}>Search</Text>
    //       </TouchableOpacity>
    //     </View>
    //   </View>
    // </View>
  )
}

export default MiniStatement

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
//     borderWidth: 2.5,
//     backgroundColor: COLORS.lightScheme.onPrimary,
//     padding: 20,
//     borderRadius: 10,
//     elevation: 10,
//   },
//   dropdownContainer: {
//     backgroundColor: "white",
//     position: "absolute",
//     bottom: 300,
//     padding: 16,
//     width: "100%",
//   },
//   dropdown: {
//     height: 50,
//     borderColor: COLORS.lightScheme.primary,
//     borderWidth: 1.5,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//   },
//   icon: {
//     marginRight: 5,
//   },
// })

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F9FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  hero: {
    backgroundColor: "#0B1F2A",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
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
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  loadingWrap: {
    paddingVertical: 14,
  },
  listWrap: {
    maxHeight: "60%",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dropdown: {
    height: 50,
    borderColor: "rgba(0,129,129,0.18)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  dropdownFocused: {
    borderColor: "#0B1F2A",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 18,
    marginTop: 10,
  },
  searchButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  placeholderStyle: { fontSize: 16 },
  selectedTextStyle: { fontSize: 16 },
  iconStyle: { width: 20, height: 20 },
  inputSearchStyle: { height: 40, fontSize: 16 },
});
