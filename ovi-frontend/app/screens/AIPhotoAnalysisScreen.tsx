// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CameraPermissionScreen } from '../components/camera/CameraPermissionScreen';
import { photoAPI } from '../services/api';
import { FoodSafetyBadge } from '../components/food/FoodSafetyBadge';

const CaptureButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <TouchableOpacity style={styles.captureButton} onPress={onPress} activeOpacity={0.9} accessibilityLabel="Take photo">
      <Animated.View style={[styles.captureButtonInner, { transform: [{ scale }] }]} />
    </TouchableOpacity>
  );
};

export const AIPhotoAnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedPhoto(photo.uri);
      await analyzePhoto(photo.uri);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const analyzePhoto = async (photoUri: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await photoAPI.analyzePhoto(photoUri);
      if (result.success) setAnalysisResult(result);
      else setError(result.error || 'Failed to analyze photo');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleLogFood = () => {
    if (!analysisResult?.food) return;
    (navigation as any).navigate('SearchFood', {
      preselectedFood: analysisResult.food,
      aiAnalysis: analysisResult.ai_analysis,
    });
  };

  const handleCancel = () => navigation.goBack();

  if (!permission) {
    return <CameraPermissionScreen loading onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }
  if (!permission.granted) {
    return <CameraPermissionScreen denied onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }

  // Result sheet
  if (analysisResult && capturedPhoto) {
    const { ai_analysis, food } = analysisResult;
    const kcal = Math.round(food?.calories || 0);
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} blurRadius={2} />
        <View style={styles.dimVeil} />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelHit} accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.topKicker}>AI ESTIMATION</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 18 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetKicker}>DETECTED</Text>
              <Text style={styles.confidence}>
                {ai_analysis?.confidence || 0}% confidence
              </Text>
            </View>
            <Text style={styles.foodName}>
              <Text style={styles.foodNameItalic}>{ai_analysis?.food_name || 'Unknown'}</Text>
            </Text>

            {food?.safety_status && (
              <View style={{ marginTop: 10 }}>
                <FoodSafetyBadge status={food.safety_status} notes={food.safety_notes} />
              </View>
            )}

            {ai_analysis?.estimated_portion_size && (
              <Text style={styles.portion}>
                ~{ai_analysis.estimated_portion_size} {ai_analysis.estimated_portion_unit}
              </Text>
            )}

            <View style={styles.kcalRow}>
              <Text style={styles.kcalValue}>{kcal}</Text>
              <Text style={styles.kcalUnit}>kcal estimated</Text>
            </View>

            <View style={styles.macroRow}>
              {[
                { l: 'Protein', v: Math.round(food?.nutrients?.protein?.amount || 0) },
                { l: 'Carbs', v: Math.round(food?.nutrients?.carbs?.amount || 0) },
                { l: 'Fats', v: Math.round(food?.nutrients?.fat?.amount || 0) },
              ].map((m, i, arr) => (
                <View key={m.l} style={[styles.macroItem, i < arr.length - 1 && styles.macroDivider]}>
                  <Text style={styles.macroValue}>{m.v}<Text style={styles.macroValueG}>g</Text></Text>
                  <Text style={styles.macroLabel}>{m.l}</Text>
                </View>
              ))}
            </View>

            {ai_analysis?.detected_ingredients?.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <Text style={styles.subsectionLabel}>Ingredients</Text>
                <View style={styles.ingredientsWrap}>
                  {ai_analysis.detected_ingredients.map((ing: string, i: number) => (
                    <View key={i} style={styles.ingredientChip}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.secondaryCta} onPress={handleRetake} activeOpacity={0.85}>
              <Text style={styles.secondaryCtaText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cta, { flex: 2 }]} onPress={handleLogFood} activeOpacity={0.9}>
              <Text style={styles.ctaText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error && capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} blurRadius={2} />
        <View style={styles.dimVeil} />
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelHit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View />
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.foodName}>
            Couldn't <Text style={styles.foodNameItalic}>read it</Text>
          </Text>
          <Text style={styles.portion}>{error}</Text>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.secondaryCta} onPress={handleRetake} activeOpacity={0.85}>
              <Text style={styles.secondaryCtaText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, { flex: 2 }]}
              onPress={() => (navigation as any).navigate('SearchFood')}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>Search instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Analyzing state
  if (analyzing && capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} blurRadius={2} />
        <View style={styles.dimVeil} />
        <View style={styles.analyzingPill}>
          <ActivityIndicator size="small" color="#B84C3F" />
          <Text style={styles.analyzingText}>Analyzing your food…</Text>
        </View>
      </View>
    );
  }

  // Camera capture
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} facing="back" style={StyleSheet.absoluteFillObject} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelHit} accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topKicker}>AI ESTIMATION</Text>
        <View style={{ width: 56 }} />
      </View>

      {/* Center frame brackets */}
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.frameHint}>Center your food in the frame</Text>
      </View>

      <View style={[styles.captureWrap, { bottom: 60 + insets.bottom }]}>
        <CaptureButton onPress={handleTakePhoto} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C09',
  },
  dimVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,12,9,0.45)',
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cancelHit: {
    paddingVertical: 8,
    minWidth: 56,
  },
  cancelText: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#F6F1EA',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  topKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: 'rgba(246,241,234,0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#B84C3F',
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },
  frameHint: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  captureWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  analyzingPill: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  analyzingText: {
    fontFamily: theme.typography.fontFamily.medium,
    color: '#2B221B',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F6F1EA',
    borderRadius: 100,
    overflow: 'hidden',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    maxHeight: '78%',
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0D5',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sheetKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.4,
  },
  confidence: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
  foodName: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 26,
    color: '#2B221B',
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: 4,
  },
  foodNameItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  portion: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
    marginTop: 6,
  },
  kcalRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  kcalValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 38,
    color: '#2B221B',
    letterSpacing: -1,
    lineHeight: 42,
  },
  kcalUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
  },
  macroRow: {
    marginTop: 14,
    flexDirection: 'row',
    backgroundColor: '#FCF8F1',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    paddingVertical: 12,
  },
  macroItem: { flex: 1, alignItems: 'center' },
  macroDivider: { borderRightWidth: 0.5, borderRightColor: '#E8E0D5' },
  macroValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
  },
  macroValueG: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
  macroLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  subsectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  ingredientsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientChip: {
    backgroundColor: '#EFE7DC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  ingredientText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#2B221B',
    letterSpacing: 0.2,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryCta: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#FCF8F1',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#2B221B',
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
