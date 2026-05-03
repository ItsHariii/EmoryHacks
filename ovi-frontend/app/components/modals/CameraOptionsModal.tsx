// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface CameraOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onScanBarcode: () => void;
  onAIEstimation: () => void;
}

export const CameraOptionsModal: React.FC<CameraOptionsModalProps> = ({
  visible,
  onClose,
  onScanBarcode,
  onAIEstimation,
}) => {
  const navigation = useNavigation();

  const handleSearch = () => {
    onClose();
    try {
      (navigation as any).navigate('FoodLogging', { screen: 'SearchFood' });
    } catch (error) {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          Add <Text style={styles.titleItalic}>food</Text>
        </Text>

        {/* Scan Barcode */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={onScanBarcode}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="barcode-scan" size={22} color="#2B221B" />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>
              Scan <Text style={styles.optionTitleItalic}>barcode</Text>
            </Text>
            <Text style={styles.optionSub}>Instant nutrition info from packaging</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#8C7E70" />
        </TouchableOpacity>

        {/* AI Estimation */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={onAIEstimation}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="AI estimation"
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="camera-iris" size={22} color="#2B221B" />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>
              AI <Text style={styles.optionTitleItalic}>estimation</Text>
            </Text>
            <Text style={styles.optionSub}>Snap a photo, let Ovi identify it</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#8C7E70" />
        </TouchableOpacity>

        {/* Search database row */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={handleSearch}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Search food database"
        >
          <MaterialCommunityIcons name="magnify" size={16} color="#5A4D42" />
          <Text style={styles.searchRowText}>Search food database</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} style={styles.cancelRow} accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,34,27,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0D5',
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 24,
    color: '#2B221B',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  titleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FCF8F1',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 17,
    color: '#2B221B',
    letterSpacing: -0.2,
  },
  optionTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  optionSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#5A4D42',
    marginTop: 2,
    lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  searchRowText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
  },
  cancelRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#8C7E70',
  },
});
