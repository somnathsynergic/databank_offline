import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PixelRatio,
} from "react-native"
import React from "react"
// import LinearGradient from 'react-native-linear-gradient';
import { COLORS, colors } from "../Resources/colors"

const ButtonComponent = ({
  title,
  disabled = false,
  handleOnpress,
  customStyle,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnpress}
      style={[
        {
          backgroundColor: disabled ? "#9E9E9E" : "#0B1F2A",
          opacity: disabled ? 0.7 : 1,
        },
        { ...styles.container, ...customStyle },
      ]}>
      <Text style={[styles.text, { color: disabled ? "#E0E0E0" : "#FFFFFF" }]}>{title}</Text>
    </TouchableOpacity>
  )
}

export default ButtonComponent

const styles = StyleSheet.create({
  container: {
    borderRadius: PixelRatio.roundToNearestPixel(10),
    padding: 8,
    elevation: 8,
    // backgroundColor: colors.secondary
  },
  text: {
    color: COLORS.lightScheme.onError,
    fontSize: PixelRatio.roundToNearestPixel(15),
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 1,
  },
})
