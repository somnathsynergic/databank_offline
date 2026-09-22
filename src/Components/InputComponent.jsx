import {
  StyleSheet,
  Text,
  View,
  TextInput,
  PixelRatio,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import React from "react"
import { COLORS, colors } from "../Resources/colors"
import hide from "../Resources/Images/Icons/hide.png"

const InputComponent = ({
  handleChange,
  value,
  placeholder,
  label,
  readOnly = false,
  textHide = false,
  handlePasswordShow,
  keyboardType = "default",
  autoFocus = true,
  isLoading = false,
}) => {
  return (
    <View style={{ position: "relative" }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        onChangeText={handleChange}
        value={value !== undefined && value !== null ? value.toString() : ""}
        placeholder={placeholder}
        placeholderTextColor={'#aaa8a8ff'}
        readOnly={readOnly}
        keyboardType={keyboardType}
        secureTextEntry={textHide}
        autoFocus={autoFocus}
      />
      {handlePasswordShow && (
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handlePasswordShow}>
          {textHide ? (
            <Image source={hide} style={styles.image} />
          ) : (
            <Image source={hide} style={styles.image} />
          )}
        </TouchableOpacity>
      )}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color="#009966"
          style={{
            position: "absolute",
            top: label ? 10 : 15,
            right: 12,
          }}
        />
      )}
    </View>
  )
}

export default InputComponent

const styles = StyleSheet.create({
  input: {
    width: "100%",
    // borderWidth: 1,
    borderColor: "#e9e9e9ff",
    backgroundColor: '#e9e9e9ff',
    borderWidth: 1,
    borderRadius: PixelRatio.roundToNearestPixel(10),
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: COLORS.lightScheme.onSurface,
    fontSize: 18,
    fontWeight: "bold",
  },
  label: {
    marginTop: 5,
    paddingHorizontal: PixelRatio.roundToNearestPixel(5),
    paddingBottom: PixelRatio.roundToNearestPixel(5),
    fontSize: PixelRatio.roundToNearestPixel(16),
    color: "#0B1F2A",
    fontWeight: "400",
    letterSpacing: 1,
  },
  imageContainer: {
    position: "absolute",
    bottom: PixelRatio.roundToNearestPixel(15),
    right: PixelRatio.roundToNearestPixel(10),
  },
  image: {
    height: 20,
    width: 20,
  },
})
