import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppConfig, verifyAppPin } from '@/lib/database';

interface PinGatekeeperProps {
  children: React.ReactNode;
}

export function PinGatekeeper({ children }: PinGatekeeperProps) {
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');

  const checkPinStatus = async () => {
    try {
      const cfg = await getAppConfig();
      if (cfg.isPinEnabled && cfg.pinHash) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (e) {
      console.error('Failed to check pin status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPinStatus();
  }, []);

  const handleUnlock = async () => {
    if (!enteredPin) return;
    try {
      const isValid = await verifyAppPin(enteredPin);
      if (isValid) {
        setIsLocked(false);
        setError('');
        setEnteredPin('');
      } else {
        setError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setEnteredPin('');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบ');
    }
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 8) {
      const next = enteredPin + num;
      setEnteredPin(next);
      setError('');
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#083D77" />
      </View>
    );
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.lockContainer}>
      <View style={styles.iconBox}>
        <Ionicons name="lock-closed" size={36} color="#083D77" />
      </View>
      <Text style={styles.appTitle}>บัญชีส่วนตัว</Text>
      <Text style={styles.subTitle}>กรุณากรอกรหัส PIN เพื่อเข้าใช้งาน</Text>

      {/* PIN dots display */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < enteredPin.length;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                filled && styles.dotFilled,
                error ? styles.dotError : null,
              ]}
            />
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Numeric keypad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.keyBtn}
                onPress={() => handleKeyPress(digit)}
              >
                <Text style={styles.keyBtnText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keyBtnEmpty} disabled />
          <TouchableOpacity
            style={styles.keyBtn}
            onPress={() => handleKeyPress('0')}
          >
            <Text style={styles.keyBtnText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={handleDelete}>
            <Ionicons name="backspace-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.unlockBtn,
          enteredPin.length < 4 && { opacity: 0.5 },
        ]}
        onPress={handleUnlock}
        disabled={enteredPin.length < 4}
      >
        <Text style={styles.unlockBtnText}>ปลดล็อก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#083D77',
    borderColor: '#083D77',
  },
  dotError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
  },
  keypad: {
    width: 260,
    marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnEmpty: {
    width: 68,
    height: 68,
  },
  keyBtnText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0f172a',
  },
  unlockBtn: {
    width: 240,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#083D77',
    alignItems: 'center',
  },
  unlockBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
