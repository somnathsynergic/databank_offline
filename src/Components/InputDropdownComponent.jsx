import {
  StyleSheet,
  Text,
  View,
  TextInput,
  PixelRatio,
  Image,
  TouchableOpacity,
} from "react-native"
import React, { useState } from "react"
import { COLORS, colors } from "../Resources/colors"
import hide from "../Resources/Images/Icons/hide.png"
import { Dropdown } from "react-native-element-dropdown"

const InputDropdownComponent = ({
  handleChange,
  value,
  placeholder,
  label,
  readOnly = false,
  textHide = false,
  handlePasswordShow,
  keyboardType = "default",
  autoFocus = true,
}) => {
  const [accountType, setAccountType] = useState(() => "")
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [isReadonly, setReadonly] = useState(true)

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
  return (
    <View style={styles.inputDropdownContainer}>
      <View style={styles.dropdownContainer}>
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
          // onConfirmSelectItem={()=>
          //   setReadonly(accountType?false:true)

          // }
          onChange={item => {
            // console.log(accountType)
            setReadonly(false)
            setAccountType(item.value)
            setFocusDrop(false)
          }}
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        onChangeText={handleChange}
        value={value !== undefined && value !== null ? value.toString() : ""}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightScheme.secondary}
        readOnly={isReadonly}
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
    </View>
  )
}

export default InputDropdownComponent

const styles = StyleSheet.create({
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.lightScheme.primary,
    borderRadius: PixelRatio.roundToNearestPixel(10),
    paddingHorizontal: 10,
    paddingVertical: 15,
    color: COLORS.lightScheme.onSurface,
    fontSize: 22,
    fontWeight: "bold",
  },
  label: {
    marginTop: 5,
    paddingHorizontal: PixelRatio.roundToNearestPixel(5),
    paddingBottom: PixelRatio.roundToNearestPixel(5),
    fontSize: PixelRatio.roundToNearestPixel(16),
    color: COLORS.lightScheme.primary,
    fontWeight: "600",
    letterSpacing: 2,
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
  dropdownContainer: {
    backgroundColor: "white",
    position: "absolute",
    bottom: 250,
    // padding: 16,
    width: "100%",
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  inputDropdownContainer: {
    flex: 1,
    flexDirection: "row",
    width: "40%",
  },
})
