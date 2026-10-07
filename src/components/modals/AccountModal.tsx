import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountData } from '@/types';
import { AccountIcon } from '@/components/ui/AccountIcon';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: string;
    initialBalance: number;
    color?: string;
  }) => Promise<void>;
  editData?: AccountData | null;
}

const ACCOUNT_TYPES = [
  { label: 'เงินสด', value: 'CASH' },
  { label: 'ธนาคาร', value: 'BANK' },
  { label: 'วอลเล็ต', value: 'WALLET' },
  { label: 'บัตรเครดิต', value: 'CREDIT_CARD' },
  { label: 'การลงทุน', value: 'INVESTMENT' },
  { label: 'อื่นๆ', value: 'OTHER' },
];

const COLOR_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#083D77', // navy
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function AccountModal({
  visible,
  onClose,
  onSave,
  editData,
}: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
      setInitialBalance(String(editData.initialBalance));
      setColor(editData.color || '#3b82f6');
    } else {
      setName('');
      setType('BANK');
      setInitialBalance('0');
      setColor('#3b82f6');
    }
    setError('');
  }, [editData, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('กรุณาระบุชื่อบัญชี');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editData ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>ชื่อบัญชี *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น เงินสด, บัญชีเงินเดือน, TrueMoney..."
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            {/* Type */}
            <Text style={styles.label}>ประเภทบัญชี *</Text>
            <View style={styles.typesGrid}>
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      styles.typeCard,
                      isSelected && { borderColor: '#083D77', backgroundColor: '#e2e8f0' },
                    ]}
                  >
                    <AccountIcon
                      type={t.value}
                      size={18}
                      color={isSelected ? '#083D77' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.typeCardText,
                        isSelected && { color: '#083D77', fontWeight: 'bold' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Initial balance */}
            <Text style={styles.label}>ยอดยกมาเริ่มต้น (บาท)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={initialBalance}
              onChangeText={setInitialBalance}
            />

            {/* Color */}
            <Text style={styles.label}>สีประจำบัญชี</Text>
            <View style={styles.colorPalette}>
              {COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                >
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeCard: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeCardText: {
    fontSize: 12,
    color: '#475569',
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#083D77',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
