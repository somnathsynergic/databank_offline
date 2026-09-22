import { StyleSheet, Text, View } from "react-native"
import React from "react"
import SmoothPinCodeInput from "react-native-smooth-pincode-input"
import { COLORS, colors } from "../Resources/colors"

const MpinComponent = ({ value, onChangeText, placeholder }) => {
  return (
    <View style={{ padding: 10, alignItems: "center" }}>
      <SmoothPinCodeInput
        placeholder={placeholder}
        mask={
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 25,
              backgroundColor: COLORS.lightScheme.primary,
              borderWidth: 2,
            }}
          />
        }
        maskDelay={1000}
        password={true}
        cellStyle={{
          borderWidth: 1,
          borderRadius: 5,
          borderColor: COLORS.lightScheme.primary,
        }}
        cellStyleFocused={null}
        value={value}
        onTextChange={code => {
          console.log('MpinComponent change:', code);
          onChangeText && onChangeText(code);
        }}
        onBackspace={() => {
          console.warn("hello")
        }}
      />
    </View>
  );
};

export default MpinComponent

const styles = StyleSheet.create({})
