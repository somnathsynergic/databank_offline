import { FlatList, Image, StyleSheet, Text, View, ScrollView } from "react-native"
import { useContext } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { Table, Rows } from "react-native-table-component"
import { icon } from "../../Resources/Icons"
import { AppStore } from "../../Context/AppContext"
const Profile = () => {
  const { userId, agentName, agentEmail, agentPhoneNumber, maximumAmount } =
    useContext(AppStore)

  const tableData = [
    ["Agent Code", userId],
    // ['Agent Name', agentName],
    ["Email", agentEmail],
    ["Mobile No.", agentPhoneNumber],
    ["Maximum Limit (₹)", maximumAmount],
  ]
  return (
    // <View style={{ backgroundColor: COLORS.lightScheme.background }}>
    //   <CustomHeader />
    //   <View style={styles.logoContainer}>
    //     <View style={styles.introText}>
    //       {/* Wellcome gretting */}
    //       <Text style={styles.containerText}>{`Hello! ${agentName}`}</Text>
    //     </View>
    //   </View>
    //   <Image
    //     source={{
    //       uri: "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659651_640.png",
    //     }}
    //     style={styles.image}
    //   />

    //   <View style={styles.listView}>
    //     {/* <Table style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
    //       <Rows data={tableData} textStyle={styles.text} />
    //     </Table> */}
    //     <View style={styles.profileContainer}>
    //       <View style={styles.profileView}>
    //         <Text style={styles.title}>Agent Code</Text>
    //         <Text style={styles.content}>{userId}</Text>
    //       </View>
    //       <View style={styles.profileView}>
    //         <Text style={styles.title}>Email</Text>
    //         <Text style={styles.content}>{agentEmail}</Text>
    //       </View>
    //       <View style={styles.profileView}>
    //         <Text style={styles.title}>Mobile No.</Text>
    //         <Text style={styles.content}>{agentPhoneNumber}</Text>
    //       </View>
    //       <View style={styles.profileView}>
    //         <Text style={styles.title}>Maximum Limit (₹)</Text>
    //         <Text style={styles.content}>{maximumAmount}</Text>
    //       </View>
    //     </View>

    //     {/* <hr/> */}
    //   </View>
    // </View>

    <View style={styles.root}>
      <CustomHeader />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Agent Profile</Text>
          <Text style={styles.heroTitle}>{`Hello, ${agentName}`}</Text>
          <Text style={styles.heroSub}>Your account and contact details</Text>
        </View>

        {/* <View style={styles.avatarWrap}>
      <Image
        source={{
          uri: "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659651_640.png",
        }}
        style={styles.image}
      />
    </View> */}

        <View style={styles.profileCard}>
          <View style={styles.profileView}>
            <Text style={styles.title}>Agent Code</Text>
            <Text style={styles.content}>{userId}</Text>
          </View>

          <View style={styles.profileView}>
            <Text style={styles.title}>Email</Text>
            <Text style={styles.content}>{agentEmail}</Text>
          </View>

          <View style={styles.profileView}>
            <Text style={styles.title}>Mobile No.</Text>
            <Text style={styles.content}>{agentPhoneNumber}</Text>
          </View>

          <View style={[styles.profileView, styles.lastRow]}>
            <Text style={styles.title}>Maximum Limit (₹)</Text>
            <Text style={styles.content}>{maximumAmount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Profile

// const styles = StyleSheet.create({
//   nameContainer: {
//     flex: 1,
//     margin: 20,
//     padding: 10,
//     backgroundColor: "white",
//     height: 100,
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 30,
//     borderTopRightRadius: 50,
//   },
//   profileContainer: {
//     position: "relative",
//     // top:-80
//   },
//   containerText: {
//     fontSize: 20,
//     color: COLORS.lightScheme.onPrimary,
//   },
//   introText: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 10,
//   },
//   profileView: {
//     width: "100%",
//     borderBottomColor: "gray",
//     borderBottomWidth: 0.5,
//     paddingBottom: 7,
//     paddingTop: 15,
//   },
//   listView: {
//     backgroundColor: COLORS.lightScheme.background,
//     height: "100%",
//     padding: 20,
//     marginTop: -80,
//   },
//   text: {
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "600",
//     borderBottomColor: COLORS.lightScheme.secondary,
//     borderBottomWidth: 1,
//     paddingVertical: 10,
//     fontSize: 14,
//   },
//   title: {
//     fontWeight: "bold",
//     color: COLORS.lightScheme.primary,
//     fontSize: 16,
//   },
//   content: {
//     color: "gray",
//     fontSize: 20,
//   },
//   logoContainer: {
//     borderBottomRightRadius: 30,
//     borderBottomLeftRadius: 30,
//     backgroundColor: COLORS.lightScheme.primary,
//     position: "relative",
//     // flexDirection: "row",
//     // justifyContent: "space-between",
//     // alignItems: "center",

//     paddingHorizontal: 20,
//     height: 150,
//     overflow: "none",
//   },

//   image: {
//     height: 150,
//     width: 150,
//     backgroundColor: "white",
//     borderColor: COLORS.lightScheme.primary,
//     borderWidth: 6,
//     borderRadius: 100,
//     alignSelf: "center",
//     bottom: 90,
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
    letterSpacing: 0.3,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: -42,
    marginBottom: 12,
  },
  image: {
    height: 120,
    width: 120,
    backgroundColor: "#FFFFFF",
    borderColor: "#0B1F2A",
    borderWidth: 5,
    borderRadius: 60,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  profileView: {
    paddingVertical: 14,
    borderBottomColor: "rgba(148,163,184,0.25)",
    borderBottomWidth: 1,
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  title: {
    fontWeight: "800",
    color: "#009966",
    fontSize: 14,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  content: {
    marginTop: 6,
    color: "#6f7379ff",
    fontSize: 18,
    fontWeight: "600",
  },
});
