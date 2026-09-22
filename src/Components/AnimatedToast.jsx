import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { width } = Dimensions.get('window');

export default function AnimatedToast({ visible, message, onHide, duration = 4000 }) {
  const slideAnim = useRef(new Animated.Value(-100)).current; // start above the screen

  useEffect(() => {
    if (visible) {
      // slide down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // stay for duration then slide up
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onHide && onHide();
          });
        }, duration);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onHide}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    padding: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
