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

const CancelButtonComponent = ({
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
          backgroundColor: disabled
            ? COLORS.darkScheme.secondary
            : COLORS.lightScheme.primary,
          borderColor: '#0B1F2A',
          borderWidth: 1.5,
        },
        { ...styles.container, ...customStyle },
      ]}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

export default CancelButtonComponent

const styles = StyleSheet.create({
  container: {
    borderRadius: PixelRatio.roundToNearestPixel(30),
    padding: 8,
    borderColor: COLORS.lightScheme.primary,
    border: 1.5,
    elevation: 5,
    // backgroundColor: colors.secondary
  },
  text: {
    color: '#0B1F2A',
    fontSize: PixelRatio.roundToNearestPixel(15),
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 1,
  },
})
