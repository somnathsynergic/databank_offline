import { ActivityIndicator, ScrollView, StyleSheet, Text, View, ToastAndroid } from "react-native";
import { useCallback, useContext, useEffect, useState } from "react"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import InputComponent from "../../Components/InputComponent"

import { address } from "../../Routes/addresses"
import { AppStore } from "../../Context/AppContext"
import { useFocusEffect } from "@react-navigation/native";
import { getDBConnection, searchOfflineAccounts } from "../../Database/db-service";
import SearchCardDuplicateReceipt from "../../Components/SearchCardDuplicateReceipt"
import { Dropdown } from "react-native-element-dropdown"
import InputDropdownComponent from "../../Components/InputDropdownComponent"

const DuplicateReceipt = ({ navigation }) => {
  const [searchValue, changeSearchValue] = useState(() => "")
  const [userBankDetails, setUserBankDetails] = useState(() => [])
  const [focusDrop, setFocusDrop] = useState(() => false)
  // const [showModal, setShowModal] = useState(() => false)
  const [accountType, setAccountType] = useState(() => "")
  const [isReadonly, setReadonly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { userId, bankId, branchCode } = useContext(AppStore)

  function handleAccountSearch() {
    if (!searchValue) {
      return
    }
    // console.log(searchValue)
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
      const localAccounts = await searchOfflineAccounts(db, searchValue, accountType);
      setUserBankDetails(localAccounts);
      if (!localAccounts || localAccounts.length === 0) {
        ToastAndroid.showWithGravityAndOffset(
          "No data found!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
    } catch (err) {
      console.error("Error searching local DB:", err);
      setUserBankDetails([]);
      ToastAndroid.showWithGravityAndOffset(
        "No data found!",
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
    // <View>
    //   <CustomHeader />
    //   <View style={styles.container}>
    //     {/* Account Cards */}

    //     <ScrollView
    //       style={{ maxHeight: "60%" }}
    //       keyboardShouldPersistTaps="handled">
    //       {isLoading && (
    //         <ActivityIndicator
    //           size={"large"}
    //           color={COLORS.lightScheme.primary}
    //         />
    //       )}
    //       {userBankDetails &&
    //         userBankDetails?.map((props, index) => {
    //           console.log("========================", props)
    //           return (
    //             <SearchCardDuplicateReceipt
    //               item={props}
    //               index={index}
    //               navigation={navigation}
    //               key={index}
    //             />
    //           )
    //         })}
    //     </ScrollView>
    //     {/* <ScrollView> */}
    //     {/* <View style={styles.dropdownContainer}>
    //       {renderLabel()}
    //       <Dropdown
    //         style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
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
    //         // onConfirmSelectItem={()=>
    //         //   setReadonly(accountType?false:true)

    //         // }
    //         onChange={item => {
    //           // console.log(accountType)
    //           setReadonly(false)
    //           setAccountType(item.value)
    //           setFocusDrop(false)
    //         }}

    //       />
    //     </View> */}
    //     <View style={styles.searchContainer}>
    //       {renderLabel()}

    //       <Dropdown
    //         style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
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
    //         // onConfirmSelectItem={()=>
    //         //   setReadonly(accountType?false:true)

    //         // }
    //         onChange={item => {
    //           // console.log(accountType)
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
    //       />
    //     </View>
    //     {/* <View style={styles.searchContainer}>
    //     <InputDropdownComponent
    //         readOnly={isReadonly}
    //         label={"Account No. / Name"}
    //         placeholder={"Enter Account No. / Name"}
    //         value={searchValue}
    //         handleChange={changeSearchValue}
    //         autoFocus={!isReadonly}
    //       />
    //     </View> */}
    //     {/* </ScrollView> */}
    //     {/* Search Component */}
    //   </View>
    // </View>

    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroSmall}>Receipt Search</Text>
            <Text style={styles.heroTitle}>Duplicate Receipt</Text>
            <Text style={styles.heroSub}>Find an account and continue</Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Search</Text>
          </View>
        </View>

        {/* {isLoading && (
          <ActivityIndicator
            size={"large"}
            color={COLORS.lightScheme.primary}
            style={styles.loading}
          />
        )} */}

        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {userBankDetails &&
            userBankDetails?.map((props, index) => {
              return (
                <SearchCardDuplicateReceipt
                  item={props}
                  index={index}
                  navigation={navigation}
                  key={index}
                />
              )
            })}
        </ScrollView>

        <View style={styles.searchCard}>
          {renderLabel()}

          <Dropdown
            style={[styles.dropdown, focusDrop && styles.dropdownFocused]}
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
            isLoading={isLoading}
          />
        </View>
      </View>
    </View>
  )
}

export default DuplicateReceipt

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
//     bottom: 250,
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
    fontWeight: "800",
    color: "#009966",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  loading: {
    marginTop: 10,
    marginBottom: 8,
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  searchCard: {
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
  dropdown: {
    height: 50,
    borderColor: "rgba(0,129,129,0.18)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  dropdownFocused: {
    borderColor: "#0B1F2A",
  },
});
