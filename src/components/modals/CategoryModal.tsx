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
import { CategoryData } from '@/types';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from '@/components/ui/CategoryIcon';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: string;
    icon: string;
    color: string;
  }) => Promise<void>;
  editData?: CategoryData | null;
}

const COLOR_PALETTE = [
  '#f97316', // orange
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#ec4899', // pink
  '#eab308', // yellow
  '#ef4444', // red
  '#14b8a6', // teal
  '#22c55e', // green
  '#3b82f6', // blue
  '#64748b', // slate
];

export function CategoryModal({
  visible,
  onClose,
  onSave,
  editData,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#f97316');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
      setIcon(editData.icon || 'Tag');
      setColor(editData.color || '#f97316');
    } else {
      setName('');
      setType('EXPENSE');
      setIcon('Tag');
      setColor('#f97316');
    }
    setError('');
  }, [editData, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        type,
        icon,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
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
              {editData ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
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
            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'EXPENSE' && { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
                ]}
                onPress={() => setType('EXPENSE')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'EXPENSE' && { color: '#dc2626', fontWeight: 'bold' },
                  ]}
                >
                  หมวดหมู่รายจ่าย
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'INCOME' && { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
                ]}
                onPress={() => setType('INCOME')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'INCOME' && { color: '#16a34a', fontWeight: 'bold' },
                  ]}
                >
                  หมวดหมู่รายรับ
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={styles.label}>ชื่อหมวดหมู่ *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น อาหาร, เงินเดือน, เดินทาง..."
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            {/* Icon Picker */}
            <Text style={styles.label}>ไอคอนหมวดหมู่</Text>
            <View style={styles.iconsGrid}>
              {AVAILABLE_CATEGORY_ICONS.map((i) => {
                const isSelected = icon === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setIcon(i)}
                    style={[
                      styles.iconBox,
                      isSelected && { backgroundColor: color, borderColor: color },
                    ]}
                  >
                    <CategoryIcon
                      name={i}
                      size={20}
                      color={isSelected ? '#ffffff' : '#475569'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Color Palette */}
            <Text style={styles.label}>สีประจำหมวดหมู่</Text>
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
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeBtnText: {
    fontSize: 13,
    color: '#475569',
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
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
