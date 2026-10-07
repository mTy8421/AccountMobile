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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  exportAllData,
  importAllData,
  seedDatabase,
  getAppConfig,
} from '@/lib/database';
import { formatThaiDateTime } from '@/utils/date';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function BackupScreen() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [jsonExport, setJsonExport] = useState('');
  const [jsonImport, setJsonImport] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadConfig = async () => {
    try {
      const cfg = await getAppConfig();
      setLastBackup(cfg.lastBackupAt || null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleExport = async () => {
    setLoading(true);
    try {
      const dataStr = await exportAllData();
      setJsonExport(dataStr);
      await Clipboard.setStringAsync(dataStr);
      await loadConfig();
      Alert.alert('สำเร็จ', 'คัดลอกข้อมูล JSON ไปยังคลิปบอร์ดเรียบร้อยแล้ว');
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!jsonImport.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาวางโค้ด JSON ข้อมูลสำรองก่อน');
      return;
    }

    setLoading(true);
    try {
      await importAllData(jsonImport.trim());
      setShowImportConfirm(false);
      setJsonImport('');
      await loadConfig();
      Alert.alert('สำเร็จ', 'นำเข้าและกู้คืนข้อมูลเรียบร้อยแล้ว');
    } catch (err: any) {
      Alert.alert('ผิดพลาด', err.message || 'รูปแบบ JSON ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setLoading(true);
    try {
      await seedDatabase();
      setShowResetConfirm(false);
      await loadConfig();
      Alert.alert('สำเร็จ', 'รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นจากโปรเจกต์ต้นฉบับเรียบร้อยแล้ว');
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถรีเซ็ตข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setJsonImport(text);
      } else {
        Alert.alert('แจ้งเตือน', 'คลิปบอร์ดว่างเปล่า');
      }
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถอ่านคลิปบอร์ดได้');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={styles.banner}>
        <Ionicons name="shield-checkmark" size={24} color="#083D77" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>ข้อมูลจัดเก็บแบบ Local 100%</Text>
          <Text style={styles.bannerSub}>
            {lastBackup
              ? `สำรองข้อมูลล่าสุด: ${formatThaiDateTime(lastBackup)}`
              : 'ยังไม่เคยส่งออกสำรองข้อมูล'}
          </Text>
        </View>
      </View>

      {/* 1. Export Data Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="download-outline" size={22} color="#083D77" />
          <Text style={styles.cardTitle}>ส่งออกข้อมูลสำรอง (Export)</Text>
        </View>
        <Text style={styles.cardDesc}>
          ส่งออกข้อมูลบัญชี หมวดหมู่ และรายการธุรกรรมทั้งหมดเป็นรูปแบบ JSON สำหรับจัดเก็บไว้ภายนอก
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="copy-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>ส่งออกและคัดลอก JSON</Text>
            </>
          )}
        </TouchableOpacity>

        {jsonExport ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>ตัวอย่างข้อมูล JSON ที่ส่งออก:</Text>
            <Text style={styles.previewCode} numberOfLines={6}>
              {jsonExport}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Import Data Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cloud-upload-outline" size={22} color="#083D77" />
          <Text style={styles.cardTitle}>กู้คืนข้อมูล (Import / Restore)</Text>
        </View>
        <Text style={styles.cardDesc}>
          วางข้อความ JSON ที่เคยสำรองไว้เพื่อนำข้อมูลกลับมาใช้งาน ข้อมูลปัจจุบันจะถูกแทนที่
        </Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.jsonInput}
            multiline
            placeholder="วางโค้ด JSON ที่นี่..."
            placeholderTextColor="#94a3b8"
            value={jsonImport}
            onChangeText={setJsonImport}
          />
          <TouchableOpacity
            style={styles.pasteBtn}
            onPress={handlePasteFromClipboard}
          >
            <Ionicons name="clipboard-outline" size={16} color="#083D77" />
            <Text style={styles.pasteBtnText}>วางจากคลิปบอร์ด</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.restoreBtn,
            (!jsonImport.trim() || loading) && { opacity: 0.5 },
          ]}
          onPress={() => setShowImportConfirm(true)}
          disabled={!jsonImport.trim() || loading}
        >
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text style={styles.primaryBtnText}>กู้คืนข้อมูลจาก JSON</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Reset to Default Data Section */}
      <View style={[styles.card, { borderColor: '#fee2e2' }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="reload-circle-outline" size={22} color="#ef4444" />
          <Text style={[styles.cardTitle, { color: '#ef4444' }]}>
            รีเซ็ตข้อมูลเริ่มต้น
          </Text>
        </View>
        <Text style={styles.cardDesc}>
          ล้างข้อมูลทั้งหมดและแทนที่ด้วยข้อมูลเริ่มต้นจากโปรเจกต์ต้นฉบับ D:\test\test (3 บัญชี, 17 หมวดหมู่, 25 ธุรกรรม)
        </Text>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setShowResetConfirm(true)}
        >
          <Ionicons name="trash-bin-outline" size={18} color="#dc2626" />
          <Text style={styles.resetBtnText}>รีเซ็ตเป็นข้อมูลเริ่มต้น</Text>
        </TouchableOpacity>
      </View>

      {/* Import Confirmation */}
      <ConfirmModal
        visible={showImportConfirm}
        title="ยืนยันการกู้คืนข้อมูล"
        message="การกู้คืนข้อมูลจะลบข้อมูลปัจจุบันทั้งหมดและเขียนทับด้วยข้อมูลจาก JSON นี้ คุณแน่ใจหรือไม่?"
        confirmText="เขียนทับและกู้คืน"
        isDestructive
        loading={loading}
        onConfirm={handleConfirmImport}
        onClose={() => setShowImportConfirm(false)}
      />

      {/* Reset Confirmation */}
      <ConfirmModal
        visible={showResetConfirm}
        title="ยืนยันการรีเซ็ตข้อมูล"
        message="คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นตัวอย่างจาก D:\test\test?"
        confirmText="รีเซ็ตข้อมูล"
        isDestructive
        loading={loading}
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetConfirm(false)}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#083D77',
  },
  bannerSub: {
    fontSize: 12,
    color: '#0369a1',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#083D77',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  previewBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  previewCode: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputWrap: {
    marginBottom: 12,
  },
  jsonInput: {
    height: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#083D77',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
});
