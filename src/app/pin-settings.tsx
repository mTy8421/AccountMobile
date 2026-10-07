import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppConfig, setAppPin } from '@/lib/database';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function PinSettingsScreen() {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const loadConfig = async () => {
    try {
      const cfg = await getAppConfig();
      setIsPinEnabled(cfg.isPinEnabled);
    } catch (e) {
      console.error('Failed to load pin config', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSetPin = async () => {
    if (newPin.length < 4) {
      setError('รหัส PIN ต้องมีความยาวอย่างน้อย 4 ตัวเลข');
      return;
    }
    if (newPin !== confirmPin) {
      setError('รหัส PIN ทั้ง 2 ช่องไม่ตรงกัน');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await setAppPin(newPin);
      setIsPinEnabled(true);
      setNewPin('');
      setConfirmPin('');
      Alert.alert('สำเร็จ', 'เปิดใช้งานรหัส PIN เรียบร้อยแล้ว');
    } catch {
      setError('เกิดข้อผิดพลาดในการตั้งรหัส PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleDisablePin = async () => {
    setSaving(true);
    try {
      await setAppPin(null);
      setIsPinEnabled(false);
      setShowDisableConfirm(false);
      Alert.alert('สำเร็จ', 'ปิดการใช้งานรหัส PIN เรียบร้อยแล้ว');
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถปิดการใช้งานได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#083D77" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusIconWrap,
            { backgroundColor: isPinEnabled ? '#dcfce7' : '#f1f5f9' },
          ]}
        >
          <Ionicons
            name={isPinEnabled ? 'lock-closed' : 'lock-open-outline'}
            size={28}
            color={isPinEnabled ? '#16a34a' : '#64748b'}
          />
        </View>
        <Text style={styles.statusTitle}>
          {isPinEnabled ? 'PIN Lock เปิดใช้งานอยู่' : 'PIN Lock ปิดใช้งาน'}
        </Text>
        <Text style={styles.statusDesc}>
          {isPinEnabled
            ? 'แอปพลิเคชันจะถามรหัส PIN ทุกครั้งที่เปิดใช้งาน เพื่อป้องกันข้อมูลการเงินของคุณ'
            : 'ตั้งรหัส PIN เพื่อเพิ่มความปลอดภัยและป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต'}
        </Text>

        {isPinEnabled ? (
          <TouchableOpacity
            style={styles.disableBtn}
            onPress={() => setShowDisableConfirm(true)}
          >
            <Text style={styles.disableBtnText}>ปิดการใช้งาน PIN Lock</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Set or Change PIN Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isPinEnabled ? 'เปลี่ยนรหัส PIN ใหม่' : 'กำหนดรหัส PIN ใหม่'}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>รหัส PIN ใหม่ (ตัวเลข 4 หลักขึ้นไป)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          secureTextEntry
          maxLength={8}
          placeholder="••••"
          placeholderTextColor="#94a3b8"
          value={newPin}
          onChangeText={setNewPin}
        />

        <Text style={styles.label}>ยืนยันรหัส PIN ใหม่อีกครั้ง</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          secureTextEntry
          maxLength={8}
          placeholder="••••"
          placeholderTextColor="#94a3b8"
          value={confirmPin}
          onChangeText={setConfirmPin}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSetPin}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isPinEnabled ? 'บันทึกการเปลี่ยน PIN' : 'เปิดใช้งาน PIN Lock'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation to Disable */}
      <ConfirmModal
        visible={showDisableConfirm}
        title="ปิดการใช้งาน PIN Lock"
        message="คุณแน่ใจหรือไม่ว่าต้องการปิดการล็อกด้วยรหัส PIN? ทุกคนจะสามารถเปิดดูข้อมูลการเงินในแอปนี้ได้ทันที"
        confirmText="ปิดใช้งาน"
        isDestructive
        loading={saving}
        onConfirm={handleDisablePin}
        onClose={() => setShowDisableConfirm(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  statusDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  disableBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  disableBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 4,
    color: '#0f172a',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#083D77',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
