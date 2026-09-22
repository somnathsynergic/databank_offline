import Entypo from "react-native-vector-icons/Entypo"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import IconIcons from "react-native-vector-icons/Ionicons"
import AntDesign from "react-native-vector-icons/AntDesign"
import Feather from "react-native-vector-icons/Feather"
import { colors } from "./colors"

const HomeFill = (color, size) => (
  <Feather name="home" size={size} color={color} />
)
const Find = (color, size) => (
  <Feather name="search" color={color} size={size} />
)
const daily = (color, size) => (
  <Feather name="calendar" color={color} size={size} />
)
const notifications = (color = colors.white, size = 25) => (
  <Feather name="bell" color={color} size={size} />
)

const logout = (color = colors.black, size = 25) => (
  <Feather name="log-out" color={color} size={size} />
)
const man = (color = colors.black, size = 25) => (
  <Feather name="user" color={color} size={size} />
)

const settings = (color = colors.white, size = 25) => (
  <Feather name="settings" color={color} size={size} />
)
const duplicate = (color = colors.white, size = 25) => (
  <Feather name="copy" color={color} size={size} />
)
const end = (color = colors.white, size = 25) => (
  <Feather name="check-square" color={color} size={size} />
)

const profile = (color = colors.black, size = 25) => (
  <Feather name="file-text" color={color} size={size} />
)
const loop = (color = colors.black, size = 25) => (
  <Feather name="refresh-cw" size={size} color={color} />
)
const right = (color = colors.black, size = 25) => (
  <Feather name="chevron-right" size={size} color={color} />
)
const password = (color = colors.black, size = 25) => (
  <Feather name="lock" color={color} size={size} />
)

const report = (color = colors.black, size = 25) => (
  <Feather name="file-text" color={color} size={size} />
)
const info = (color = colors.black, size = 25) => (
  <Feather name="info" color={color} size={size} />
)
const giver = (color = colors.black, size = 25) => (
  <Feather name="credit-card" color={color} size={size} />
)

const printer = (color = colors.black, size = 25) => (
  <Feather name="printer" color={color} size={size} />
)

const calendar = (color = colors.black, size = 25) => (
  <Feather name="calendar" color={color} size={size} />
)
const layers = (color = colors.black, size = 25) => (
  <Feather name="layers" color={color} size={size} />
)
const creditCard = (color = colors.black, size = 25) => (
  <Feather name="credit-card" color={color} size={size} />
)
const alertCircle = (color = colors.black, size = 25) => (
  <Feather name="alert-circle" color={color} size={size} />
)
const fileText = (color = colors.black, size = 25) => (
  <Feather name="file-text" color={color} size={size} />
)
const trendingUp = (color = colors.black, size = 25) => (
  <Feather name="trending-up" color={color} size={size} />
)
const activity = (color = colors.black, size = 25) => (
  <Feather name="activity" color={color} size={size} />
)
const pieChart = (color = colors.black, size = 25) => (
  <Feather name="pie-chart" color={color} size={size} />
)

export const icon = {
  HomeFill,
  Find,
  notifications,
  logout,
  settings,
  end,
  profile,
  password,
  report,
  printer,
  info,
  giver,
  loop,
  daily,
  man,
  duplicate,
  right,
  calendar,
  layers,
  creditCard,
  alertCircle,
  fileText,
  trendingUp,
  activity,
  pieChart,
}
