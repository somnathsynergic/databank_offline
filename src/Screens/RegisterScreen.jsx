import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ToastAndroid,
  ActivityIndicator,
  Animated,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import DeviceInfo from 'react-native-device-info';
import SmoothPinCodeInput from 'react-native-smooth-pincode-input';
import axios from 'axios';

import NetInfo from '@react-native-community/netinfo';
import HeaderLogo from '../Resources/Images/headerlogo.png';
import { address } from '../Routes/addresses';
import mainNavigationRoutes from '../Routes/NavigationRoutes';
import { generateDeviceKeyPair, saveAgentCodeLocally } from '../Utils/cryptoHelper';

const RegisterScreen = ({ navigation }) => {
  const [bankId, setBankId] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setDeviceId(DeviceInfo.getUniqueIdSync());
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      ToastAndroid.show('Device registration requires an active internet connection. Operation dismissed.', ToastAndroid.LONG);
      return;
    }

    if (!bankId.trim()) {
      ToastAndroid.show('Please enter Bank ID', ToastAndroid.SHORT);
      return;
    }
    if (!agentCode.trim()) {
      ToastAndroid.show('Please enter Agent Code', ToastAndroid.SHORT);
      return;
    }
    if (pin.length !== 4) {
      ToastAndroid.show('Please enter a 4-digit PIN', ToastAndroid.SHORT);
      return;
    }
    if (pin !== confirmPin) {
      ToastAndroid.show('PINs do not match', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    try {
      // 1. Generate Hardware Keypair (Secure Enclave / Keystore)
      const publicKey = await generateDeviceKeyPair();

      // 2. Submit payload to Backend
      const payload = {
        bank_id: bankId.trim(),
        agent_code: agentCode.toString().trim(),
        device_id: deviceId,
        public_key: publicKey,
      };

      console.log(payload, '---------------- PAYLOAD-----------------\n', address.REGISTER, ' ----------------URL---------------');


      const res = await axios.post(address.REGISTER, payload, {
        headers: { Accept: 'application/json' },
      });

      if (res.data && res.data.status) {
        // 3. Save Agent Code locally
        await saveAgentCodeLocally(agentCode.trim());

        ToastAndroid.show('Device registered successfully!', ToastAndroid.LONG);
        navigation.navigate(mainNavigationRoutes.login, { registeredAgentCode: agentCode.trim() });
      } else {
        const errorMsg = res.data?.Error || 'Registration failed. Please verify credentials.';
        Alert.alert('Registration Restricted', errorMsg);
      }
    } catch (err) {
      console.error('Registration Error:', err);
      Alert.alert(
        'Registration Error',
        err.response?.data?.Error || err.message || 'Server error during registration.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0B4F37', '#063122']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={HeaderLogo} style={styles.image} resizeMode="contain" />
          <Text style={styles.grettingText}>Device Registration</Text>
          <Text style={styles.manual}>Bind hardware keys to your agent account</Text>
        </View>

        <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
          <View style={styles.cardHeaderLine} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Bank ID"
              placeholderTextColor="#9E9E9E"
              value={bankId}
              onChangeText={setBankId}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Agent Code</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Agent Code"
              placeholderTextColor="#9E9E9E"
              value={agentCode}
              onChangeText={setAgentCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device ID (Hardware ID)</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{deviceId || 'Fetching...'}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Set 4-Digit Security PIN</Text>
            <View style={styles.pinWrap}>
              <SmoothPinCodeInput
                placeholder="*"
                mask={<View style={styles.pinMask} />}
                maskDelay={1000}
                password={true}
                cellStyle={styles.pinCell}
                cellStyleFocused={styles.pinCellFocused}
                value={pin}
                onTextChange={setPin}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm 4-Digit Security PIN</Text>
            <View style={styles.pinWrap}>
              <SmoothPinCodeInput
                placeholder="*"
                mask={<View style={styles.pinMask} />}
                maskDelay={1000}
                password={true}
                cellStyle={styles.pinCell}
                cellStyleFocused={styles.pinCellFocused}
                value={confirmPin}
                onTextChange={setConfirmPin}
              />
            </View>
          </View>

          <TouchableOpacity
            disabled={loading || !bankId || !agentCode || pin.length !== 4}
            onPress={handleRegister}
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  loading || !bankId || !agentCode || pin.length !== 4
                    ? '#9E9E9E'
                    : '#009966',
              },
            ]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Register Device</Text>
                <Feather name="shield" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate(mainNavigationRoutes.login)}
            style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already registered? Go to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  image: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  grettingText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  manual: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    padding: 24,
    marginHorizontal: 16,
    elevation: 8,
  },
  cardHeaderLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#009966',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F0FAF6',
    borderWidth: 1,
    borderColor: 'rgba(0, 153, 102, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
  },
  readOnlyInput: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  pinWrap: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 153, 102, 0.15)',
  },
  pinMask: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#009966',
  },
  pinCell: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#009966',
    backgroundColor: '#FFFFFF',
  },
  pinCellFocused: {
    borderColor: '#004D40',
    backgroundColor: '#E0F2F1',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#009966',
    fontSize: 14,
    fontWeight: '600',
  },
});
